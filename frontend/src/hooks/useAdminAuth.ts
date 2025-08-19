import { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config';

interface UserResponse {
  role: string;
}

/**
 * Custom hook for admin authentication
 * Reusable admin role checking logic extracted from AdminPage.tsx
 */
export const useAdminAuth = () => {
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      const token = localStorage.getItem('accessToken');

      if (!token) {
        window.location.href = '/login';
        return;
      }

      try {
        const response = await fetch(API_ENDPOINTS.getMe, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          setAuthError(
            `Error ${response.status.toString()}: ${response.statusText}`,
          );
          setIsLoading(false);
          return;
        }

        const user = (await response.json()) as UserResponse;

        if (user.role !== 'admin') {
          setAuthError('Error 403: Forbidden - Admin access required');
        } else {
          setAuthError(null); // Clear any previous errors
        }
      } catch (err) {
        console.error('Error checking admin role:', err);
        setAuthError('Error 500: Unable to verify admin access');
      } finally {
        setIsLoading(false);
      }
    };

    void checkAdminRole();
  }, []);

  return { authError, isLoading };
};
