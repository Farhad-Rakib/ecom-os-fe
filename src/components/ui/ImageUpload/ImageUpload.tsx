import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<string>;
  label?: string;
  hint?: string;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  previewSize?: 'sm' | 'md' | 'lg';
  shape?: 'circle' | 'rounded';
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onUpload,
  label = 'Upload Image',
  hint,
  accept = 'image/png,image/jpeg,image/webp,image/gif',
  maxSizeMB = 5,
  className = '',
  previewSize = 'md',
  shape = 'rounded',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-32 h-32',
    lg: 'w-40 h-40',
  };

  const shapeClasses = shape === 'circle' ? 'rounded-full' : 'rounded-xl';

  const validateFile = (file: File): string | null => {
    const allowedTypes = accept.split(',').map(t => t.trim());
    if (!allowedTypes.includes(file.type)) {
      return `Invalid file type. Allowed: ${allowedTypes.map(t => t.split('/')[1]).join(', ')}`;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File too large. Max size: ${maxSizeMB}MB`;
    }
    return null;
  };

  const handleFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const url = await onUpload(file);
      onChange(url);
    } catch (err: any) {
      setError(err?.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [onUpload, onChange, accept, maxSizeMB]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = () => {
    onChange('');
    setError(null);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div className="flex items-start gap-4">
        {/* Preview */}
        {value ? (
          <div className="relative group">
            <img
              src={value}
              alt="Uploaded"
              className={`${sizeClasses[previewSize]} ${shapeClasses} object-cover border-2 border-gray-200 dark:border-gray-700 shadow-sm`}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <button
              type="button"
              onClick={handleRemove}
              className={`absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div
            className={`${sizeClasses[previewSize]} ${shapeClasses} border-2 border-dashed flex items-center justify-center transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
            }`}
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            ) : (
              <ImageIcon className="w-6 h-6 text-gray-400" />
            )}
          </div>
        )}

        {/* Upload Area */}
        <div
          className="flex-1"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div
            className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
              isDragging
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/10'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2 py-2">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                <span className="text-sm text-gray-500 dark:text-gray-400">Uploading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-2">
                <Upload className="w-6 h-6 text-gray-400" />
                <div>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Click to upload</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400"> or drag and drop</span>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  PNG, JPG, WEBP up to {maxSizeMB}MB
                </span>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleInputChange}
              className="hidden"
            />
          </div>

          {hint && !error && (
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
          )}

          {error && (
            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
};
