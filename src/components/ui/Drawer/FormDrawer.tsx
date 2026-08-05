import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { DynamicForm, FormField } from '../../form/DynamicForm';

type DrawerPosition = 'left' | 'right';
type DrawerSize = 'sm' | 'md' | 'lg' | 'xl';

interface FormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  submitLabel?: string;
  isLoading?: boolean;
  position?: DrawerPosition;
  size?: DrawerSize;
  children?: React.ReactNode;
}

const sizeClasses: Record<DrawerSize, string> = {
  sm: 'w-80',
  md: 'w-96',
  lg: 'w-[32rem]',
  xl: 'w-[40rem]',
};

export const FormDrawer: React.FC<FormDrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  fields,
  onSubmit,
  submitLabel = 'Save',
  isLoading = false,
  position = 'right',
  size = 'md',
  children,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const positionClasses = position === 'right'
    ? `right-0 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`
    : `left-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity"
          onClick={onClose}
        />
      )}

      <div
        ref={drawerRef}
        className={`fixed top-0 bottom-0 z-[70] ${sizeClasses[size]} max-w-[90vw] bg-white dark:bg-gray-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${positionClasses}`}
      >
        <div className="flex items-start justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {children || (
            <DynamicForm
              fields={fields}
              onSubmit={onSubmit}
              submitLabel={submitLabel}
              onCancel={onClose}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </>
  );
};
