import React, { useState, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  sizes,
  priority = false,
  loading = 'lazy',
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Generate optimized image URLs based on device capabilities
    const generateOptimizedSrc = () => {
      // Check if browser supports WebP
      const supportsWebP = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      };

      // Check device pixel ratio for high-DPI displays
      const devicePixelRatio = window.devicePixelRatio || 1;
      
      // Determine optimal image format
      const format = supportsWebP() ? 'webp' : 'jpg';
      
      // Calculate optimal dimensions
      const optimalWidth = width ? Math.round(width * devicePixelRatio) : undefined;
      const optimalHeight = height ? Math.round(height * devicePixelRatio) : undefined;

      // For now, return original src (in production, integrate with image optimization service)
      // Example with a CDN: `https://cdn.example.com/optimize?src=${src}&w=${optimalWidth}&h=${optimalHeight}&f=${format}`
      return src;
    };

    setCurrentSrc(generateOptimizedSrc());
  }, [src, width, height]);

  useEffect(() => {
    if (!imgRef.current || isLoaded || isError) return;

    const img = imgRef.current;

    // Use Intersection Observer for lazy loading
    if (!priority && loading === 'lazy') {
      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting) {
            img.src = currentSrc;
            observer.unobserve(img);
          }
        },
        {
          rootMargin: '50px' // Start loading 50px before entering viewport
        }
      );

      observer.observe(img);

      return () => observer.unobserve(img);
    } else {
      // Load immediately for priority images
      img.src = currentSrc;
    }
  }, [currentSrc, priority, loading, isLoaded, isError]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setIsError(true);
    onError?.();
  };

  if (isError) {
    return (
      <div 
        className={`bg-muted flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-muted-foreground text-sm">Failed to load image</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {!isLoaded && (
        <Skeleton 
          className="absolute inset-0 w-full h-full" 
          style={{ width, height }} 
        />
      )}
      <img
        ref={imgRef}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : loading}
        decoding="async"
        style={{
          maxWidth: '100%',
          height: 'auto',
          ...(width && height ? { aspectRatio: `${width}/${height}` } : {})
        }}
      />
    </div>
  );
};

// Hook for progressive image loading
export const useProgressiveImage = (src: string, placeholder?: string) => {
  const [imgSrc, setImgSrc] = useState(placeholder || '');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImgSrc(src);
      setIsLoading(false);
    };
    img.src = src;
  }, [src]);

  return { imgSrc, isLoading };
};