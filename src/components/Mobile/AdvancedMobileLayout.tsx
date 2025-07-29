/**
 * Advanced Mobile Layout Component
 * Responsive mobile-first layout with PWA features, gesture support,
 * and native-like navigation
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  BarChart3, 
  Users, 
  Mail, 
  Zap, 
  Settings, 
  Menu, 
  X, 
  ChevronLeft,
  Search,
  Bell,
  User,
  Wifi,
  WifiOff,
  Download,
  Share,
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { advancedPWAService } from '@/services/pwa/AdvancedPWAService';

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  showSearch?: boolean;
  actions?: React.ReactNode;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
  badge?: number;
  disabled?: boolean;
}

export const AdvancedMobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  title,
  showBackButton = false,
  showSearch = false,
  actions
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [notifications, setNotifications] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [pullToRefresh, setPullToRefresh] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const navigationItems: NavigationItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { id: 'crm', label: 'CRM', icon: Users, path: '/crm' },
    { id: 'email', label: 'Email', icon: Mail, path: '/email', badge: 3 },
    { id: 'automation', label: 'Automation', icon: Zap, path: '/automation' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
  ];

  useEffect(() => {
    // Network status monitoring
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Scroll detection
    const handleScroll = () => {
      if (contentRef.current) {
        setIsScrolled(contentRef.current.scrollTop > 10);
      }
    };

    const content = contentRef.current;
    if (content) {
      content.addEventListener('scroll', handleScroll);
    }

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      if (content) {
        content.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  // Touch gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !contentRef.current) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStart.y;
    const deltaX = touch.clientX - touchStart.x;

    // Pull to refresh
    if (deltaY > 0 && contentRef.current.scrollTop === 0 && Math.abs(deltaX) < 50) {
      if (deltaY > 100) {
        setPullToRefresh(true);
      }
    }

    // Swipe navigation
    if (Math.abs(deltaX) > 100 && Math.abs(deltaY) < 50) {
      if (deltaX > 0 && showBackButton) {
        // Swipe right - go back
        navigate(-1);
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullToRefresh) {
      handleRefresh();
      setPullToRefresh(false);
    }
    setTouchStart(null);
  };

  const handleRefresh = async () => {
    // Trigger refresh
    window.location.reload();
  };

  const handleInstallApp = async () => {
    if (installPrompt) {
      const result = await advancedPWAService.showInstallPrompt();
      if (result) {
        setInstallPrompt(null);
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'HigherUp.ai',
          text: 'Check out this amazing marketing automation platform!',
          url: window.location.href
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const getCurrentPageTitle = () => {
    if (title) return title;
    
    const currentItem = navigationItems.find(item => 
      location.pathname.startsWith(item.path)
    );
    return currentItem?.label || 'HigherUp.ai';
  };

  const isCurrentPath = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Status Bar */}
      <div className="bg-blue-600 text-white px-4 py-1 text-xs flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Wifi className="h-3 w-3" />
          ) : (
            <WifiOff className="h-3 w-3" />
          )}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
        <div className="flex items-center space-x-2">
          {installPrompt && (
            <Button
              size="sm"
              variant="ghost"
              className="text-white h-6 px-2 text-xs"
              onClick={handleInstallApp}
            >
              <Download className="h-3 w-3 mr-1" />
              Install
            </Button>
          )}
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Header */}
      <header className={`bg-white border-b transition-shadow duration-200 ${
        isScrolled ? 'shadow-md' : ''
      }`}>
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            {showBackButton ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="p-2"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            ) : (
              <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <MobileNavigation 
                    items={navigationItems}
                    currentPath={location.pathname}
                    onNavigate={(path) => {
                      navigate(path);
                      setIsMenuOpen(false);
                    }}
                  />
                </SheetContent>
              </Sheet>
            )}
            
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {getCurrentPageTitle()}
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            {showSearch && (
              <Button variant="ghost" size="sm" className="p-2">
                <Search className="h-5 w-5" />
              </Button>
            )}
            
            <Button variant="ghost" size="sm" className="p-2 relative">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 text-xs p-0 flex items-center justify-center">
                  {notifications}
                </Badge>
              )}
            </Button>

            <Button variant="ghost" size="sm" className="p-2" onClick={handleShare}>
              <Share className="h-5 w-5" />
            </Button>

            {actions && (
              <div className="flex items-center space-x-1">
                {actions}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Pull to Refresh Indicator */}
      {pullToRefresh && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-center text-sm text-blue-600">
          Release to refresh...
        </div>
      )}

      {/* Main Content */}
      <main 
        ref={contentRef}
        className="flex-1 overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="min-h-full">
          {children}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 px-2 py-1">
        <div className="flex items-center justify-around">
          {navigationItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            const isActive = isCurrentPath(item.path);
            
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                disabled={item.disabled}
                className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {item.badge && item.badge > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-4 w-4 text-xs p-0 flex items-center justify-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

interface MobileNavigationProps {
  items: NavigationItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  items,
  currentPath,
  onNavigate
}) => {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">John Doe</h3>
            <p className="text-sm text-gray-500">john@example.com</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath.startsWith(item.path);
            
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.path)}
                disabled={item.disabled}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-50'
                } ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <Badge className="ml-auto">
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>HigherUp.ai v1.0.0</span>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedMobileLayout;