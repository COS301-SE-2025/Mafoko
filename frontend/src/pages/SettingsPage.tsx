import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, User, Globe, Eye, Palette } from 'lucide-react';
import { useDarkMode } from '../components/ui/DarkModeComponent';
import LeftNav from '../components/ui/LeftNav';
import Navbar from '../components/ui/Navbar';
import { useTranslation } from 'react-i18next';
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
  highContrastMode: boolean;
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

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}

const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit = '',
  onChange,
}) => (
  <div className="slider-item">
    <div className="slider-header">
      <span className="slider-label">{label}</span>
      <span className="slider-value">
        {value.toString()}
        {unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => {
        onChange(Number(e.target.value));
      }}
      className="slider"
    />
  </div>
);

const SettingsPage: React.FC = () => {
  const { i18n, t } = useTranslation();

  const [settings, setSettings] = useState<SettingsState>(() => {
    const savedSettings = localStorage.getItem('userSettings');
    const defaultSettings: SettingsState = {
      textSize: 16,
      textSpacing: 1,
      highContrastMode: false,
      darkMode: false,
      selectedLanguage: i18n.resolvedLanguage || 'en',
    };

    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings) as Partial<SettingsState>;
        return { ...defaultSettings, ...parsed };
      } catch (e) {
        console.error('Failed to parse saved settings:', e);
        return defaultSettings;
      }
    }

    return defaultSettings;
  });

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

    // Apply high contrast mode
    if (settings.highContrastMode) {
      document.documentElement.setAttribute('data-high-contrast-mode', 'true');
    } else {
      document.documentElement.removeAttribute('data-high-contrast-mode');
    }

    localStorage.setItem('userSettings', JSON.stringify(settings));
  }, [settings]);

  // Sync settings with current language
  useEffect(() => {
    const currentLang = i18n.resolvedLanguage;
    if (currentLang && currentLang !== settings.selectedLanguage) {
      handleSettingChange('selectedLanguage', currentLang);
    }
  }, [i18n.resolvedLanguage, settings.selectedLanguage]);

  const handleSettingChange = (
    key: keyof SettingsState,
    value: string | number | boolean,
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const [isMobile] = useState(window.innerWidth <= 768);
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const navigate = useNavigate();

  useEffect(() => {
    if (settings.highContrastMode) {
      document.documentElement.setAttribute('data-high-contrast-mode', 'true');
    }
  }, [settings.highContrastMode]);

  React.useEffect(() => {
    const savedSettings = localStorage.getItem('accessibilitySettings');
    const savedUserSettings = localStorage.getItem('userSettings');

    if (savedUserSettings) {
      try {
        const parsedUserSettings = JSON.parse(
          savedUserSettings,
        ) as Partial<SettingsState>;
        setSettings((prev) => ({
          ...prev,
          textSize: parsedUserSettings.textSize ?? 16,
          textSpacing: parsedUserSettings.textSpacing ?? 1,
          highContrastMode: parsedUserSettings.highContrastMode ?? false,
          darkMode: isDarkMode,
        }));
      } catch (e) {
        console.error('Failed to parse user settings:', e);
      }
    } else if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(
          savedSettings,
        ) as Partial<SettingsState>;
        setSettings((prev) => ({
          ...prev,
          textSize: parsedSettings.textSize ?? 16,
          textSpacing: parsedSettings.textSpacing ?? 1,
          darkMode: isDarkMode,
        }));
      } catch (e) {
        console.error('Failed to parse accessibility settings:', e);
      }
    }
  }, [isDarkMode]);

  // Save settings to localStorage and apply them
  React.useEffect(() => {
    // Save to localStorage
    const settingsToSave = {
      textSize: settings.textSize,
      textSpacing: settings.textSpacing,
      highContrastMode: settings.highContrastMode,
    };
    localStorage.setItem(
      'accessibilitySettings',
      JSON.stringify(settingsToSave),
    );

    document.documentElement.style.setProperty(
      '--base-text-size',
      `${settings.textSize.toString()}px`,
    );
    document.documentElement.style.setProperty(
      '--text-spacing',
      settings.textSpacing.toString(),
    );

    // Apply high contrast mode
    if (settings.highContrastMode) {
      document.documentElement.setAttribute('data-high-contrast-mode', 'true');
    } else {
      document.documentElement.removeAttribute('data-high-contrast-mode');
    }
  }, [settings.textSize, settings.textSpacing, settings.highContrastMode]);

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
                      // Update the settings in localStorage to keep everything in sync
                      const savedSettings =
                        localStorage.getItem('userSettings');
                      if (savedSettings) {
                        try {
                          const settings = JSON.parse(
                            savedSettings,
                          ) as Partial<SettingsState>;
                          const updatedSettings = {
                            ...settings,
                            selectedLanguage: languageCode,
                          };
                          localStorage.setItem(
                            'userSettings',
                            JSON.stringify(updatedSettings),
                          );
                        } catch (parseError) {
                          console.error('Error parsing settings:', parseError);
                        }
                      }
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
            <h2 className="accessibility-title">
              <Eye className="section-icon" />
              {t('settings.accessibility.title')}
            </h2>

            <SettingsSection
              title={t('settings.accessibility.textAndVisual')}
              icon={<div className="subsection-icon">Aa</div>}
              showChevron={false}
            >
              <SliderControl
                label={t('settings.accessibility.textSize')}
                value={settings.textSize}
                min={12}
                max={24}
                step={1}
                unit="px"
                onChange={(value) => {
                  handleSettingChange('textSize', value);
                }}
              />
              <SliderControl
                label={t('settings.accessibility.textSpacing')}
                value={settings.textSpacing}
                min={0.8}
                max={2}
                step={0.1}
                unit="x"
                onChange={(value) => {
                  handleSettingChange('textSpacing', value);
                }}
              />
            </SettingsSection>

            <SettingsSection
              title={t('settings.accessibility.colorAndContrast')}
              icon={<Palette className="section-icon" />}
              showChevron={false}
            >
              <ToggleSwitch
                label={t('settings.accessibility.highContrastMode')}
                checked={settings.highContrastMode}
                onChange={(checked) => {
                  handleSettingChange('highContrastMode', checked);
                }}
              />
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
