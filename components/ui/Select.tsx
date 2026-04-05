"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextValue | undefined>(undefined);

const useSelectContext = () => {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within a Select');
  }
  return context;
};

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  defaultValue?: string;
}

export const SelectRoot: React.FC<SelectProps> = ({
  value,
  onValueChange,
  children,
  defaultValue,
}) => {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(
    defaultValue || value || ''
  );

  const handleValueChange = (newValue: string) => {
    setInternalValue(newValue);
    onValueChange(newValue);
    setOpen(false);
  };

  return (
    <SelectContext.Provider
      value={{
        value: value || internalValue,
        onValueChange: handleValueChange,
        open,
        setOpen,
      }}
    >
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
};

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  SelectTriggerProps
>(({ children, className = '' }, ref) => {
  const { open, setOpen } = useSelectContext();
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open, setOpen]);

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => setOpen(!open)}
      aria-haspopup="listbox"
      aria-expanded={open}
      className={`flex items-center justify-between w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-blue-500 ${className}`}
    >
      {children}
      <ChevronDown
        className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
        aria-hidden="true"
      />
    </button>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

interface SelectValueProps {
  Content?: string;
}

export const SelectValue: React.FC<SelectValueProps> = ({
  Content = 'Select...',
}) => {
  const { value } = useSelectContext();
  return <span>{value || Content}</span>;
};

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

export const SelectContent: React.FC<SelectContentProps> = ({
  children,
  className = '',
}) => {
  const { open } = useSelectContext();

  if (!open) return null;

  return (
    <div
      role="listbox"
      className={`absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto ${className}`}
    >
      <div className="py-1">{children}</div>
    </div>
  );
};

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export const SelectItem: React.FC<SelectItemProps> = ({
  value,
  children,
  disabled = false,
}) => {
  const { value: selectedValue, onValueChange } = useSelectContext();
  const isSelected = selectedValue === value;

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      onClick={() => !disabled && onValueChange(value)}
      disabled={disabled}
      className={`w-full px-3 py-2 text-left text-sm transition-colors ${
        disabled
          ? 'text-slate-400 cursor-not-allowed'
          : 'text-black hover:bg-slate-100 cursor-pointer'
      } ${isSelected ? 'bg-brand-blue-50 text-brand-orange-600 font-medium' : ''}`}
    >
      {children}
    </button>
  );
};

// Export as default Select for compatibility
export const Select = SelectRoot;

// Also export the custom Select with options prop for backwards compatibility
export { Select as SelectCustom } from './SelectCustom';
