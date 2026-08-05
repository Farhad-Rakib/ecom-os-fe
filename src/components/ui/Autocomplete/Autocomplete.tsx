import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, X, Search } from 'lucide-react';

export interface AutocompleteOption {
  label: string;
  value: string;
}

interface AutocompleteProps {
  options: AutocompleteOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  clearable?: boolean;
  className?: string;
  error?: string;
  onSearch?: (query: string) => void;
}

export const Autocomplete: React.FC<AutocompleteProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Search...',
  label,
  disabled = false,
  loading = false,
  clearable = true,
  className = '',
  error,
  onSearch,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find(o => o.value === value);

  const filtered = query
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setQuery('');
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setHighlightedIndex(-1);
    if (!isOpen) setIsOpen(true);
    onSearch?.(val);
  };

  const handleSelect = useCallback((option: AutocompleteOption) => {
    onChange(option.value);
    setQuery('');
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, [onChange]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setQuery('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) setIsOpen(true);
      setHighlightedIndex(prev => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && filtered[highlightedIndex]) {
        handleSelect(filtered[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setQuery('');
      setHighlightedIndex(-1);
    }
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
        </label>
      )}

      <div
        className={`relative flex items-center w-full border rounded-lg transition-all ${
          isOpen
            ? 'border-blue-500 ring-2 ring-blue-500/20'
            : error
              ? 'border-red-500'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} bg-white dark:bg-gray-900`}
      >
        <Search className="w-4 h-4 text-gray-400 ml-3 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? query : (selectedOption?.label || '')}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={selectedOption ? selectedOption.label : placeholder}
          disabled={disabled}
          className="w-full px-2 py-2.5 text-sm text-gray-900 dark:text-white bg-transparent placeholder-gray-400 focus:outline-none disabled:cursor-not-allowed"
        />

        <div className="flex items-center gap-1 pr-2 shrink-0">
          {clearable && value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}

      {isOpen && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 max-h-60 overflow-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1"
        >
          {loading ? (
            <li className="px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400 text-center">Loading...</li>
          ) : filtered.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400 text-center">No results found</li>
          ) : (
            filtered.map((option, index) => (
              <li
                key={option.value}
                onClick={() => handleSelect(option)}
                className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                  option.value === value
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                    : index === highlightedIndex
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                {option.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};
