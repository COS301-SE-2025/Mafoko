# User Story #2: Crowdsourced Term Validation

**ID:** US002 (Marito Project)
**Title:** Crowdsourced Validation via Up/Down Voting

**As a:** Marito application user (e.g., linguist or contributor)
**I want:** to upvote or downvote individual terms in the lexicon
**So that:** the community can collectively validate the quality and accuracy of terms, helping moderators and other users identify high-quality entries.

---

## Acceptance Criteria

1. **Voting Interface:**
    * [x] **Given** I am viewing a term on a term card,
    * [x] **Then** I see "thumbs-up" and "thumbs-down" buttons next to the term.
    * [x] **And** the current total upvote and downvote counts are displayed with the buttons.

2. **Casting a Vote:**
    * [x] **Given** I am logged in and have not yet voted on a specific term,
    * [x] **When** I click the "thumbs-up" button,
    * [x] **Then** my vote is recorded, the upvote count increases by 1, and the button becomes highlighted.

3. **Changing a Vote:**
    * [x] **Given** I have already downvoted a term,
    * [x] **When** I click the "thumbs-up" button,
    * [x] **Then** my vote is changed from a downvote to an upvote, the downvote count decreases by 1, the upvote count increases by 1, and the button highlights are updated.

4. **Removing a Vote (Un-voting):**
    * [x] **Given** I have already upvoted a term,
    * [x] **When** I click the "thumbs-up" button again,
    * [x] **Then** my vote is removed, the upvote count decreases by 1, and the button is no longer highlighted.

5. **Offline Voting (NEW):**
    * [x] **Given** I am offline and I click a vote button,
    * [x] **Then** the UI should update optimistically to show my vote.
    * [x] **And** the vote action should be queued locally.
    * [x] **When** my internet connection is restored,
    * [x] **Then** the queued vote should be automatically sent to the server.

---

### Notes/Assumptions

* Voting requires user authentication to prevent abuse.

* The system prevents a user from casting the same vote multiple times.
