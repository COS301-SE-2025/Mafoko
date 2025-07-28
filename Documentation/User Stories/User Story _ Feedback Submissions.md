# User Story : Feedback Submissions

**Title:** User Contributions and Feedback

**As a:** logged-in user of the application,

**I want:** to be able to comment on terms and submit feedback or error reports,,

**So that:** I can contribute to improving the accuracy and usefulness of the data content.

---

## Acceptance Criteria:

1.  **Commenting on Terms:**
    - **Given** I am logged into my account,
    - **And** I am viewing a term or entry,
    - **Then** I should see a comment section below the entry,
    - **And** I should be able to submit my own comment

2.  **Submitting Feedback:**
    - **Given** I am logged into my account,
    - **And** I am viewing a specific term or entry,
    - **And** I choose to provide feedback,
    - **Then** I should be presented with a feedback form,
    - **And** I should receive a confirmation message after successfully submitting the feedback.

3.  **Voting on User Contributions:**
    - **Given** I am logged into my account,
    - **And** I am viewing a comment or suggestion submitted by another user,
    - **Then** I should see upvote and downvote buttons associated with it,
    - **And** I should be able to cast one vote per contribution,
    - **And** the vote count should update immediately after I vote.
4.  **Approval Status of Feedback:**
    - **Given** I have submitted feedback for a term,
    - **And** the feedback has been approved by a moderator,
    - **Then** the approved feedback should be integrated into the application content,
    - **And** I should receive a notification confirming the integration.

5.  **Marking Approved Submissions:**marking user submission criterion added v.1.1.0
    - **Given** user feedback or content has been approved and integrated,
    - **Then** the associated entry should be visibly marked as a "User Submission" to distinguish it from original content.

6.  **Rewarding User Contributions (Optional Gamification):**
    - **Given** I am logged in and submit a comment, feedback, or report,
    - **When** my contribution meets a predefined threshold (e.g., approved, upvoted),
    - **Then** I should earn points or badges for that action,
    - **And** my contribution stats should be viewable in my profile.

---

**Notes/Assumptions:**

- Only logged-in users can comment, submit feedback, vote, or receive contribution rewards.
- Users must have verified accounts to interact with community features (e.g., comments, voting).
- Rate limiting will be implemented to prevent spam submissions
