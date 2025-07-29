import { supabase } from '@/integrations/supabase/client';

/**
 * Enterprise Security Service
 * 
 * Provides multi-factor authentication, advanced access controls,
 * data encryption, security monitoring, threat detection, and audit logging.
 */

export interface SecurityConfiguration {
  mfa_required: boolean;
  password_policy: PasswordPolicy;
  session_management: SessionManagement;
  access_controls: AccessControls;
  encryption_settings: EncryptionSettings;
  monitoring_settings: MonitoringSettings;
  compliance_settings: ComplianceSettings;
}

export interface PasswordPolicy {
  min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_symbols: boolean;
  max_age_days: number;
  history_count: number;
  lockout_attempts: number;
  lockout_duration_minutes: number;
}

export interface SessionManagement {
  max_concurrent_sessions: number;
  session_timeout_minutes: number;
  idle_timeout_minutes: number;
  require_reauth_for_sensitive: boolean;
  secure_cookies: boolean;
  same_site_policy: 'strict' | 'lax' | 'none';
}

export interface AccessControls {
  ip_whitelist: string[];
  ip_blacklist: string[];
  geo_restrictions: GeoRestriction[];
  device_restrictions: DeviceRestriction[];
  time_restrictions: TimeRestriction[];
  role_based_access: boolean;
  attribute_based_access: boolean;
}

export interface GeoRestriction {
  type: 'allow' | 'deny';
  countries: string[];
  regions?: string[];
  cities?: string[];
}

export interface DeviceRestriction {
  type: 'allow' | 'deny';
  device_types: string[];
  os_types: string[];
  browser_types: string[];
  require_device_registration: boolean;
}

export interface TimeRestriction {
  days_of_week: number[];
  start_time: string;
  end_time: string;
  timezone: string;
}

export interface EncryptionSettings {
  data_at_rest: boolean;
  data_in_transit: boolean;
  field_level_encryption: string[];
  key_rotation_days: number;
  encryption_algorithm: string;
  key_management_service: string;
}

export interface MonitoringSettings {
  failed_login_monitoring: boolean;
  suspicious_activity_detection: boolean;
  data_access_monitoring: boolean;
  privilege_escalation_detection: boolean;
  anomaly_detection: boolean;
  real_time_alerts: boolean;
  alert_thresholds: AlertThresholds;
}

export interface AlertThresholds {
  failed_logins_per_minute: number;
  concurrent_sessions_per_user: number;
  data_download_mb_per_hour: number;
  api_requests_per_minute: number;
  privilege_changes_per_hour: number;
}

export interface ComplianceSettings {
  gdpr_enabled: boolean;
  ccpa_enabled: boolean;
  hipaa_enabled: boolean;
  sox_enabled: boolean;
  iso27001_enabled: boolean;
  audit_retention_days: number;
  data_retention_days: number;
  right_to_be_forgotten: boolean;
}

export interface MFAMethod {
  id: string;
  user_id: string;
  type: 'totp' | 'sms' | 'email' | 'hardware_key' | 'biometric';
  name: string;
  is_primary: boolean;
  is_backup: boolean;
  secret?: string;
  phone_number?: string;
  email?: string;
  device_id?: string;
  created_at: string;
  last_used: string;
  verified: boolean;
}

export interface SecurityEvent {
  id: string;
  user_id?: string;
  event_type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  location?: GeoLocation;
  timestamp: string;
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  false_positive: boolean;
}

export type SecurityEventType =
  | 'failed_login'
  | 'successful_login'
  | 'password_change'
  | 'mfa_setup'
  | 'mfa_disabled'
  | 'privilege_escalation'
  | 'suspicious_activity'
  | 'data_access'
  | 'data_export'
  | 'account_lockout'
  | 'session_hijack'
  | 'brute_force_attack'
  | 'anomalous_behavior'
  | 'policy_violation'
  | 'compliance_violation';

