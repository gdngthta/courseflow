import { type SelectHTMLAttributes, forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
}

interface SelectInputProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: SelectOption[]
  placeholder?: string
  error?: string
}

export const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(
  ({ label, options, placeholder, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`w-full appearance-none px-3 py-2.5 pr-9 bg-slate-100 dark:bg-slate-800 border rounded-lg text-sm text-slate-700 dark:text-slate-200
              focus:outline-none focus:ring-1 focus:border-indigo-500 focus:ring-indigo-500 transition
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'}
              ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 pointer-events-none"
          />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)
SelectInput.displayName = 'SelectInput'
