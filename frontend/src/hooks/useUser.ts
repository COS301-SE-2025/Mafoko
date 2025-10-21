import { useState, useEffect } from 'react';
import { getCurrentUser, User } from '../utils/userUtils';

/**
 * Custom hook for managing user authentication state
 */
export const useUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError('Failed to fetch user data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchUser();
  }, []);

  const refreshUser = () => {
    void fetchUser();
  };

  return {
    user,
    isLoading,
    error,
    refreshUser,
  };
};
