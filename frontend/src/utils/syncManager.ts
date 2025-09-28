import {
  getAndClearPendingComments,
  getAndClearPendingCommentVotes,
  getAndClearPendingCommentEdits,
  getAndClearPendingCommentDeletes,
  getAndClearPendingTermSubmissions,
  getAndClearPendingTermVotes,
  getAndClearPendingTermApprovals,
  getAndClearPendingTermRejections,
  getAndClearPendingTermDeletes,
  getAndClearPendingXPAwards,
  replaceAllTerms,
} from './indexedDB';
import { API_ENDPOINTS } from '../config';

export const refreshAllTermsCache = async () => {
  try {
    console.log('Sync Manager: Refreshing all terms cache in IndexedDB...');
    const response = await fetch(API_ENDPOINTS.getAllTermsForOffline);
    if (response.ok) {
      const data = await response.json();
      await replaceAllTerms(data.items);
      console.log('Sync Manager: All terms cache refreshed.');
    }
  } catch (error) {
    console.error('Sync Manager: Failed to refresh all terms cache.', error);
  }
};

export async function orchestrateCommentSync(): Promise<boolean> {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;

  const pendingComments = await getAndClearPendingComments();
  const pendingVotes = await getAndClearPendingCommentVotes();
  const pendingEdits = await getAndClearPendingCommentEdits();
  const pendingDeletes = await getAndClearPendingCommentDeletes();

  const didWork =
    pendingComments.length > 0 ||
    pendingVotes.length > 0 ||
    pendingEdits.length > 0 ||
    pendingDeletes.length > 0;
  if (!didWork) return false;

  console.log('Sync Manager: Starting comment orchestration...');
  const tempIdToPermanentIdMap = new Map<string, string>();

  if (pendingComments.length > 0) {
    for (const comment of pendingComments) {
      try {
        const response = await fetch(API_ENDPOINTS.postComment, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            term_id: comment.term_id,
            content: comment.text,
            parent_id: comment.parentId,
            tempId: comment.id,
          }),
        });
        if (!response.ok) continue;
        const { newComment, tempId } = await response.json();
        if (tempId && newComment.id) {
          tempIdToPermanentIdMap.set(tempId, newComment.id);
        }
      } catch (error) {
        console.error('Sync Manager: Failed to sync a comment.', error);
      }
    }
  }

  if (pendingVotes.length > 0) {
    for (const vote of pendingVotes) {
      const commentId =
        tempIdToPermanentIdMap.get(vote.comment_id) || vote.comment_id;
      try {
        await fetch(API_ENDPOINTS.voteOnComment, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ comment_id: commentId, vote: vote.vote }),
        });
      } catch (error) {
        console.error('Sync Manager: Failed to sync a vote.', error);
      }
    }
  }

  if (pendingEdits.length > 0) {
    for (const edit of pendingEdits) {
      const commentId =
        tempIdToPermanentIdMap.get(edit.comment_id) || edit.comment_id;
      try {
        await fetch(API_ENDPOINTS.editComment(commentId), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content: edit.content }),
        });
      } catch (error) {
        console.error('Sync Manager: Failed to sync an edit.', error);
      }
    }
  }

  if (pendingDeletes.length > 0) {
    for (const del of pendingDeletes) {
      const commentId =
        tempIdToPermanentIdMap.get(del.comment_id) || del.comment_id;
      try {
        await fetch(API_ENDPOINTS.deleteComment(commentId), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        console.error('Sync Manager: Failed to sync a delete.', error);
      }
    }
  }

  console.log('Sync Manager: Comment orchestration complete.');
  if (didWork) await refreshAllTermsCache();
  return didWork;
}

