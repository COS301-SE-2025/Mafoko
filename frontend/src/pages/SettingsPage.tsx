import React, { useState } from 'react';
import { ChevronRight, User, Globe, Eye, Palette } from 'lucide-react';
import { useDarkMode } from '../components/ui/DarkModeComponent';
import LeftNav from '../components/ui/LeftNav';
import Navbar from '../components/ui/Navbar';
import '../styles/DashboardPage.scss';
import '../styles/SettingsPage.scss';

interface SettingsState {
  textSize: number;
  textSpacing: number;
  colorBlindMode: boolean;
  highContrastMode: boolean;
  darkMode: boolean;
  selectedLanguage: string;
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<SettingsState>({
    textSize: 16,
    textSpacing: 1,
    colorBlindMode: false,
    highContrastMode: false,
    darkMode: false,
    selectedLanguage: 'English'
  });

  const southAfricanLanguages = [
    'English',
    'Afrikaans',
    'isiZulu',
    'isiXhosa',
    'Sepedi',
    'Setswana',
    'Sesotho',
    'Xitsonga',
    'siSwati',
    'Tshivenda',
    'isiNdebele'
  ];

  const handleSettingChange = (key: keyof SettingsState, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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
    <div className="toggle-item">
      <span className="toggle-label">{label}</span>
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="toggle-slider"></span>
      </label>
    </div>
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

  // Initialize dark mode state from global theme
  React.useEffect(() => {
    setSettings(prev => ({ ...prev, darkMode: isDarkMode }));
  }, []);

  // Effect to apply text size and spacing
  React.useEffect(() => {
    document.documentElement.style.setProperty('--base-text-size', `${settings.textSize}px`);
    document.documentElement.style.setProperty('--text-spacing', settings.textSpacing.toString());
  }, [settings.textSize, settings.textSpacing]);

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
            {/* Profile & Account */}
            <div 
              className="settings-section"
              onClick={() => {
                // Navigate to ProfilePage.tsx
                console.log('Redirecting to ProfilePage.tsx');
                // In a real app: navigate('/profile') or router.push('/profile')
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

            {/* App Language */}
            <SettingsSection 
              title="App Language" 
              icon={<Globe className="section-icon" />}
              showChevron={false}
            >
              <div className="language-selector">
                <label htmlFor="language-select" className="language-label">
                  Select your preferred language
                </label>
                <select
                  id="language-select"
                  value={settings.selectedLanguage}
                  onChange={(e) => handleSettingChange('selectedLanguage', e.target.value)}
                  className="language-dropdown"
                >
                  {southAfricanLanguages.map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
            </SettingsSection>

            {/* Accessibility Options */}
            <div className="accessibility-wrapper">
              <h2 className="accessibility-title">
                <Eye className="section-icon" />
                Accessibility Options
              </h2>

              {/* Text & Visual Presentation */}
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

              {/* Colour & Contrast */}
              <SettingsSection 
                title="Colour & Contrast" 
                icon={<Palette className="section-icon" />}
                showChevron={false}
              >
                <ToggleSwitch
                  label="Colour Blind Mode"
                  checked={settings.colorBlindMode}
                  onChange={(checked) => handleSettingChange('colorBlindMode', checked)}
                />
                <ToggleSwitch
                  label="High Contrast Mode"
                  checked={settings.highContrastMode}
                  onChange={(checked) => handleSettingChange('highContrastMode', checked)}
                />
                <ToggleSwitch
                  label="Dark Mode"
                  checked={isDarkMode}
                  onChange={(checked) => {
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
