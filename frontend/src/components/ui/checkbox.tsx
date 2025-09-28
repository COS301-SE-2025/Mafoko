import React from 'react';
import '../../styles/SearchPage.scss';

interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onCheckedChange,
  ...props
}) => {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      style={{
        appearance: 'none',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        width: '20px',
        height: '20px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        backgroundColor: checked ? 'var(--accent-color)' : '#fff',
        display: 'inline-block',
        cursor: 'pointer',
        position: 'relative',
      }}
      {...props}
    />
  );
};
