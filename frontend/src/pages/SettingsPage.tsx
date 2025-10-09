import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, User, Globe, Palette } from 'lucide-react';
import { useDarkMode } from '../components/ui/DarkModeComponent';
import LeftNav from '../components/ui/LeftNav';
import Navbar from '../components/ui/Navbar';
import { useTranslation } from 'react-i18next';
import {
  getUserPreferences,
  updateUserPreferences,
} from '../services/settingsService';
import { UserPreferencesUpdate } from '../types/userPreferences';
import {
  cacheUserPreferences,
  getCachedUserPreferences,
  addPendingSettingsUpdate,
  UserPreferencesCache,
  PendingSettingsUpdate,
} from '../utils/indexedDB';
import '../styles/DashboardPage.scss';
import '../styles/SettingsPage.scss';

const appSupportedLanguages = [
  { code: 'en', name: 'English' },
  { code: 'zu', name: 'isiZulu' },
  { code: 'af', name: 'Afrikaans' },
  { code: 'st', name: 'Sesotho' },
  { code: 'xh', name: 'isiXhosa' },
  { code: 'nso', name: 'Sepedi' },
  { code: 'tn', name: 'Setswana' },
  { code: 'ss', name: 'Siswati' },
  { code: 've', name: 'Tshivenda' },
  { code: 'ts', name: 'Xitsonga' },
  { code: 'nr', name: 'isiNdebele' },
];

interface SettingsState {
  textSize: number;
  textSpacing: number;
  darkMode: boolean;
  selectedLanguage: string;
}

interface SettingsSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  showChevron?: boolean;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  icon,
  children,
  showChevron = false,
}) => (
  <div className="settings-section">
    <div className="section-header">
      <div className="section-title">
        {icon}
        <h2>{title}</h2>
      </div>
      {showChevron && <ChevronRight className="chevron-icon" />}
    </div>
    <div className="section-content">{children}</div>
  </div>
);

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  label,
  checked,
  onChange,
}) => (
  <label className="toggle-switch">
    <span className="toggle-label">{label}</span>
    <div
      className={`switch ${checked ? 'checked' : ''}`}
      onClick={() => {
        onChange(!checked);
      }}
    >
      <div className="thumb" />
    </div>
  </label>
);

// interface SliderControlProps {
//   label: string;
//   value: number;
//   min: number;
//   max: number;
//   step: number;
//   unit?: string;
//   onChange: (value: number) => void;
// }

// const SliderControl: React.FC<SliderControlProps> = ({
//   label,
//   value,
//   min,
//   max,
//   step,
//   unit = '',
//   onChange,
// }) => (
//   <div className="slider-item">
//     <div className="slider-header">
//       <span className="slider-label">{label}</span>
//       <span className="slider-value">
//         {value.toString()}
//         {unit}
//       </span>
//     </div>
//     <input
//       type="range"
//       min={min}
//       max={max}
//       step={step}
//       value={value}
//       onChange={(e) => {
//         onChange(Number(e.target.value));
//       }}
//       className="slider"
//     />
//   </div>
// );

