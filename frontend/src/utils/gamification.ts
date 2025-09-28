import { API_ENDPOINTS } from '../config';
import { addPendingXPAward, PendingXPAward } from './indexedDB';

export interface XPAwardRequest {
  user_id: string;
  xp_amount: number;
  xp_source: string;
  source_reference_id?: string;
  description?: string;
}

export interface XPAwardResponse {
  id: string;
  user_id: string;
  xp_amount: number;
  xp_source: string;
  source_reference_id: string | null;
  description: string | null;
  created_at: string;
}

function getAuthToken(): string | null {
  return localStorage.getItem('accessToken');
}

/**
 * Check if the user is currently offline
 */
function isOffline(): boolean {
  return !navigator.onLine;
}

/**
 * Award XP with offline support - queues for later sync if offline
 */
async function awardXPWithOfflineSupport(
  request: XPAwardRequest,
): Promise<XPAwardResponse | null> {
  const authToken = getAuthToken();
  if (!authToken) {
    console.warn('No auth token available for XP award');
    return null;
  }

  // If offline, queue the XP award for later sync
  if (isOffline()) {
    try {
      const pendingXP: PendingXPAward = {
        id: `xp-${String(Date.now())}-${Math.random().toString(36).substring(2, 11)}`,
        user_id: request.user_id,
        xp_amount: request.xp_amount,
        xp_source: request.xp_source,
        source_reference_id: request.source_reference_id || '',
        description: request.description,
        token: authToken,
        timestamp: Date.now(),
      };

      await addPendingXPAward(pendingXP);
      console.log(
        `XP award queued for offline sync: ${String(request.xp_amount)} XP`,
      );

      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const swRegistration = await navigator.serviceWorker.ready;
        if ('sync' in swRegistration) {
          await swRegistration.sync.register('sync-xp-awards');
        }
      }

      return null;
    } catch (error) {
      console.warn('Failed to queue XP award for offline sync:', error);
      return null;
    }
  }

  // If online, award XP immediately
  try {
    const response = await fetch(API_ENDPOINTS.addXP, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      console.warn(
        `Failed to award XP: ${String(response.status)} ${response.statusText}`,
      );
      return null;
    }

    return (await response.json()) as XPAwardResponse;
  } catch (error) {
    console.warn('Error awarding XP:', error);
    return null;
  }
}

async function awardXP(
  request: XPAwardRequest,
): Promise<XPAwardResponse | null> {
  return awardXPWithOfflineSupport(request);
}

/**
 * Award XP for creating a comment
 */
async function awardCommentXP(
  userId: string,
  commentId: string,
): Promise<void> {
  await awardXP({
    user_id: userId,
    xp_amount: 10,
    xp_source: 'comment',
    source_reference_id: commentId,
    description: 'Created a comment',
  });
}

/**
 * Award XP for receiving an upvote on comments
 */
async function awardUpvoteXP(userId: string, voteId: string): Promise<void> {
  await awardXP({
    user_id: userId,
    xp_amount: 5,
    xp_source: 'upvote_received',
    source_reference_id: voteId,
    description: 'Received an upvote on comment',
  });
}

/**
 * Award XP for receiving an upvote on published terms
 */
async function awardTermUpvoteXP(
  userId: string,
  termId: string,
): Promise<void> {
  await awardXP({
    user_id: userId,
    xp_amount: 5,
    xp_source: 'upvote_received',
    source_reference_id: termId,
    description: 'Received an upvote on published term',
  });
}

/**
 * Award XP for adding a term
 */
async function awardTermAdditionXP(
  userId: string,
  termId: string,
): Promise<void> {
  await awardXP({
    user_id: userId,
    xp_amount: 100,
    xp_source: 'term_addition',
    source_reference_id: termId,
    description: 'Added a new term',
  });
}

/**
 * Award XP for submitting feedback
 */
async function awardFeedbackXP(
  userId: string,
  feedbackId: string,
): Promise<void> {
  await awardXP({
    user_id: userId,
    xp_amount: 15,
    xp_source: 'feedback_submission',
    source_reference_id: feedbackId,
    description: 'Submitted feedback',
  });
}

/**
 * Award XP for receiving crowd verification votes
 */
async function awardCrowdVoteXP(
  userId: string,
  applicationId: string,
): Promise<void> {
  await awardXP({
    user_id: userId,
    xp_amount: 5,
    xp_source: 'term_upvote',
    source_reference_id: applicationId,
    description: 'Term application received crowd vote',
  });
}

/**
 * Award XP for linguist verification of term application
 */
async function awardLinguistVerificationXP(
  userId: string,
  applicationId: string,
): Promise<void> {
  await awardXP({
    user_id: userId,
    xp_amount: 25,
    xp_source: 'term_addition',
    source_reference_id: applicationId,
    description: 'Term application verified by linguist',
  });
}

/**
 * Award XP for admin verification of term application
 */
