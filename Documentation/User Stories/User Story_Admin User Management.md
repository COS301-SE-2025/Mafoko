# User Story : Admin User Management

**Title:** Admin Review and Management of Platform Users

**As a:** Marito administrator,  
**I want:** to be able to view all registered users and manage researcher role applications by reviewing uploaded documents and approving or rejecting them,  
**So that:** I can ensure only verified and legitimate users gain access to specialized research capabilities on the platform.

---

## Acceptance Criteria:

### 1. View All Users
- **Given** I am logged in as an admin,  
- **When** I navigate to the "User Management" section,  
- **Then** I should see a list of all users registered on the platform,  
- **And** the list should include user metadata like email, current role and registration date.

### 2. Promote Users to Admin
- **Given** I am logged in as an admin,  
- **And** I am viewing the "User Management" section,   
- **Then** I should see an option to promote the user to "Admin",  
- **And** after clicking on the option, the user's role should be updated to "Admin".

### 3. View Researcher Role Applications
- **Given** I am logged in as an admin,  
- **And** a user has applied for the researcher role by uploading a required document,  
- **When** I navigate to the "Researcher Requests" section,  
- **Then** I should see a list of all pending researcher applications,  
- **And** each entry should include the user's details with the uploaded document.

### 4. Review Uploaded Documents
- **Given** I am on the researcher request list as an admin,  
- **When** I select a specific application,  
- **Then** I should be able to view the uploaded document in a preview or download it.

### 5. Approve Researcher Request
- **Given** I have reviewed a research role application and verified the document,  
- **When** I click on the "Approve" button for that application,  
- **Then** the user's role should be updated to "Researcher".

### 6. Reject Researcher Request
- **Given** I have reviewed a research role application and found it insufficient or invalid,  
- **When** I click on the "Reject" button for that application,  
- **Then** the application should be marked as "Rejected",  
- **And** the user should be notified of the rejection with an optional reason.

---

**Notes/Assumptions:**

- Users must upload a document in PDF format as part of their researcher role application.  
- Admins have full visibility into user metadata including email, role, and registration date.  
- Rejected users can re-apply with updated documentation.  
- Only existing admins can promote other users to admin.  
