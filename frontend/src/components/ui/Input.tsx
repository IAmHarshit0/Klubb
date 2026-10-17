import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-mercury-gray-700 mb-1.5 tracking-wide uppercase">
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={`mercury-input ${error ? 'border-red-300 bg-red-50' : ''} ${className}`}
      />
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-mercury-gray-400">{hint}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', id, ...props }: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-xs font-semibold text-mercury-gray-700 mb-1.5 tracking-wide uppercase">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        {...props}
        className={`mercury-input resize-none ${error ? 'border-red-300 bg-red-50' : ''} ${className}`}
      />
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
