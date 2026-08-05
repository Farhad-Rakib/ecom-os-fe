import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

export type FieldType = 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file';

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  defaultValue?: any;
  required?: boolean;
  disabled?: boolean;
  options?: { label: string; value: string | number }[];
  rows?: number;
  validation?: z.ZodTypeAny;
}

interface DynamicFormProps {
  fields: FormField[];
  onSubmit: (data: any) => void | Promise<void>;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  onSubmit,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  onCancel,
  isLoading = false,
  className = '',
}) => {
  const schema = z.object(
    fields.reduce((acc, field) => {
      let fieldSchema: z.ZodTypeAny = field.validation || z.any();

      if (!field.validation) {
        switch (field.type) {
          case 'email':
            fieldSchema = z.string().email('Invalid email address');
            break;
          case 'number':
            fieldSchema = z.number();
            break;
          case 'checkbox':
            fieldSchema = z.boolean();
            break;
          default:
            fieldSchema = z.string();
        }

        if (field.required && field.type !== 'checkbox' && field.type !== 'number') {
          fieldSchema = (fieldSchema as z.ZodString).min(1, `${field.label} is required`);
        }
      }

      return { ...acc, [field.name]: fieldSchema };
    }, {})
  );

  const defaultValues = fields.reduce<Record<string, any>>((acc, field) => {
    return { ...acc, [field.name]: field.defaultValue || '' };
  }, {});

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Record<string, any>>({
    resolver: zodResolver(schema) as any,
    defaultValues,
  });

  const renderField = (field: FormField) => {
    const error = errors[field.name];
    const errorMessage = error?.message as string;

    const fieldClasses =
      'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed';
    const errorClasses = error
      ? 'border-red-500 focus:ring-red-500'
      : 'border-gray-300 dark:border-gray-600';

    return (
      <div key={field.name} className="space-y-1">
        <label
          htmlFor={field.name}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>

        <Controller
          name={field.name}
          control={control}
          render={({ field: { value, onChange, onBlur } }) => {
            switch (field.type) {
              case 'textarea':
                return (
                  <textarea
                    id={field.name}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    placeholder={field.placeholder}
                    disabled={field.disabled || isLoading}
                    rows={field.rows || 4}
                    className={`${fieldClasses} ${errorClasses} resize-none`}
                  />
                );

              case 'select':
                return (
                  <select
                    id={field.name}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    disabled={field.disabled || isLoading}
                    className={`${fieldClasses} ${errorClasses}`}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                );

              case 'checkbox':
                return (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={field.name}
                      checked={value}
                      onChange={(e) => onChange(e.target.checked)}
                      onBlur={onBlur}
                      disabled={field.disabled || isLoading}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                );

              case 'radio':
                return (
                  <div className="space-y-2">
                    {field.options?.map((option) => (
                      <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={field.name}
                          value={option.value}
                          checked={value === option.value}
                          onChange={() => onChange(option.value)}
                          onBlur={onBlur}
                          disabled={field.disabled || isLoading}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                );

              default:
                return (
                  <input
                    type={field.type}
                    id={field.name}
                    value={value}
                    onChange={(e) => {
                      const val = field.type === 'number' ? Number(e.target.value) : e.target.value;
                      onChange(val);
                    }}
                    onBlur={onBlur}
                    placeholder={field.placeholder}
                    disabled={field.disabled || isLoading}
                    className={`${fieldClasses} ${errorClasses}`}
                  />
                );
            }
          }}
        />

        {errorMessage && <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-6 ${className}`}>
      <div className="space-y-4">{fields.map(renderField)}</div>

      <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
};