export async function orchestrateXPSync(): Promise<boolean> {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;

  const pendingXPAwards = await getAndClearPendingXPAwards();

  if (pendingXPAwards.length === 0) return false;

  console.log('Sync Manager: Starting XP award orchestration...');

  for (const xpAward of pendingXPAwards) {
    try {
      const response = await fetch(API_ENDPOINTS.addXP, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${xpAward.token}`,
        },
        body: JSON.stringify({
          user_id: xpAward.user_id,
          xp_amount: xpAward.xp_amount,
          xp_source: xpAward.xp_source,
          source_reference_id: xpAward.source_reference_id,
          description: xpAward.description,
        }),
      });

      if (!response.ok) {
        console.error(
          `Sync Manager: Failed to sync XP award. Status: ${response.status}`,
        );
      } else {
        console.log(
          `Sync Manager: Successfully synced XP award (${xpAward.xp_amount} XP)`,
        );
      }
    } catch (error) {
      console.error('Sync Manager: Failed to sync XP award:', error);
    }
  }

  console.log('Sync Manager: XP award orchestration complete.');
  return true;
}

export async function orchestrateTermSync(): Promise<boolean> {
  const token = localStorage.getItem('accessToken');
  if (!token) return false;

  const pendingSubmissions = await getAndClearPendingTermSubmissions();
  const pendingVotes = await getAndClearPendingTermVotes();
  const pendingApprovals = await getAndClearPendingTermApprovals();
  const pendingRejections = await getAndClearPendingTermRejections();
  const pendingDeletes = await getAndClearPendingTermDeletes();

  const didWork =
    pendingSubmissions.length > 0 ||
    pendingVotes.length > 0 ||
    pendingApprovals.length > 0 ||
    pendingRejections.length > 0 ||
    pendingDeletes.length > 0;
  if (!didWork) return false;

  console.log('Sync Manager: Starting term action orchestration...');
  const tempIdToPermanentIdMap = new Map<string, string>();

  if (pendingSubmissions.length > 0) {
    for (const sub of pendingSubmissions) {
      try {
        const response = await fetch(API_ENDPOINTS.submitTerm, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sub.token}`,
          },
          body: JSON.stringify({ ...sub.body, tempId: sub.id }),
        });
        if (!response.ok) continue;
        const { newApplication, tempId } = await response.json();
        if (tempId && newApplication.id) {
          tempIdToPermanentIdMap.set(tempId, newApplication.id);
        }
      } catch (error) {
        console.error('Sync Manager: Failed to sync a submission.', error);
      }
    }
  }

  if (pendingVotes.length > 0) {
    for (const vote of pendingVotes) {
      const applicationId =
        tempIdToPermanentIdMap.get(vote.applicationId) || vote.applicationId;
      try {
        await fetch(API_ENDPOINTS.voteForTerm(applicationId), {
          method: 'POST',
          headers: { Authorization: `Bearer ${vote.token}` },
        });
      } catch (error) {
        console.error('Sync Manager: Failed to sync a term vote.', error);
      }
    }
  }

  if (pendingApprovals.length > 0) {
    for (const approval of pendingApprovals) {
      const applicationId =
        tempIdToPermanentIdMap.get(approval.applicationId) ||
        approval.applicationId;
      const endpoint =
        approval.role === 'admin'
          ? API_ENDPOINTS.adminApproveApplication(applicationId)
          : API_ENDPOINTS.linguistVerifyApplication(applicationId);
      try {
        await fetch(endpoint, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${approval.token}` },
        });
      } catch (error) {
        console.error('Sync Manager: Failed to sync an approval.', error);
      }
    }
  }

  if (pendingRejections.length > 0) {
    for (const rejection of pendingRejections) {
      const applicationId =
        tempIdToPermanentIdMap.get(rejection.applicationId) ||
        rejection.applicationId;
      const endpoint =
        rejection.role === 'admin'
          ? API_ENDPOINTS.adminRejectApplication(applicationId)
          : API_ENDPOINTS.linguistRejectApplication(applicationId);
      try {
        await fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${rejection.token}`,
          },
          body: JSON.stringify(rejection.body),
        });
      } catch (error) {
        console.error('Sync Manager: Failed to sync a rejection.', error);
      }
    }
  }

  if (pendingDeletes.length > 0) {
    for (const del of pendingDeletes) {
      const applicationId =
        tempIdToPermanentIdMap.get(del.applicationId) || del.applicationId;
      try {
        await fetch(API_ENDPOINTS.deleteTermApplication(applicationId), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${del.token}` },
        });
      } catch (error) {
        console.error('Sync Manager: Failed to sync a delete.', error);
      }
    }
  }

  console.log('Sync Manager: Term action orchestration complete.');
  if (didWork) await refreshAllTermsCache();
  return didWork;
}
