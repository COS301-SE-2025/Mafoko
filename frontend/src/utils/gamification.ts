import { API_ENDPOINTS } from '../config';

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
 * Award XP to a user for a specific action
 */
async function awardXP(
  request: XPAwardRequest,
): Promise<XPAwardResponse | null> {
  const authToken = getAuthToken();
  if (!authToken) {
    console.warn('No auth token available for XP award');
    return null;
  }

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
    xp_amount: 25,
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
    xp_amount: 100,
    xp_source: 'term_addition',
    source_reference_id: applicationId,
    description: 'Term application approved by admin',
  });
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
} as const;
