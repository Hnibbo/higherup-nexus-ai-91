#!/bin/bash

# HigherUp.ai Production Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

# Configuration
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="/backups"
LOG_FILE="/var/log/deploy.log"
HEALTH_CHECK_URL="https://higherup.ai/health"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Send notification to Slack
notify_slack() {
    local message="$1"
    local color="$2"
    
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"attachments\":[{\"color\":\"$color\",\"text\":\"$message\"}]}" \
            "$SLACK_WEBHOOK_URL" || true
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running"
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if required environment file exists
    if [ ! -f ".env.production" ]; then
        error "Production environment file (.env.production) not found"
        exit 1
    fi
    
    success "Prerequisites check passed"
}

# Create backup before deployment
create_backup() {
    log "Creating backup before deployment..."
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$BACKUP_FILE"; then
        success "Database backup created: $BACKUP_FILE"
    else
        error "Failed to create database backup"
        exit 1
    fi
    
    # Backup application data
    if [ -d "uploads" ]; then
        tar -czf "$BACKUP_DIR/uploads_$(date +%Y%m%d_%H%M%S).tar.gz" uploads/
        success "Application data backup created"
    fi
}

# Build and deploy application
deploy_application() {
    log "Starting deployment..."
    
    # Load production environment
    export $(cat .env.production | xargs)
    
    # Pull latest images
    log "Pulling latest Docker images..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" pull
    
    # Build application image
    log "Building application image..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache app
    
    # Stop existing containers gracefully
    log "Stopping existing containers..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down --timeout 30
    
    # Start new containers
    log "Starting new containers..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    success "Deployment completed"
}

# Health check
health_check() {
    log "Performing health check..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log "Health check attempt $attempt/$max_attempts"
        
        if curl -f -s "$HEALTH_CHECK_URL" > /dev/null; then
            success "Health check passed"
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
    return 1
}

# Rollback function
rollback() {
    error "Deployment failed, initiating rollback..."
    
    # Stop current containers
    docker-compose -f "$DOCKER_COMPOSE_FILE" down --timeout 30
    
    # Restore from backup
    if [ -n "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ]; then
        log "Restoring database from backup..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" up -d postgres
        sleep 30
        docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$BACKUP_FILE"
    fi
    
    # Start previous version (assuming it's tagged as 'previous')
    log "Starting previous version..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d
    
    notify_slack "🚨 Deployment failed and rollback initiated for HigherUp.ai" "danger"
}

# Cleanup old images and containers
cleanup() {
    log "Cleaning up old Docker images and containers..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused containers
    docker container prune -f
    
    # Remove unused volumes (be careful with this)
    # docker volume prune -f
    
    success "Cleanup completed"
}

# Setup SSL certificates
setup_ssl() {
    log "Setting up SSL certificates..."
    
    # Create SSL directory
    mkdir -p ssl
    
    # Generate certificates using Let's Encrypt
    docker-compose -f "$DOCKER_COMPOSE_FILE" run --rm certbot
    
    # Reload nginx to use new certificates
    docker-compose -f "$DOCKER_COMPOSE_FILE" exec nginx nginx -s reload
    
    success "SSL certificates configured"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Start monitoring services
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d prometheus grafana elasticsearch kibana
    
    # Wait for services to be ready
    sleep 60
    
    # Import Grafana dashboards
    if [ -d "monitoring/grafana/dashboards" ]; then
        log "Importing Grafana dashboards..."
        # Dashboard import logic here
    fi
    
    success "Monitoring setup completed"
}

# Main deployment function
main() {
    log "Starting HigherUp.ai production deployment..."
    notify_slack "🚀 Starting deployment for HigherUp.ai" "good"
    
    # Trap errors and rollback
    trap rollback ERR
    
    check_prerequisites
    create_backup
    deploy_application
    
    if health_check; then
        cleanup
        success "Deployment completed successfully!"
        notify_slack "✅ HigherUp.ai deployment completed successfully!" "good"
    else
        error "Deployment failed health check"
        rollback
        exit 1
    fi
}

# Command line options
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback
        ;;
    "health")
        health_check
        ;;
    "backup")
        create_backup
        ;;
    "ssl")
        setup_ssl
        ;;
    "monitoring")
        setup_monitoring
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health|backup|ssl|monitoring|cleanup}"
        echo ""
        echo "Commands:"
        echo "  deploy     - Full deployment process (default)"
        echo "  rollback   - Rollback to previous version"
        echo "  health     - Perform health check"
        echo "  backup     - Create backup"
        echo "  ssl        - Setup SSL certificates"
        echo "  monitoring - Setup monitoring stack"
        echo "  cleanup    - Clean up old Docker resources"
        exit 1
        ;;
esac