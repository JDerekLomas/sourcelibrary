import React from 'react';
import { AIModel } from './aiModels';

interface AIModelSelectProps {
  value: string;
  onChange: (value: string) => void;
  models: AIModel[];
  disabled?: boolean;
  label: string;
  className?: string;
  inputClassName?: string;
}

const AIModelSelect: React.FC<AIModelSelectProps> = ({
  value,
  onChange,
  models,
  disabled = false,
  label,
  className = '',
  inputClassName = '',
}) => {
  // Use responsive text sizing and same padding/appearance as other inputs to ensure consistent height
  const defaultInputClasses =
    'w-full px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:ring-2 focus:ring-gray-500 focus:border-gray-500 font-serif bg-white appearance-none';

  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-700 font-sans mb-1">
        {label}
      </label>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={inputClassName || defaultInputClasses}
      >
        {models.map((model) => (
          <option key={model.value} value={model.value}>
            {model.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default AIModelSelect;
