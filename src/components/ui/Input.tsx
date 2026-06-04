import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-slate-300">{label}</label>
        )}
        <input
          ref={ref}
          className={`w-full px-3 py-2.5 bg-slate-800 border rounded-lg text-sm text-slate-200 placeholder:text-slate-500
            focus:outline-none focus:ring-1 focus:border-indigo-500 focus:ring-indigo-500 transition
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-slate-700'}
            ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
