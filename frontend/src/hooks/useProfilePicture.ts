import { useState, useCallback, useEffect } from 'react';
import { API_ENDPOINTS } from '../config';
import {
  addPendingProfilePictureUpload,
  getPendingProfilePictureUploadCount,
} from '../utils/indexedDB';

interface ProfilePictureCacheData {
  url: string;
  timestamp: number;
}

interface UseProfilePictureReturn {
  profilePictureUrl: string | null;
  loadingProfilePicture: boolean;
  loadProfilePicture: () => Promise<void>;
  clearProfilePictureCache: (userId: string) => void;
  uploadProfilePicture: (file: File) => Promise<{
    success: boolean;
    wasQueued: boolean;
    error?: string;
  }>;
  getPendingUploadCount: () => Promise<number>;
}

export const useProfilePicture = (userId?: string): UseProfilePictureReturn => {
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    null,
  );
  const [loadingProfilePicture, setLoadingProfilePicture] = useState(false);

  const clearProfilePictureCache = useCallback((targetUserId: string) => {
    sessionStorage.removeItem(`profilePic_${targetUserId}`);

    const storedUserDataString = localStorage.getItem('userData');
    if (storedUserDataString) {
      try {
        const existingUserData = JSON.parse(storedUserDataString) as {
          uuid: string;
          firstName: string;
          lastName: string;
          profilePictureUrl?: string;
        };
        if (existingUserData.uuid === targetUserId) {
          const updatedUserData = {
            ...existingUserData,
            profilePictureUrl: undefined,
          };
          localStorage.setItem('userData', JSON.stringify(updatedUserData));
        }
      } catch (error) {
        console.error(
          'Failed to clear cached profile picture URL from localStorage:',
          error,
        );
      }
    }
  }, []);

  const loadProfilePicture = useCallback(async () => {
    if (!userId) {
      setProfilePictureUrl(null);
      return;
    }

    const cachedData = sessionStorage.getItem(`profilePic_${userId}`);
    if (cachedData) {
      try {
        const { url, timestamp } = JSON.parse(
          cachedData,
        ) as ProfilePictureCacheData;
        const isExpired = Date.now() - timestamp > 3600000;
        if (!isExpired) {
          setProfilePictureUrl(url);
          return;
        } else {
          sessionStorage.removeItem(`profilePic_${userId}`);
        }
      } catch {
        sessionStorage.removeItem(`profilePic_${userId}`);
      }
    }

    setLoadingProfilePicture(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setProfilePictureUrl(null);
        return;
      }

      const response = await fetch(API_ENDPOINTS.getMyProfilePictureUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = (await response.json()) as { view_url: string };

        setProfilePictureUrl(data.view_url);

        const cacheData: ProfilePictureCacheData = {
          url: data.view_url,
          timestamp: Date.now(),
        };
        sessionStorage.setItem(
          `profilePic_${userId}`,
          JSON.stringify(cacheData),
        );
      } else {
        console.log(
          'Profile picture API returned non-OK status:',
          response.status,
        );
        setProfilePictureUrl(null);
      }
    } catch (err) {
      console.error('Error loading profile picture:', err);
      setProfilePictureUrl(null);
    } finally {
      setLoadingProfilePicture(false);
    }
  }, [userId]);

  const uploadProfilePicture = useCallback(
    async (file: File) => {
      if (!userId) {
        return {
          success: false,
          wasQueued: false,
          error: 'No user ID provided',
        };
      }

      const token = localStorage.getItem('accessToken');
      if (!token) {
        return {
          success: false,
          wasQueued: false,
          error: 'No authentication token',
        };
      }

      if (navigator.onLine) {
        try {
          const uploadResult = await uploadProfilePictureOnline(
            file,
            userId,
            token,
          );
          if (uploadResult.success) {
            clearProfilePictureCache(userId);
            await loadProfilePicture();
            return { success: true, wasQueued: false };
          } else {
            await queueProfilePictureUpload(file, userId, token);
            return { success: true, wasQueued: true };
          }
        } catch {
          await queueProfilePictureUpload(file, userId, token);
          return { success: true, wasQueued: true };
        }
      } else {
        await queueProfilePictureUpload(file, userId, token);
        return { success: true, wasQueued: true };
      }
    },
    [userId, clearProfilePictureCache, loadProfilePicture],
  );

  const getPendingUploadCount = useCallback(async () => {
    return await getPendingProfilePictureUploadCount();
  }, []);

  useEffect(() => {
    if (userId) {
      void loadProfilePicture();
    } else {
      setProfilePictureUrl(null);
    }
  }, [userId, loadProfilePicture]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        (event.data as { type: string; userId: string }).type ===
          'PROFILE_PICTURE_SYNCED' &&
        (event.data as { type: string; userId: string }).userId === userId
      ) {
        clearProfilePictureCache(userId);
        void loadProfilePicture();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [userId, clearProfilePictureCache, loadProfilePicture]);

  return {
    profilePictureUrl,
    loadingProfilePicture,
    loadProfilePicture,
    clearProfilePictureCache,
    uploadProfilePicture,
    getPendingUploadCount,
  };
};

export const handleProfilePictureError = (
  userId: string,
  clearCache: (userId: string) => void,
  reloadFunction: () => Promise<void>,
) => {
  console.error('Profile picture failed to load for user:', userId);
  clearCache(userId);
  void reloadFunction();
};

async function uploadProfilePictureOnline(
  file: File,
  _userId: string,
  token: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const uploadUrlResponse = await fetch(
      API_ENDPOINTS.generateProfilePictureUploadUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          filename: file.name,
          content_type: file.type,
        }),
      },
    );

    if (!uploadUrlResponse.ok) {
      return {
        success: false,
        error: `Failed to get upload URL: ${String(uploadUrlResponse.status)}`,
      };
    }

    const uploadData = (await uploadUrlResponse.json()) as {
      upload_url: string;
      gcs_key: string;
    };

    const uploadResponse = await fetch(uploadData.upload_url, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      return {
        success: false,
        error: `Failed to upload to storage: ${String(uploadResponse.status)}`,
      };
    }

    const profileUpdateResponse = await fetch(
      API_ENDPOINTS.updateProfilePicture,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          profile_pic_url: uploadData.gcs_key,
        }),
      },
    );

    if (!profileUpdateResponse.ok) {
      return {
        success: false,
        error: `Failed to update profile: ${String(profileUpdateResponse.status)}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

async function queueProfilePictureUpload(
  file: File,
  userId: string,
  token: string,
): Promise<void> {
  const uploadData = {
    id: new Date().toISOString(),
    userId,
    file,
    fileName: file.name,
    contentType: file.type,
    token,
    timestamp: Date.now(),
  };

  await addPendingProfilePictureUpload(uploadData);

  try {
    const swRegistration = await navigator.serviceWorker.ready;
    await swRegistration.sync.register('sync-profile-pictures');
  } catch (error) {
    console.error(
      'Failed to register background sync for profile picture:',
      error,
    );
  }
}
