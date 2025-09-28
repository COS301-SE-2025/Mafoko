// User preferences types for frontend

export interface UserPreferences {
  user_id: string;
  dark_mode: boolean;
  offline_mode_enabled: boolean;
  ui_language: string;
  text_size: number;
  text_spacing: number;
  high_contrast_mode: boolean;
  updated_at?: string;
}

export interface UserPreferencesUpdate {
  dark_mode?: boolean;
  offline_mode_enabled?: boolean;
  ui_language?: string;
  text_size?: number;
  text_spacing?: number;
  high_contrast_mode?: boolean;
}

export interface UserPreferencesResponse extends UserPreferences {
  updated_at: string;
}
