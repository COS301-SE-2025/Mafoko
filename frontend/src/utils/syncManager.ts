import {
  getAndClearPendingComments,
  getAndClearPendingCommentVotes,
  getAndClearPendingCommentEdits,
  getAndClearPendingCommentDeletes,
} from './indexedDB';
import { API_ENDPOINTS } from '../config';

export async function orchestrateCommentSync(): Promise<boolean> {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    console.log('Sync Manager: No auth token, aborting sync.');
    return false;
  }
  console.log('Sync Manager: Starting orchestration...');

  // 1. Sync New Comments and build the ID map
  const pendingComments = await getAndClearPendingComments();
  const tempIdToPermanentIdMap = new Map<string, string>();

  if (pendingComments.length > 0) {
    console.log(
      `Sync Manager: Syncing ${pendingComments.length} new comments.`,
    );
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
            tempId: comment.id, // Send the temporary ID to the server
          }),
        });
        if (!response.ok) throw new Error('Failed to post comment');

        // This relies on the backend change from Step 1
        const { newComment, tempId } = await response.json();
        if (tempId && newComment.id) {
          tempIdToPermanentIdMap.set(tempId, newComment.id);
        }
      } catch (error) {
        console.error('Sync Manager: Failed to sync a comment.', error);
        // Optional: Implement logic to add the failed comment back to the pending queue
      }
    }
  }

  // 2. Sync Votes, using the new permanent IDs from the map
  const pendingVotes = await getAndClearPendingCommentVotes();
  if (pendingVotes.length > 0) {
    console.log(`Sync Manager: Syncing ${pendingVotes.length} votes.`);
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

  // 3. Sync Edits, using the new permanent IDs
  const pendingEdits = await getAndClearPendingCommentEdits();
  if (pendingEdits.length > 0) {
    console.log(`Sync Manager: Syncing ${pendingEdits.length} edits.`);
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

  // 4. Sync Deletes, using the new permanent IDs
  const pendingDeletes = await getAndClearPendingCommentDeletes();
  if (pendingDeletes.length > 0) {
    console.log(`Sync Manager: Syncing ${pendingDeletes.length} deletes.`);
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

  console.log('Sync Manager: Orchestration complete.');
  // Return true if there were any pending items to sync
  return (
    pendingComments.length > 0 ||
    pendingVotes.length > 0 ||
    pendingEdits.length > 0 ||
    pendingDeletes.length > 0
  );
}
