# User Story: XP-Based Community Gamification System

**Title:** XP-Based Community Engagement and Activity Tracking

**As a:** contributor using the Marito application,
**I want:** to earn experience points for my community contributions and visualize my activity progress,
**So that:** I am motivated to actively participate and can track my engagement over time.

---

## Acceptance Criteria:

### 1. XP Earning System
* **Given** I perform community actions,
* **When** I complete specific activities,
* **Then** I earn XP for the following actions:
  - Adding a comment
  - Adding a new term
  - Having my term receive an upvote

### 2. Activity Graph Visualization
* **Given** I navigate to my profile or dashboard,
* **When** I view my activity section,
* **Then** I see a GitHub-style commit graph that displays:
  - Daily activity squares for the past year
  - Color based on XP earned that day
  - Tooltip showing exact XP earned on hover

### 3. Weekly Activity Goals
* **Given** I want to set engagement targets,
* **When** I access my goal settings,
* **Then** I can:
  - Set weekly goals (e.g., "Add 3 terms this week")
  - View progress toward current goals
  - Earn bonus XP when goals are completed
  - Receive notifications about goal progress and completion

### 4. Goal Achievement Rewards
* **Given** I work toward weekly goals,
* **When** I complete a weekly goal,
* **Then** I receive:
  - Bonus XP for goal completion
  - Visual confirmation of achievement

### 5. Upvote-Based XP System
* **Given** I have contributed terms to the community,
* **When** other users upvote my terms,
* **Then** I automatically earn XP for each upvote received,
* **And** I receive notifications about the XP earned from community validation

### 6. XP Statistics
* **Given** I want to track my overall progress,
* **When** I view my profile,
* **Then** I can see:
  - Total XP accumulated
  - XP earned this week/month

### 7. Offline XP Tracking
* **Given** I contribute to the community while offline,
* **When** my internet connection is restored,
* **Then** all offline contributions are synced,
* **And** the appropriate XP is awarded retroactively,
* **And** my activity graph and statistics are updated accordingly

---

## Notes/Assumptions:

- XP values may need adjustment based on user behavior
- Weekly goals should be achievable
- The system should prevent XP farming or abuse
- Integration with existing community features is present
- Offline functionality is provided for XP features