import axios from 'axios';
import { API_ENDPOINTS } from '../config';
import { UserPreferences, UserPreferencesUpdate, UserPreferencesResponse } from '../types/userPreferences';

// Create axios instance for settings API
const settingsApiClient = axios.create();

// Add request interceptor to include auth token
settingsApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Settings API functions
export const getUserPreferences = async (): Promise<UserPreferencesResponse> => {
  const response = await settingsApiClient.get<UserPreferencesResponse>(
    API_ENDPOINTS.getUserPreferences
  );
  return response.data;
};

export const updateUserPreferences = async (
  preferences: UserPreferencesUpdate
): Promise<UserPreferencesResponse> => {
  const response = await settingsApiClient.put<UserPreferencesResponse>(
    API_ENDPOINTS.updateUserPreferences,
    preferences
  );
  return response.data;
};

export const resetUserPreferences = async (): Promise<UserPreferencesResponse> => {
  const response = await settingsApiClient.post<UserPreferencesResponse>(
    API_ENDPOINTS.resetUserPreferences
  );
  return response.data;
};

// Helper function to merge server preferences with local storage
export const mergePreferencesWithLocalStorage = (
  serverPreferences: UserPreferencesResponse
): UserPreferences => {
  // Get current local storage settings
  const localSettings = localStorage.getItem('userSettings');
  let localPrefs = {};
  
  if (localSettings) {
    try {
      localPrefs = JSON.parse(localSettings);
    } catch (e) {
      console.error('Failed to parse local settings:', e);
    }
  }

  // Merge server preferences with local settings, giving priority to server
  return {
    ...localPrefs,
    user_id: serverPreferences.user_id,
    dark_mode: serverPreferences.dark_mode,
    offline_mode_enabled: serverPreferences.offline_mode_enabled,
    ui_language: serverPreferences.ui_language,
    text_size: serverPreferences.text_size,
    text_spacing: serverPreferences.text_spacing,
    high_contrast_mode: serverPreferences.high_contrast_mode,
    updated_at: serverPreferences.updated_at,
  };
};

// Function to sync local settings to server
export const syncLocalSettingsToServer = async (): Promise<UserPreferencesResponse | null> => {
  try {
    const localSettings = localStorage.getItem('userSettings');
    if (!localSettings) {
      return null;
    }

    const localPrefs = JSON.parse(localSettings);
    const updateData: UserPreferencesUpdate = {
      text_size: localPrefs.textSize,
      text_spacing: localPrefs.textSpacing,
      high_contrast_mode: localPrefs.highContrastMode,
      ui_language: localPrefs.selectedLanguage,
    };

    return await updateUserPreferences(updateData);
  } catch (error) {
    console.error('Failed to sync local settings to server:', error);
    return null;
  }
};