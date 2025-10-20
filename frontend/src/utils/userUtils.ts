import { API_ENDPOINTS } from '../config';

export const UserRole = {
  LINGUIST: 'linguist',
  CONTRIBUTOR: 'contributor',
  ADMIN: 'admin',
  GUEST: 'guest',
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  role?: UserRoleType;
  profile_pic_url?: string;
  is_active?: boolean;
  is_verified?: boolean;
}

/**
 * Fetches the current user's data from the API
 */
export const getCurrentUser = async (): Promise<User | null> => {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    return null;
  }

  try {
    const response = await fetch(API_ENDPOINTS.getMe, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as User;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
};

/**
 * Checks if the current user is a guest
 */
export const isGuestUser = (user: User | null): boolean => {
  return user?.role === UserRole.GUEST;
};

/**
 * Checks if the current user is an admin
 */
export const isAdminUser = (user: User | null): boolean => {
  return user?.role === UserRole.ADMIN;
};

/**
 * Checks if the current user is a linguist
 */
export const isLinguistUser = (user: User | null): boolean => {
  return user?.role === UserRole.LINGUIST;
};

/**
 * Checks if the current user is a contributor or has higher privileges
 */
export const isContributorOrHigher = (user: User | null): boolean => {
  return (
    user?.role === UserRole.CONTRIBUTOR ||
    user?.role === UserRole.LINGUIST ||
    user?.role === UserRole.ADMIN
  );
};

/**
 * Checks if the current user can access workspace features
 */
export const canAccessWorkspace = (user: User | null): boolean => {
  return !isGuestUser(user) && user?.role !== undefined;
};

/**
 * Checks if the current user can bookmark terms/glossaries
 */
export const canBookmark = (user: User | null): boolean => {
  return !isGuestUser(user) && user?.role !== undefined;
};

/**
 * Checks if the current user can create learning paths
 */
export const canAccessLearningPaths = (user: User | null): boolean => {
  return !isGuestUser(user) && user?.role !== undefined;
};

/**
 * Checks if the current user can view/edit profile
 */
export const canAccessProfile = (user: User | null): boolean => {
  return !isGuestUser(user) && user?.role !== undefined;
};

/**
 * Checks if the current user can access admin features
 */
export const canAccessAdmin = (user: User | null): boolean => {
  return isAdminUser(user);
};

/**
 * Checks if the current user can submit feedback
 */
export const canSubmitFeedback = (user: User | null): boolean => {
  // Guests can submit feedback but it won't be tied to their account
  return user !== null;
};

/**
 * Gets a display name for the user
 */
export const getUserDisplayName = (user: User | null): string => {
  if (!user) return 'Unknown User';
  if (isGuestUser(user)) return 'Guest';
  return `${user.first_name} ${user.last_name}`.trim() || 'User';
};

/**
 * Checks if the user is authenticated (has a valid token)
 */
export const isAuthenticated = (): boolean => {
  return localStorage.getItem('accessToken') !== null;
};

/**
 * Logs out the current user
 */
export const logout = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('userData');
  window.location.href = '/login';
};