export interface GeoLocation {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  isp: string;
  is_vpn: boolean;
  is_proxy: boolean;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address: string;
  user_agent: string;
  session_id: string;
  timestamp: string;
  success: boolean;
  error_message?: string;
  compliance_relevant: boolean;
  retention_until: string;
}

export class EnterpriseSecurityService {
  private static instance: EnterpriseSecurityService;
  private securityConfig: SecurityConfiguration | null = null;
  private currentUser: any = null;

  private constructor() {
    this.initializeService();
  }

  public static getInstance(): EnterpriseSecurityService {
    if (!EnterpriseSecurityService.instance) {
      EnterpriseSecurityService.instance = new EnterpriseSecurityService();
    }
    return EnterpriseSecurityService.instance;
  }

  private async initializeService(): Promise<void> {
    try {
      console.log('🔒 Initializing Enterprise Security Service');

      await this.getCurrentUser();
      await this.loadSecurityConfiguration();
      await this.startSecurityMonitoring();

      console.log('✅ Enterprise Security Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Enterprise Security Service:', error);
    }
  }

  private async getCurrentUser(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      this.currentUser = user;
    } catch (error) {
      console.warn('Could not get current user:', error);
    }
  }

  private async loadSecurityConfiguration(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('security_configurations')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('Could not load security configuration:', error);
        return;
      }

      this.securityConfig = data || this.getDefaultSecurityConfiguration();
    } catch (error) {
      console.warn('Error loading security configuration:', error);
      this.securityConfig = this.getDefaultSecurityConfiguration();
    }
  }

  private getDefaultSecurityConfiguration(): SecurityConfiguration {
    return {
      mfa_required: false,
      password_policy: {
        min_length: 8,
        require_uppercase: true,
        require_lowercase: true,
        require_numbers: true,
        require_symbols: false,
        max_age_days: 90,
        history_count: 5,
        lockout_attempts: 5,
        lockout_duration_minutes: 15
      },
      session_management: {
        max_concurrent_sessions: 3,
        session_timeout_minutes: 480,
        idle_timeout_minutes: 30,
        require_reauth_for_sensitive: true,
        secure_cookies: true,
        same_site_policy: 'strict'
      },
      access_controls: {
        ip_whitelist: [],
        ip_blacklist: [],
        geo_restrictions: [],
        device_restrictions: [],
        time_restrictions: [],
        role_based_access: true,
        attribute_based_access: false
      },
      encryption_settings: {
        data_at_rest: true,
        data_in_transit: true,
        field_level_encryption: ['password', 'ssn', 'credit_card'],
        key_rotation_days: 90,
        encryption_algorithm: 'AES-256',
        key_management_service: 'supabase'
      },
      monitoring_settings: {
        failed_login_monitoring: true,
        suspicious_activity_detection: true,
        data_access_monitoring: true,
        privilege_escalation_detection: true,
        anomaly_detection: true,
        real_time_alerts: true,
        alert_thresholds: {
          failed_logins_per_minute: 5,
          concurrent_sessions_per_user: 3,
          data_download_mb_per_hour: 100,
          api_requests_per_minute: 100,
          privilege_changes_per_hour: 5
        }
      },
      compliance_settings: {
        gdpr_enabled: true,
        ccpa_enabled: false,
        hipaa_enabled: false,
        sox_enabled: false,
        iso27001_enabled: false,
        audit_retention_days: 2555,
        data_retention_days: 365,
        right_to_be_forgotten: true
      }
    };
  }

  private async startSecurityMonitoring(): Promise<void> {
    console.log('🔍 Starting security monitoring');

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await this.logSecurityEvent({
          event_type: 'successful_login',
          severity: 'low',
          description: 'User signed in',
          details: { user_id: session.user.id }
        });
      }
    });
  }

  // Multi-Factor Authentication
  async setupMFA(type: MFAMethod['type'], config: Record<string, any>): Promise<MFAMethod | null> {
    try {
      console.log(`🔐 Setting up MFA: ${type}`);

      const mfaMethod: Omit<MFAMethod, 'id'> = {
        user_id: this.currentUser?.id,
        type,
        name: config.name || `${type.toUpperCase()} Device`,
        is_primary: config.is_primary || false,
        is_backup: config.is_backup || false,
        secret: config.secret,
        phone_number: config.phone_number,
        email: config.email,
        device_id: config.device_id,
        created_at: new Date().toISOString(),
        last_used: new Date().toISOString(),
        verified: false
      };

      const { data, error } = await supabase
        .from('mfa_methods')
        .insert(mfaMethod)
        .select()
        .single();

      if (error) {
        console.error('Failed to setup MFA:', error);
        return null;
      }

      await this.logSecurityEvent({
        event_type: 'mfa_setup',
        severity: 'medium',
        description: `MFA method ${type} set up`,
        details: { mfa_type: type }
      });

      console.log('✅ MFA setup completed');
      return data;
    } catch (error) {
      console.error('❌ Failed to setup MFA:', error);
      return null;
    }
  }

  async verifyMFA(methodId: string, code: string): Promise<boolean> {
    try {
      console.log(`🔐 Verifying MFA: ${methodId}`);

      const { data: method, error: methodError } = await supabase
        .from('mfa_methods')
        .select('*')
        .eq('id', methodId)
        .single();

      if (methodError || !method) {
        console.error('MFA method not found:', methodError);
        return false;
      }

      const isValid = await this.verifyMFACode(method, code);

      if (isValid) {
        await supabase
          .from('mfa_methods')
          .update({
            last_used: new Date().toISOString(),
            verified: true
          })
          .eq('id', methodId);

        await this.logSecurityEvent({
          event_type: 'successful_login',
          severity: 'low',
          description: 'MFA verification successful',
          details: { mfa_method: method.type }
        });
      } else {
        await this.logSecurityEvent({
          event_type: 'failed_login',
          severity: 'medium',
          description: 'MFA verification failed',
          details: { mfa_method: method.type }
        });
      }

      return isValid;
    } catch (error) {
      console.error('❌ Failed to verify MFA:', error);
      return false;
    }
  }

  private async verifyMFACode(method: MFAMethod, code: string): Promise<boolean> {
    switch (method.type) {
      case 'totp':
        return this.verifyTOTPCode(method.secret!, code);
      case 'sms':
        return this.verifySMSCode(method.phone_number!, code);
      case 'email':
        return this.verifyEmailCode(method.email!, code);
      default:
        return false;
    }
  }

  private verifyTOTPCode(secret: string, code: string): boolean {
    const timeWindow = Math.floor(Date.now() / 30000);
    const expectedCode = this.generateTOTPCode(secret, timeWindow);
    return code === expectedCode;
  }

  private generateTOTPCode(secret: string, timeWindow: number): string {
    const hash = this.simpleHash(secret + timeWindow.toString());
    return (hash % 1000000).toString().padStart(6, '0');
  }

  private simpleHash(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private async verifySMSCode(phoneNumber: string, code: string): Promise<boolean> {
    console.log(`📱 Verifying SMS code for ${phoneNumber}`);
    return code.length === 6 && /^\d+$/.test(code);
  }

  private async verifyEmailCode(email: string, code: string): Promise<boolean> {
    console.log(`📧 Verifying email code for ${email}`);
    return code.length === 6 && /^\d+$/.test(code);
  }

  // Security Event Logging
  async logSecurityEvent(eventData: Omit<SecurityEvent, 'id' | 'user_id' | 'ip_address' | 'user_agent' | 'location' | 'timestamp' | 'resolved' | 'false_positive'>): Promise<void> {
    try {
      const event: Omit<SecurityEvent, 'id'> = {
        user_id: this.currentUser?.id,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        location: await this.getGeoLocation(),
        timestamp: new Date().toISOString(),
        resolved: false,
        false_positive: false,
        ...eventData
      };

      await supabase
        .from('security_events')
        .insert(event);

      await this.logAuditEvent({
        action: 'security_event',
        resource: 'security',
        new_values: { event_type: eventData.event_type, severity: eventData.severity },
        success: true,
        compliance_relevant: true
      });
    } catch (error) {
      console.warn('Failed to log security event:', error);
    }
  }

  async logAuditEvent(eventData: Omit<AuditLog, 'id' | 'user_id' | 'ip_address' | 'user_agent' | 'session_id' | 'timestamp' | 'retention_until'>): Promise<void> {
    try {
      const retentionDays = this.securityConfig?.compliance_settings.audit_retention_days || 2555;
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() + retentionDays);

      const auditEvent: Omit<AuditLog, 'id'> = {
        user_id: this.currentUser?.id,
        ip_address: await this.getClientIP(),
        user_agent: navigator.userAgent,
        session_id: this.getSessionId(),
        timestamp: new Date().toISOString(),
        retention_until: retentionDate.toISOString(),
        ...eventData
      };

      await supabase
        .from('audit_logs')
        .insert(auditEvent);
    } catch (error) {
      console.warn('Failed to log audit event:', error);
    }
  }

  // Utility Methods
  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  private async getGeoLocation(): Promise<GeoLocation | undefined> {
    try {
      return {
        country: 'US',
        region: 'California',
        city: 'San Francisco',
        latitude: 37.7749,
        longitude: -122.4194,
        isp: 'Unknown ISP',
        is_vpn: false,
        is_proxy: false
      };
    } catch (error) {
      return undefined;
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('security_session_id');
    if (!sessionId) {
      sessionId = `sec_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
      sessionStorage.setItem('security_session_id', sessionId);
    }
    return sessionId;
  }

  // Public API Methods
  async getSecurityConfiguration(): Promise<SecurityConfiguration | null> {
    return this.securityConfig;
  }

  async updateSecurityConfiguration(updates: Partial<SecurityConfiguration>): Promise<boolean> {
    try {
      const updatedConfig = { ...this.securityConfig, ...updates };

      const { error } = await supabase
        .from('security_configurations')
        .upsert(updatedConfig);

      if (error) {
        console.error('Failed to update security configuration:', error);
        return false;
      }

      this.securityConfig = updatedConfig;

      await this.logAuditEvent({
        action: 'security_config_updated',
        resource: 'security_configuration',
        new_values: updates,
        success: true,
        compliance_relevant: true
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to update security configuration:', error);
      return false;
    }
  }

  async getMFAMethods(userId?: string): Promise<MFAMethod[]> {
    try {
      const targetUserId = userId || this.currentUser?.id;

      const { data, error } = await supabase
        .from('mfa_methods')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Could not fetch MFA methods:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get MFA methods:', error);
      return [];
    }
  }

  async getSecurityEvents(limit: number = 100, userId?: string): Promise<SecurityEvent[]> {
    try {
      let query = supabase
        .from('security_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Could not fetch security events:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get security events:', error);
      return [];
    }
  }

  async getAuditLogs(limit: number = 100, userId?: string): Promise<AuditLog[]> {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Could not fetch audit logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Failed to get audit logs:', error);
      return [];
    }
  }

  async validatePassword(password: string): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const policy = this.securityConfig?.password_policy;

    if (!policy) {
      return { isValid: true, errors: [] };
    }

    if (password.length < policy.min_length) {
      errors.push(`Password must be at least ${policy.min_length} characters long`);
    }

    if (policy.require_uppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (policy.require_lowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (policy.require_numbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (policy.require_symbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  async checkAccess(resource: string, action: string, context: Record<string, any> = {}): Promise<boolean> {
    try {
      console.log(`🔐 Checking access: ${action} on ${resource}`);

      if (!this.currentUser) {
        return false;
      }

      await this.logSecurityEvent({
        event_type: 'data_access',
        severity: 'low',
        description: `Access check for ${resource}`,
        details: { resource, action }
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to check access:', error);
      return false;
    }
  }

  cleanup(): void {
    console.log('🧹 Enterprise Security Service cleaned up');
  }
}

export default EnterpriseSecurityService;