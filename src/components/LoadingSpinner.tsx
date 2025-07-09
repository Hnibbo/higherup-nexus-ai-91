import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export const LoadingSpinner = ({ size = 'md', className, text }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
    </div>
  );
};

export const PageLoader = ({ text = 'Loading...' }: { text?: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
    <LoadingSpinner size="lg" text={text} />
  </div>
);

export const SkeletonCard = ({ className }: { className?: string }) => (
  <div className={cn('animate-pulse', className)}>
    <div className="bg-muted rounded-lg h-48 mb-4"></div>
    <div className="space-y-2">
      <div className="bg-muted rounded h-4 w-3/4"></div>
      <div className="bg-muted rounded h-4 w-1/2"></div>
    </div>
  </div>
);

export const SkeletonList = ({ items = 3 }: { items?: number }) => (
  <div className="space-y-4">
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="animate-pulse flex items-center space-x-4">
        <div className="bg-muted rounded-full w-12 h-12"></div>
        <div className="flex-1 space-y-2">
          <div className="bg-muted rounded h-4 w-3/4"></div>
          <div className="bg-muted rounded h-4 w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);

export default LoadingSpinner;