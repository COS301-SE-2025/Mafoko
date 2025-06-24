
# Mavito Glossaries User Stories



## User Story #9: Term Detail View

**ID:** US009 (Mavito Project)  
**Title:** View Detailed Term Information  
**As a:** terminology researcher,  
**I want:** to view detailed information about a specific term,  
**So that:** I can understand its meaning and translations.

### Acceptance Criteria:

1. **Definition Display:**
   - **Given** I have selected a term from search results,
   - **Then** I should see its complete definition,
   - **And** its assigned category with clickable link to the full glossary.

2. **Translation Panel:**
   - **Given** I am viewing a term,
   - **Then** all available translations should be displayed in a structured table,
   - **With** clear language code labels (e.g., "afr", "zul").

3. **Missing Data Handling:**
   - **Given** a term lacks translation for certain languages,
   - **Then** those fields should display "Translation not available",
   - **And** be visually distinct from complete entries.

### Notes/Assumptions:
- Integrates with US003 search results
- Preserves all existing search filters when navigating from results to term view

## User Story #10: Glossary Category Navigation



**ID:** US010 (Marito Project)  


**Title:** Browse Terms by Subject Area  
**As a:** user interested in exploring specific domains (e.g., Agriculture, Legal),  
**I want:** to browse all terms within a particular category,  
**So that:** I can discover related terminology.

### Acceptance Criteria:

1. **Category Selection:**
   - **Given** I access the glossary browser,
   - **Then** I should see all available categories.
  

2. **Term Listing:**
   - **Given** I select a category (e.g., "Agriculture"),
   - **Then** I should see paginated results of all terms,
   - **With** options to filter by language availability.

3. **Cross-Referencing:**
   - **Given** I view a term in a glossary,
   - **Then** I should see related terms from the same category,
   - **And** options to navigate to similar categories.

### Notes/Assumptions:
- Categories are predefined based on dataset taxonomy
- Works both online and for downloaded glossaries

## User Story #11: Term Bank Translations

**ID:** US011 (Marito Project)  

**Title:** Access Multilingual Translations  
**As a:** multilingual user,  
**I want:** to toggle between translations for a term,  
**So that:** I can understand it in my preferred language.

### Acceptance Criteria:

1. **Translation Toggle:**
   - **Given** I view a term,
   - **When** I click a language tab (e.g., "Zulu"),
   - **Then** I should see the translation ("Imbewu kawoyela").

2. **Missing Translations:**
   - **Given** a term has no translation for a language,
   - **Then** display "Translation not available."

### Notes/Assumptions:
- Uses the `translations` field from the dataset.

