import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import '../../styles/SearchBar.scss';
import { Autocomplete, TextField } from '@mui/material';

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
      // Add the renderOption prop to explicitly set a unique key for each item
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          {option.label}
        </li>
      )}
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
        />
      )}
    />
  );
};

export default SearchBar;