const SettingsPage: React.FC = () => {
  const { i18n, t } = useTranslation();
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();
  const [isMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false,
  );
  // const [loading, setLoading] = useState(false); // TODO: Use this for loading state display
  const [error, setError] = useState<string | null>(null);

  const [settings, setSettings] = useState<SettingsState>({
    textSize: 16,
    textSpacing: 1,
    darkMode: false,
    selectedLanguage: i18n.resolvedLanguage || 'en',
  });

  // Load user preferences from server on component mount with offline support
  useEffect(() => {
    const loadUserPreferences = async () => {
      // Clear any existing localStorage settings to ensure backend-only mode
      localStorage.removeItem('userSettings');

      const token = localStorage.getItem('accessToken');
      if (!token) {
        // User not logged in, redirect to login or show error
        setError('Please log in to access settings');
        return;
      }

      try {
        // setLoading(true);
        setError(null);

        // If offline, try to load cached preferences
        if (!navigator.onLine) {
          const cachedPrefs = await getCachedUserPreferences();
          if (cachedPrefs) {
            console.log('Using cached user preferences (offline)');
            setSettings({
              textSize: cachedPrefs.preferences.textSize,
              textSpacing: cachedPrefs.preferences.textSpacing,
              darkMode: cachedPrefs.preferences.darkMode,
              selectedLanguage: cachedPrefs.preferences.selectedLanguage,
            });

            if (
              cachedPrefs.preferences.selectedLanguage !== i18n.resolvedLanguage
            ) {
              await i18n.changeLanguage(
                cachedPrefs.preferences.selectedLanguage,
              );
            }

            setError('You are offline. Showing cached settings.');
            // setLoading(false);
            return;
          } else {
            setError('No cached settings available offline.');
            // setLoading(false);
            return;
          }
        }

        const serverPreferences = await getUserPreferences();

        // Update local state with server preferences
        const newSettings = {
          textSize: serverPreferences.text_size,
          textSpacing: serverPreferences.text_spacing,
          darkMode: false,
          selectedLanguage: serverPreferences.ui_language,
        };

        setSettings(newSettings);

        // Cache the fresh preferences
        const cacheData: UserPreferencesCache = {
          id: 'latest',
          preferences: newSettings,
          timestamp: Date.now(),
        };
        await cacheUserPreferences(cacheData);

        // Update language if different
        if (serverPreferences.ui_language !== i18n.resolvedLanguage) {
          await i18n.changeLanguage(serverPreferences.ui_language);
        }
      } catch (err) {
        console.error('Failed to load user preferences:', err);

        // Try to load cached preferences as fallback
        const cachedPrefs = await getCachedUserPreferences();
        if (cachedPrefs) {
          console.log('Using cached user preferences (fallback)');
          setSettings({
            textSize: cachedPrefs.preferences.textSize,
            textSpacing: cachedPrefs.preferences.textSpacing,
            darkMode: cachedPrefs.preferences.darkMode,
            selectedLanguage: cachedPrefs.preferences.selectedLanguage,
          });

          if (
            cachedPrefs.preferences.selectedLanguage !== i18n.resolvedLanguage
          ) {
            await i18n.changeLanguage(cachedPrefs.preferences.selectedLanguage);
          }

          setError('Network error. Showing cached settings.');
        } else {
          setError('Failed to load settings from server');
        }
      } finally {
        // setLoading(false);
      }
    };

    void loadUserPreferences();
  }, [i18n]);

  // Save preferences to server when settings change with offline support
  const savePreferencesToServer = useCallback(
    async (newSettings: SettingsState) => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Please log in to save settings');
        return;
      }

      try {
        const updateData: UserPreferencesUpdate = {
          text_size: newSettings.textSize,
          text_spacing: newSettings.textSpacing,
          ui_language: newSettings.selectedLanguage,
        };

        await updateUserPreferences(updateData);

        // Update cache with successful save
        const cacheData: UserPreferencesCache = {
          id: 'latest',
          preferences: newSettings,
          timestamp: Date.now(),
        };
        await cacheUserPreferences(cacheData);
      } catch (err) {
        console.error('Failed to save preferences to server:', err);

        // Check if this is a network error (offline)
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to save settings';
        if (
          errorMessage.includes('Failed to fetch') ||
          errorMessage.includes('ERR_INTERNET_DISCONNECTED') ||
          errorMessage.includes('ERR_NETWORK') ||
          !navigator.onLine
        ) {
          // Queue the update for offline sync
          const pendingUpdate: PendingSettingsUpdate = {
            id: crypto.randomUUID(),
            preferences: {
              textSize: newSettings.textSize,
              textSpacing: newSettings.textSpacing,
              selectedLanguage: newSettings.selectedLanguage,
            },
            token,
            timestamp: Date.now(),
          };

          await addPendingSettingsUpdate(pendingUpdate);

          // Update cache optimistically
          const cacheData: UserPreferencesCache = {
            id: 'latest',
            preferences: newSettings,
            timestamp: Date.now(),
          };
          await cacheUserPreferences(cacheData);

          // Register background sync
          if (
            'serviceWorker' in navigator &&
            'sync' in window.ServiceWorkerRegistration.prototype
          ) {
            try {
              const registration = await navigator.serviceWorker.ready;
              await registration.sync.register('sync-settings-updates');
            } catch (syncError) {
              console.error(
                'Failed to register background sync for settings updates:',
                syncError,
              );
            }
          }

          setError(
            "You are offline. Your settings have been saved and will sync when you're back online.",
          );
        } else {
          setError('Failed to save settings to server');
        }
      }
    },
    [],
  );

  // Apply CSS variables when settings change
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--base-text-size',
      `${settings.textSize.toString()}px`,
    );
    document.documentElement.style.setProperty(
      '--text-scaling',
      (settings.textSize / 16).toString(),
    );
    document.documentElement.style.setProperty(
      '--text-spacing',
      settings.textSpacing.toString(),
    );
  }, [settings]);

  const handleSettingChange = useCallback(
    (key: keyof SettingsState, value: string | number | boolean) => {
      const newSettings = {
        ...settings,
        [key]: value,
      };

      setSettings(newSettings);

      // Save to server asynchronously
      void savePreferencesToServer(newSettings);
    },
    [settings, savePreferencesToServer],
  );

  // Sync settings with current language
  useEffect(() => {
    const currentLang = i18n.resolvedLanguage;
    if (currentLang && currentLang !== settings.selectedLanguage) {
      handleSettingChange('selectedLanguage', currentLang);
    }
  }, [i18n.resolvedLanguage, settings.selectedLanguage, handleSettingChange]);

  // Remove duplicate declarations - they're already defined above

  // Remove duplicate useEffect blocks - already handled above

  return (
    <div
      className={`dashboard-container ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
    >
      {isMobile ? (
        <Navbar />
      ) : (
        <LeftNav activeItem="settings" setActiveItem={() => {}} />
      )}
      <div className="main-content">
        <header className="settings-header">
          <h1>{t('settings.title')}</h1>
          <br />
          <p>{t('settings.subtitle')}</p>
          {error && (
            <div
              className="error-message"
              style={{
                color: '#dc3545',
                backgroundColor: '#f8d7da',
                border: '1px solid #f5c6cb',
                padding: '0.75rem 1rem',
                borderRadius: '0.375rem',
                marginTop: '1rem',
              }}
            >
              {error}
            </div>
          )}
        </header>

        <div className="settings-content">
          <div
            className="settings-section"
            onClick={() => {
              void navigate('/profile');
            }}
          >
            <div className="section-header">
              <div className="section-title">
                <User className="section-icon" />
                <h2>{t('settings.profile.title')}</h2>
              </div>
              <ChevronRight className="chevron-icon" />
            </div>
          </div>

          <SettingsSection
            title={t('settings.appLanguage.title')}
            icon={<Globe className="section-icon" />}
            showChevron={false}
          >
            <div className="language-selector">
              <label htmlFor="language-select" className="language-label">
                {t('settings.selectLanguage')}
              </label>
              <select
                id="language-select"
                value={settings.selectedLanguage}
                onChange={(e) => {
                  const languageCode = e.target.value;
                  void (async () => {
                    try {
                      await i18n.changeLanguage(languageCode);
                      document.documentElement.lang = languageCode;
                      localStorage.setItem('i18nextLng', languageCode);
                      handleSettingChange('selectedLanguage', languageCode);
                    } catch (err) {
                      console.error('Error changing language:', err);
                    }
                  })();
                }}
                className="language-dropdown"
              >
                {appSupportedLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </SettingsSection>

          <div className="accessibility-wrapper">
            {/*<h2 className="accessibility-title">*/}
            {/*  <Eye className="section-icon" />*/}
            {/*  {t('settings.accessibility.title')}*/}
            {/*</h2>*/}

            {/*<SettingsSection*/}
            {/*  title={t('settings.accessibility.textAndVisual')}*/}
            {/*  icon={<div className="subsection-icon">Aa</div>}*/}
            {/*  showChevron={false}*/}
            {/*>*/}
            {/*  <SliderControl*/}
            {/*    label={t('settings.accessibility.textSize')}*/}
            {/*    value={settings.textSize}*/}
            {/*    min={12}*/}
            {/*    max={24}*/}
            {/*    step={1}*/}
            {/*    unit="px"*/}
            {/*    onChange={(value) => {*/}
            {/*      handleSettingChange('textSize', value);*/}
            {/*    }}*/}
            {/*  />*/}
            {/*  <SliderControl*/}
            {/*    label={t('settings.accessibility.textSpacing')}*/}
            {/*    value={settings.textSpacing}*/}
            {/*    min={0.8}*/}
            {/*    max={2}*/}
            {/*    step={0.1}*/}
            {/*    unit="x"*/}
            {/*    onChange={(value) => {*/}
            {/*      handleSettingChange('textSpacing', value);*/}
            {/*    }}*/}
            {/*  />*/}
            {/*</SettingsSection>*/}

            <SettingsSection
              title={t('settings.accessibility.colorAndContrast')}
              icon={<Palette className="section-icon" />}
              showChevron={false}
            >
              <ToggleSwitch
                label={t('settings.accessibility.darkMode')}
                checked={isDarkMode}
                onChange={() => {
                  toggleDarkMode();
                }}
              />
            </SettingsSection>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
