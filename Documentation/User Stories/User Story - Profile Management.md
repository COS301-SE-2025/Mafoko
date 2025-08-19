# User Story : Profile Management


**Title:** User Profile Management

**As a:** logged-in user of the application,

**I want:** to be able to manage my profile information including picture, username, email address, and password,

**So that:** I can maintain accurate personal information and secure access to my account.

---

## Acceptance Criteria:

1. **Setting Profile Picture:**
   * **Given** I am logged into my account,
   * **And** I am viewing my profile settings,
   * **Then** I should see an option to upload or change my profile picture,
   * **And** I should be able to select an image file and save it successfully

2. **Changing Username:**
   * **Given** I am logged into my account,
   * **And** I am viewing my profile settings,
   * **Then** I should see a field to update my username,
   * **And** I should receive confirmation when the username is successfully changed

3. **Changing Email Address:**
   * **Given** I am logged into my account,
   * **And** I want to update my email address,
   * **Then** I should be required to validate my existing password before making the change,
   * **And** I should receive a confirmation email at the new address to verify the change

4. **Changing Password:**
   * **Given** I am logged into my account,
   * **And** I want to change my password,
   * **Then** I should be required to validate my existing password,
   * **And** I should be able to enter and confirm a new password,
   * **And** I should receive confirmation when the password is successfully updated

5. **Logging Out:**
   * **Given** I am logged into my account,
   * **When** I choose to log out,
   * **Then** I should be securely signed out of the application,
   * **And** I should be redirected to the login page or home page


---

**Notes/Assumptions:**

* Users must be authenticated to access profile management features.
* Password changes require validation of the current password for security.
* Profile picture uploads should have file size and format restrictions.