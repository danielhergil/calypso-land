/**
 * Image compression utility for optimizing uploads to Firebase Storage
 * Compresses images while maintaining good quality
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/png' | 'image/webp';
  maxSizeKB?: number;
}

const defaultOptions: CompressionOptions = {
  maxWidth: 512,
  maxHeight: 512,
  quality: 0.8,
  format: 'image/jpeg',
  maxSizeKB: 200
};

/**
 * Compresses an image file while maintaining aspect ratio
 * @param file - The original image file
 * @param options - Compression options
 * @returns Promise<File> - Compressed image file
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  const opts = { ...defaultOptions, ...options };
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    const handleLoad = () => {
      // Calculate new dimensions while maintaining aspect ratio
      const { width: newWidth, height: newHeight } = calculateDimensions(
        img.width,
        img.height,
        opts.maxWidth!,
        opts.maxHeight!
      );

      // Set canvas dimensions
      canvas.width = newWidth;
      canvas.height = newHeight;

      // Draw and compress the image
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Convert to blob with compression
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            reject(new Error('Image compression failed'));
            return;
          }

          // Check if we need further compression to meet size requirements
          if (opts.maxSizeKB && blob.size > opts.maxSizeKB * 1024) {
            // Try with lower quality
            const lowerQuality = Math.max(0.1, opts.quality! * 0.7);
            try {
              const furtherCompressed = await compressImage(file, {
                ...opts,
                quality: lowerQuality,
                maxSizeKB: undefined // Avoid infinite recursion
              });
              resolve(furtherCompressed);
              return;
            } catch (error) {
              // If further compression fails, use current result
            }
          }

          // Create compressed file
          const compressedFile = new File(
            [blob],
            `compressed_${file.name}`,
            {
              type: opts.format!,
              lastModified: Date.now()
            }
          );

          resolve(compressedFile);
        },
        opts.format!,
        opts.quality!
      );
    };

    img.onload = handleLoad;
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Create object URL and load image
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    // Clean up object URL after image loads
    img.addEventListener('load', () => {
      URL.revokeObjectURL(objectUrl);
    }, { once: true });
  });
};

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
const calculateDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } => {
  let { width, height } = { width: originalWidth, height: originalHeight };

  // Scale down if too wide
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  // Scale down if too tall
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return {
    width: Math.round(width),
    height: Math.round(height)
  };
};

/**
 * Get optimal compression settings for team logos
 */
export const getLogoCompressionOptions = (): CompressionOptions => ({
  maxWidth: 512,
  maxHeight: 512,
  quality: 0.85,
  format: 'image/jpeg',
  maxSizeKB: 150
});

/**
 * Validate if file is a supported image format
 */
export const isValidImageFile = (file: File): boolean => {
  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return supportedTypes.includes(file.type);
};

/**
 * Get human readable file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};