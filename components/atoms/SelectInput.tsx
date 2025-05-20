// components/common/SelectInput.tsx
'use client';
import React, { ReactNode } from 'react';

interface Option {
  value: string | number;
  label: string;
}

interface SelectInputProps {
  id: string;
  name: string;
  label: string | ReactNode;
  optionalLabel?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Option[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export default function SelectInput({
  id,
  name,
  label,
  optionalLabel,
  value,
  onChange,
  options,
  disabled = false,
  placeholder = 'Select an option',
  className = '',
}: SelectInputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}{' '}
        {optionalLabel && (
          <span className="text-xs text-gray-500 bg-green-200 p-[1px] rounded-md">
            ({optionalLabel})
          </span>
        )}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${className}`}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        <option value="">___</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
