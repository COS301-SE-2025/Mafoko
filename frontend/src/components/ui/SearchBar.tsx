import type { FC, InputHTMLAttributes } from 'react';
import { useState, useEffect } from 'react';
import '../../styles/SearchBar.scss';
import { Autocomplete, TextField } from '@mui/material';

interface Suggestion {
  id: string;
  label: string;
}

interface SearchBarProps extends InputHTMLAttributes<HTMLInputElement> {
  onSearch: (value: string) => Promise<void>;
  fetchSuggestions: (term: string) => Promise<Suggestion[]>;
  minChars?: number;
  placeholder?: string;
  debounceMs?: number;
}

const SearchBar: FC<SearchBarProps> = ({
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

  // Debounced logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(value);
    }, debounceMs);
    return () => {
      clearTimeout(timer);
    };
  }, [value, debounceMs]);

  // Fetch suggestions
  useEffect(() => {
    const handler = setTimeout(() => {
      if (value.length >= minChars) {
        fetchSuggestions(value)
          .then((results) => { setOptions(results.map((s) => s.label)); })
          .catch((err) => {
            console.error('Failed to fetch suggestions', err);
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
      freeSolo
      options={options}
      inputValue={value}
      onInputChange={(_, newInputValue) => { setValue(newInputValue); }}
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
            input: {
              color: 'var(--text-theme)',
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

export default SearchBar;
