import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/SearchBar.scss';
import { Autocomplete, TextField } from '@mui/material';
import { useDarkMode } from './DarkModeComponent';
import { Search } from 'lucide-react';

interface Suggestion {
  id: string;
  label: string;
}

interface SearchBarProps {
  onSearch: (value: string) => void;
  fetchSuggestions: (term: string) => Promise<Suggestion[]>;
  minChars?: number;
  debounceMs?: number;
}

const SearchBar: FC<SearchBarProps> = ({
  onSearch,
  fetchSuggestions,
  minChars = 1,
  debounceMs = 300,
}) => {
  const { t } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const [value, setValue] = useState('');
  const [options, setOptions] = useState<Suggestion[]>([]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (value.length >= minChars) {
        fetchSuggestions(value)
          .then((results) => {
            setOptions(results);
          })
          .catch(() => {
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
    <div style={{ position: 'relative', width: '100%' }}>
      <Search
        style={{
          position: 'absolute',
          left: '0.75rem',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '1.25rem',
          height: '1.25rem',
          color: '#9ca3af',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />
      <Autocomplete
        freeSolo
        options={options}
        getOptionLabel={(option) =>
          typeof option === 'string' ? option : option.label
        }
        isOptionEqualToValue={(option, value) => option.id === value.id}
        inputValue={value}
        onInputChange={(_, newInputValue) => {
          setValue(newInputValue);
        }}
        onChange={(_, selectedValue) => {
          const finalValue =
            typeof selectedValue === 'string'
              ? selectedValue
              : selectedValue?.label || '';
          onSearch(finalValue);
        }}
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            {option.label}
          </li>
        )}
        sx={{
          '& .MuiAutocomplete-popper': {
            backgroundColor: isDarkMode ? '#212431' : 'white',
          },
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={t('searchPage.searchPlaceholder')}
            variant="outlined"
            fullWidth
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSearch(value);
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '0.5rem',
                border: isDarkMode
                  ? '1px solid #4b5563'
                  : '1px solid rgba(0, 206, 175, 0.3)',
                backgroundColor: isDarkMode
                  ? 'rgba(71, 85, 105, 0.5)'
                  : '#f5f5f5',
                color: isDarkMode ? 'white' : '#111827',
                paddingLeft: '2.5rem',
                '& fieldset': {
                  border: 'none',
                },
                '&:hover fieldset': {
                  border: 'none',
                },
                '&.Mui-focused fieldset': {
                  border: 'none',
                },
                '&.Mui-focused': {
                  border: isDarkMode
                    ? '1px solid #4b5563'
                    : '1px solid rgba(0, 206, 175, 0.3)',
                },
              },
              '& .MuiInputBase-input': {
                color: isDarkMode ? 'white' : '#111827',
                fontSize: '1rem',
                padding: '0.75rem 1rem 0.75rem 0',
              },
              '& .MuiInputBase-input::placeholder': {
                color: isDarkMode ? '#9ca3af' : '#6b7280',
                opacity: 1,
              },
            }}
          />
        )}
      />
    </div>
  );
};

export default SearchBar;
