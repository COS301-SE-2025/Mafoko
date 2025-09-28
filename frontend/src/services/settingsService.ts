import axios from 'axios';
import { API_ENDPOINTS } from '../config';
import {
  UserPreferencesUpdate,
  UserPreferencesResponse,
} from '../types/userPreferences';

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
  (error) => Promise.reject(error),
);

// Settings API functions
export const getUserPreferences =
  async (): Promise<UserPreferencesResponse> => {
    const response = await settingsApiClient.get<UserPreferencesResponse>(
      API_ENDPOINTS.getUserPreferences,
    );
    return response.data;
  };

export const updateUserPreferences = async (
  preferences: UserPreferencesUpdate,
): Promise<UserPreferencesResponse> => {
  const response = await settingsApiClient.put<UserPreferencesResponse>(
    API_ENDPOINTS.updateUserPreferences,
    preferences,
  );
  return response.data;
};

export const resetUserPreferences =
  async (): Promise<UserPreferencesResponse> => {
    const response = await settingsApiClient.post<UserPreferencesResponse>(
      API_ENDPOINTS.resetUserPreferences,
    );
    return response.data;
  };
