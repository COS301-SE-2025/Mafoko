import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import '../../styles/RegistrationPage.css';

export function PasswordField({
  value,
  onChange,
  placeholder = 'Enter your password',
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div
      className="w-full flex flex-col items-start password-input"
      style={{ marginTop: '10px' }}
    >
      {label && (
        <label
          htmlFor="password"
          className="text-left font-bold mb-2"
          style={{ color: 'var(--text-theme)' }}
        >
          {label}
        </label>
      )}

      <div className="relative w-full">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="password-input"
          style={{
            padding: '0.75rem 2.5rem 0.75rem 1rem',
            fontSize: '0.95rem',
          }}
        />

        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-theme)] opacity-70 hover:opacity-100 transition"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