async function awardAdminVerificationXP(
  userId: string,
  applicationId: string,
): Promise<void> {
  await awardXP({
    user_id: userId,
    xp_amount: 25,
    xp_source: 'term_addition',
    source_reference_id: applicationId,
    description: 'Term application approved by admin',
  });
}

export interface UserLevel {
  id: string;
  user_id: string;
  current_level: number;
  total_xp: number;
  xp_for_next_level: number;
  xp_progress_in_level: number;
}

export interface UserAchievement {
  id: string;
  name: string;
  description: string;
  achievement_type: string;
  target_value: number;
  current_progress: number;
  is_earned: boolean;
  progress_percentage: number;
}

export interface LoginStreak {
  current_streak: number;
  longest_streak: number;
  last_login: string;
}

export interface XPRecord {
  id: string;
  user_id: string;
  xp_amount: number;
  xp_source: string;
  source_reference_id: string | null;
  description: string | null;
  created_at: string;
}

export interface WeeklyGoal {
  id: string;
  name: string;
  description: string;
  target_value: number;
  current_progress: number;
  is_completed: boolean;
  progress_percentage: number;
  xp_reward: number;
}

/**
 * Get user's current level and XP information
 */
async function getUserLevel(userId: string): Promise<UserLevel | null> {
  const authToken = getAuthToken();
  if (!authToken) {
    console.warn('No auth token available for level fetch');
    return null;
  }

  try {
    const response = await fetch(API_ENDPOINTS.getUserLevel(userId), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      console.warn(
        `Failed to fetch user level: ${String(response.status)} ${response.statusText}`,
      );
      return null;
    }

    return (await response.json()) as UserLevel;
  } catch (error) {
    console.warn('Error fetching user level:', error);
    return null;
  }
}

/**
 * Get user's achievements and progress
 */
async function getUserAchievements(
  userId: string,
): Promise<UserAchievement[] | null> {
  const authToken = getAuthToken();
  if (!authToken) {
    console.warn('No auth token available for achievements fetch');
    return null;
  }

  try {
    const response = await fetch(
      `${API_ENDPOINTS.getUserAchievements(userId)}/progress`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    if (!response.ok) {
      console.warn(
        `Failed to fetch user achievements: ${String(response.status)} ${response.statusText}`,
      );
      return null;
    }

    return (await response.json()) as UserAchievement[];
  } catch (error) {
    console.warn('Error fetching user achievements:', error);
    return null;
  }
}

/**
 * Get user's login streak information
 */
async function getUserLoginStreak(userId: string): Promise<LoginStreak | null> {
  const authToken = getAuthToken();
  if (!authToken) {
    console.warn('No auth token available for login streak fetch');
    return null;
  }

  try {
    const response = await fetch(API_ENDPOINTS.getUserLoginStreak(userId), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      console.warn(
        `Failed to fetch login streak: ${String(response.status)} ${response.statusText}`,
      );
      return null;
    }

    return (await response.json()) as LoginStreak;
  } catch (error) {
    console.warn('Error fetching login streak:', error);
    return null;
  }
}

/**
 * Get user's XP records
 */
async function getUserXPRecords(userId: string): Promise<XPRecord[] | null> {
  const authToken = getAuthToken();
  if (!authToken) {
    console.warn('No auth token available for XP records fetch');
    return null;
  }

  try {
    const response = await fetch(API_ENDPOINTS.getUserXPRecords(userId), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      console.warn(
        `Failed to fetch XP records: ${String(response.status)} ${response.statusText}`,
      );
      return null;
    }

    return (await response.json()) as XPRecord[];
  } catch (error) {
    console.warn('Error fetching XP records:', error);
    return null;
  }
}

/**
 * Get user's weekly goals progress
 */
async function getUserWeeklyGoals(
  userId: string,
): Promise<WeeklyGoal[] | null> {
  const authToken = getAuthToken();
  if (!authToken) {
    console.warn('No auth token available for weekly goals fetch');
    return null;
  }

  try {
    const response = await fetch(
      `${API_ENDPOINTS.getUserAchievements(userId)}/weekly`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    );

    if (!response.ok) {
      console.warn(
        `Failed to fetch weekly goals: ${String(response.status)} ${response.statusText}`,
      );
      return null;
    }

    return (await response.json()) as WeeklyGoal[];
  } catch (error) {
    console.warn('Error fetching weekly goals:', error);
    return null;
  }
}
export const GamificationService = {
  awardXP,
  awardCommentXP,
  awardUpvoteXP,
  awardTermUpvoteXP,
  awardTermAdditionXP,
  awardFeedbackXP,
  awardCrowdVoteXP,
  awardLinguistVerificationXP,
  awardAdminVerificationXP,
  getUserLevel,
  getUserAchievements,
  getUserLoginStreak,
  getUserXPRecords,
  getUserWeeklyGoals,
} as const;
