import React, { useState, useEffect, useRef } from 'react';

const DEFAULT_FALLBACK =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=85';

export const ImageWithFallback = ({
  src,
  alt = 'SHREE श्री Luxury Hospitality',
  className = '',
  style = {},
  fallback = DEFAULT_FALLBACK,
  loading = 'lazy',
  fetchPriority = 'auto',
  ...props
}) => {
  const initialSource = src && typeof src === 'string' && src.trim() !== '' ? src : fallback;
  const [currentSrc, setCurrentSrc] = useState(initialSource);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const imgRef = useRef(null);

  // Synchronize state when the parent updates src (e.g. user clicks thumbnail)
  useEffect(() => {
    const validSrc = src && typeof src === 'string' && src.trim() !== '' ? src : fallback;
    setCurrentSrc(validSrc);
    setHasError(false);

    // Check if the image is already cached / completed by the browser
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    // Safety timeout: never leave image in a permanent loading shimmer
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [src, fallback]);

  const handleError = () => {
    if (!hasError && currentSrc !== fallback) {
      setHasError(true);
      setCurrentSrc(fallback);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#EDE8DF', // Warm sandstone backdrop
        display: 'inline-block',
        width: style.width || '100%',
        height: style.height || '100%',
        borderRadius: style.borderRadius || 'inherit',
      }}
    >
      {/* Shimmer skeleton overlay that gently fades out once loaded */}
      {isLoading && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, #F0EAE1 0%, #FAF6F0 50%, #F0EAE1 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
            zIndex: 1,
            pointerEvents: 'none',
            transition: 'opacity 0.25s ease-out',
          }}
        />
      )}
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        onError={handleError}
        onLoad={handleLoad}
        loading={loading}
        fetchpriority={fetchPriority}
        className={className}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          opacity: 1,
          transition: 'transform 0.3s ease-out',
          ...style,
        }}
        {...props}
      />
    </div>
  );
};

export default ImageWithFallback;
