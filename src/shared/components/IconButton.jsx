import React from 'react';

export default function IconButton({
  label,
  icon,
  onClick,
  disabled,
  className = '',
  buttonClassName = '',
  tooltip,
  ...rest
}) {
  return (
    <div className={`icon-button-wrapper ${className}`}>
      <button
        type="button"
        className={`icon-button ${buttonClassName}`.trim()}
        onClick={onClick}
        disabled={disabled}
        aria-label={label || tooltip}
        {...rest}
      >
        {icon}
      </button>
      {tooltip && <div className="icon-button-tooltip">{tooltip}</div>}
    </div>
  );
}
