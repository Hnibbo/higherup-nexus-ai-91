import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useMobile } from '@/hooks/useMobile';

interface MobileOptimizedProps {
  children: ReactNode;
  className?: string;
  mobileClassName?: string;
  tabletClassName?: string;
  desktopClassName?: string;
}

export const MobileOptimized = ({ 
  children, 
  className = '', 
  mobileClassName = '',
  tabletClassName = '',
  desktopClassName = ''
}: MobileOptimizedProps) => {
  const { isMobile, isTablet, isDesktop } = useMobile();

  const responsiveClass = isMobile 
    ? mobileClassName 
    : isTablet 
      ? tabletClassName 
      : desktopClassName;

  return (
    <motion.div 
      className={`${className} ${responsiveClass}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

// Touch-optimized button component
export const TouchButton = ({ 
  children, 
  className = '', 
  ...props 
}: any) => {
  const { isMobile } = useMobile();
  
  return (
    <motion.button
      className={`${className} ${isMobile ? 'min-h-[44px] min-w-[44px]' : ''} 
        touch-manipulation select-none`}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.1 }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

// Mobile-first container
export const MobileContainer = ({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string; 
}) => (
  <div className={`container-mobile ${className}`}>
    {children}
  </div>
);

// Responsive grid
export const ResponsiveGrid = ({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string; 
}) => (
  <div className={`grid-mobile ${className}`}>
    {children}
  </div>
);