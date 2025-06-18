import type { FC, InputHTMLAttributes } from 'react';
import { useState, useEffect } from 'react';
import '../../styles/SearchBar.scss';
import { Autocomplete, TextField } from '@mui/material';

interface HelpSearchProps extends InputHTMLAttributes<HTMLInputElement> {
  onSearch: (query: string) => Promise<void>;
  fetchSuggestions: (query: string) => Promise<string[]>;
  minChars?: number;
  placeholder?: string;
  debounceMs?: number;
}

const HelpSearch: FC<HelpSearchProps> = ({
  onSearch,
  fetchSuggestions,
  minChars = 1,
  placeholder = 'Search term',
  debounceMs = 300,
}) => {
  const [value, setValue] = useState('');
  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    void onSearch('');
  }, [onSearch]);

  // Fetch suggestions
  useEffect(() => {
    const handler = setTimeout(() => {
      if (value.length >= minChars) {
        fetchSuggestions(value)
          .then((results) => {
            setOptions(results.map((s) => s));
          })
          .catch((err: unknown) => {
            if (err instanceof Error) {
              console.error('Failed to fetch suggestions:', err.message);
            } else {
              console.error('Unknown error while fetching suggestions:', err);
            }
            setOptions([]);
          });
      } else {
        setOptions([]);
      }
    }, debounceMs);

    return () => {
      clearTimeout(handler);
    };
  }, [value, fetchSuggestions, minChars, debounceMs]);

  return (
    <Autocomplete
      sx={{
        input: {
          color: 'var(--text-theme)',
          backgroundColor: 'var(--text-secondary)',
          border: 'none',
          focus: 'none',
          focusHighlight: 'none',
        },
      }}
      freeSolo
      options={options}
      inputValue={value}
      onInputChange={(_, newInputValue) => {
        setValue(newInputValue);
      }}
      onChange={(_, selectedValue) => {
        if (typeof selectedValue === 'string') {
          void onSearch(selectedValue);
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          variant="outlined"
          fullWidth
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'rgba(255, 255, 255, 0.9)', // or use var(--bg-tir)
              borderRadius: '0.5rem',
            },
            '& .MuiOutlinedInput-notchedOutline': {
              border: 'none',
            },
            '& input': {
              color: 'var(--bg-tri)',
            },
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              void onSearch(value);
            }
          }}
        />
      )}
    />
  );
};

export default HelpSearch;
