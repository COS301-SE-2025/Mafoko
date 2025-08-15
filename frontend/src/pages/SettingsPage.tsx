import React, { useState, useEffect } from 'react';
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

const SettingsPage: React.FC = () => {
  const { i18n, t } = useTranslation();

  const [settings, setSettings] = useState<SettingsState>(() => {
    const savedSettings = localStorage.getItem('userSettings');
    const defaultSettings = {
      textSize: 16,
      textSpacing: 1,
      highContrastMode: false,
      darkMode: false,
      selectedLanguage: i18n.resolvedLanguage || 'en'
    };

    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        return { ...defaultSettings, ...parsed };
      } catch (e) {
        console.error('Failed to parse saved settings:', e);
        return defaultSettings;
      }
    }

    return defaultSettings;
  });

  useEffect(() => {
    document.documentElement.style.setProperty('--base-text-size', `${settings.textSize}px`);
    document.documentElement.style.setProperty('--text-scaling', `${settings.textSize/16}`);
    document.documentElement.style.setProperty('--text-spacing', `${settings.textSpacing}`);
    
    // Apply high contrast mode
    if (settings.highContrastMode) {
      document.documentElement.setAttribute('data-high-contrast-mode', 'true');
    } else {
      document.documentElement.removeAttribute('data-high-contrast-mode');
    }
    
    localStorage.setItem('userSettings', JSON.stringify(settings));
  }, [settings]);

  const handleSettingChange = (key: keyof SettingsState, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const SettingsSection: React.FC<{ 
    title: string; 
    icon: React.ReactNode; 
    children: React.ReactNode;
    showChevron?: boolean;
  }> = ({ title, icon, children, showChevron = false }) => (
    <div className="settings-section">
      <div className="section-header">
        <div className="section-title">
          {icon}
          <h2>{title}</h2>
        </div>
        {showChevron && <ChevronRight className="chevron-icon" />}
      </div>
      <div className="section-content">
        {children}
      </div>
    </div>
  );

  const ToggleSwitch: React.FC<{
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }> = ({ label, checked, onChange }) => (
    <label className="toggle-switch">
      <span className="toggle-label">{label}</span>
      <div
        className={`switch ${checked ? 'checked' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <div className="thumb" />
      </div>
    </label>
  );

  const SliderControl: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit?: string;
    onChange: (value: number) => void;
  }> = ({ label, value, min, max, step, unit = '', onChange }) => (
    <div className="slider-item">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider"
      />
    </div>
  );

  const [isMobile] = useState(window.innerWidth <= 768);
  const { isDarkMode, toggleDarkMode } = useDarkMode();

  useEffect(() => {
    if (settings.highContrastMode) {
      document.documentElement.setAttribute('data-high-contrast-mode', 'true');
    }
  }, []);

  React.useEffect(() => {
    const savedSettings = localStorage.getItem('accessibilitySettings');
    const savedUserSettings = localStorage.getItem('userSettings');
    
    if (savedUserSettings) {
      try {
        const parsedUserSettings = JSON.parse(savedUserSettings);
        setSettings(prev => ({
          ...prev,
          textSize: parsedUserSettings.textSize || 16,
          textSpacing: parsedUserSettings.textSpacing || 1,
          highContrastMode: parsedUserSettings.highContrastMode || false,
          darkMode: isDarkMode
        }));
      } catch (e) {
        console.error('Failed to parse user settings:', e);
      }
    } else if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(prev => ({
        ...prev,
        textSize: parsedSettings.textSize || 16,
        textSpacing: parsedSettings.textSpacing || 1,
        darkMode: isDarkMode
      }));
    }
  }, [isDarkMode]);

  // Save settings to localStorage and apply them
  React.useEffect(() => {
    // Save to localStorage
    const settingsToSave = {
      textSize: settings.textSize,
      textSpacing: settings.textSpacing,
      highContrastMode: settings.highContrastMode
    };
    localStorage.setItem('accessibilitySettings', JSON.stringify(settingsToSave));

    document.documentElement.style.setProperty('--base-text-size', `${settings.textSize}px`);
    document.documentElement.style.setProperty('--text-spacing', settings.textSpacing.toString());
    
    // Apply high contrast mode
    if (settings.highContrastMode) {
      document.documentElement.setAttribute('data-high-contrast-mode', 'true');
    } else {
      document.documentElement.removeAttribute('data-high-contrast-mode');
    }
  }, [settings.textSize, settings.textSpacing, settings.highContrastMode]);

  return (
    <div className={`dashboard-container ${isDarkMode ? 'theme-dark' : 'theme-light'}`}>
      {isMobile ? (
        <Navbar />
      ) : (
        <LeftNav activeItem="settings" setActiveItem={() => {}} />
      )}
      <div className="main-content">
          <header className="settings-header">
            <h1>Settings</h1>
            <br />
            <p>Customize your Marito experience</p>
          </header>

          <div className="settings-content">
            <div 
              className="settings-section"
              onClick={() => {
                console.log('Redirecting to ProfilePage.tsx');
              }}
            >
              <div className="section-header">
                <div className="section-title">
                  <User className="section-icon" />
                  <h2>Profile & Account</h2>
                </div>
                <ChevronRight className="chevron-icon" />
              </div>
            </div>

            <SettingsSection 
              title="App Language" 
              icon={<Globe className="section-icon" />}
              showChevron={false}
            >
              <div className="language-selector">
                <label htmlFor="language-select" className="language-label">
                  {t('settings.selectLanguage', 'Select your preferred language')}
                </label>
                <select
                  id="language-select"
                  value={settings.selectedLanguage}
                  onChange={async (e) => {
                    const languageCode = e.target.value;
                    try {
                      await i18n.changeLanguage(languageCode);
                      document.documentElement.lang = languageCode;
                      localStorage.setItem('i18nextLng', languageCode);
                      handleSettingChange('selectedLanguage', languageCode);
                    } catch (err) {
                      console.error('Error changing language:', err);
                    }
                  }}
                  className="language-dropdown"
                >
                  {appSupportedLanguages.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
            </SettingsSection>

            <div className="accessibility-wrapper">
              <h2 className="accessibility-title">
                <Eye className="section-icon" />
                Accessibility Options
              </h2>

              <SettingsSection 
                title="Text & Visual Presentation" 
                icon={<div className="subsection-icon">Aa</div>}
                showChevron={false}
              >
                <SliderControl
                  label="Text Size"
                  value={settings.textSize}
                  min={12}
                  max={24}
                  step={1}
                  unit="px"
                  onChange={(value) => handleSettingChange('textSize', value)}
                />
                <SliderControl
                  label="Text Spacing"
                  value={settings.textSpacing}
                  min={0.8}
                  max={2}
                  step={0.1}
                  unit="x"
                  onChange={(value) => handleSettingChange('textSpacing', value)}
                />
              </SettingsSection>

              <SettingsSection 
                title="Colour & Contrast" 
                icon={<Palette className="section-icon" />}
                showChevron={false}
              >
                <ToggleSwitch
                  label="High Contrast Mode"
                  checked={settings.highContrastMode}
                  onChange={(checked) => handleSettingChange('highContrastMode', checked)}
                />
                <ToggleSwitch
                  label="Dark Mode"
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