import React from "react";

interface ToggleSwitchProps {
  value: boolean;
  onToggle: (value: boolean) => void;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  className?: string; // wrapper sizing
  buttonClassName?: string; // per-button sizing
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  value,
  onToggle,
  leftContent,
  rightContent,
  className = "",
  buttonClassName = "",
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className="flex bg-gray-200 rounded border border-gray-300 overflow-hidden">
        <button
          onClick={() => onToggle(true)}
          className={[
            "flex items-center justify-center transition-colors duration-200",
            value ? "bg-gray-900 text-white" : "bg-transparent text-gray-600 hover:bg-gray-300",
            buttonClassName,
          ].join(" ")}
          title="Left"
        >
          {leftContent}
        </button>
        <button
          onClick={() => onToggle(false)}
          className={[
            "flex items-center justify-center transition-colors duration-200",
            !value ? "bg-gray-900 text-white" : "bg-transparent text-gray-600 hover:bg-gray-300",
            buttonClassName,
          ].join(" ")}
          title="Right"
        >
          {rightContent}
        </button>
      </div>
    </div>
  );
};

export default ToggleSwitch;
