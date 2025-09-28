# Marito Learning Path User Story


## User Story: Learning Paths

**ID:** US_LP01 (Marito Project)  
**Title:** Learning Path Management and Study Flow  
**As a:** Learner, Instructor, or Admin,  
**I want:** to discover, create, manage and study curated learning paths built from glossaries,  
**So that:** learners can progress through domain-oriented term sets, track progress and study using flashcards or study lists.

### Primary Actors

- Learner (primary): browses, creates paths, studies, and tracks progress.  


### Scope

This story covers the Learning Path user-facing flows: discovery, creation/editing, glossary attachment, study (list + flashcards), progress tracking, and sharing/exporting a path. 

### Acceptance Criteria

1. Create & View Paths
   - Given I am a Learner,
   - When I visit the Learning Paths page,
   - Then I should see a list of available paths with title, number of words, and progress indicator (if enrolled).
   - And I should be able to open a path to view its details (categories, glossaries attached, and actions).


2. Create a Learning Path 
   - Given I am an authenticated user,
   - When I choose to create a new path,
   - Then I must provide a title, and attach at least one glossary (existing or imported).

3. Delete Path 
   - Given I am the path owner,
   - Then I should be able to change the title, attached glossaries, and order.
   - When I delete a path, a confirmation must be presented and enrolled learners' progress data should be archived/handled per policy.

4. Attach / Remove Glossaries
   - Given I am creating a path,
   - When I attach a glossary, 
   - Then the glossary's terms should be linked to the path and visible in the path detail view.
   - Removing a glossary should remove its terms from the path but preserve learner progress metadata for audit.

5. Study Flows: Study Words and Flashcards
   - Given I am enrolled as a user,
   - When I open a glossary or path study view,
   - Then I can choose between "Study Words" (list + progress per word) or "Flashcards" (randomized)
   - Selecting an individual word shows its details (definition, translations, example) and the ability to mark mastery or add notes.
   - Flashcards should provide a way to mark correct/incorrect and affect progress calculation.

6. Track Progress
   - Given I study words or use flashcards,
   - When I mark words as studied or answer flashcards,
   - Then the system should update my per-path and per-glossary progress metrics in near real-time and display them in the path overview.


### Edge cases & Error Handling

- Large glossaries: import should be chunked or background-processed; UI shows progress and completion notifications.  
- Conflicting glossary versions: system should detect duplicate glossary ids and allow merge or versioning.

### Notes / Assumptions

- Progress model: progress is tracked per-learner, per-path, and per-glossary using a percentage and a timestamped event log.  
- Glossaries are uniquely identified and can be attached to multiple paths.  
- UI components (Study Words, Flashcards, Path Editor modal) will reuse existing glossary and flashcard components where possible.

### Acceptance Test Ideas

1. Create a path with glossaries, enroll a test learner, mark several words as learned, and verify progress updates on dashboard.  
2. Import a sample glossary file with mixed valid/invalid entries; verify errors are surfaced and valid terms are attachable.  
3. Verify enrolled learners can enroll and see progress; verify users without appropriate roles cannot perform restricted actions.

