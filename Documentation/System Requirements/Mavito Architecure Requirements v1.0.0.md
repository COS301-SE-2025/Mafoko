# Architecture requirements

**AR (Architectural Requirements)**

- **AR1 System Architecture Style**
    - AR1.1 **Progressive Web App (PWA) Architecture:** The system must be designed as a PWA to support core features like offline functionality and installability.
    - AR1.2 **Client-Server Architecture:** The system will likely follow a client-server model, with the React/TypeScript frontend acting as the client and the Python backend serving as the server.
    - AR1.3 (Consideration) **Modular Design:** The architecture must be modular to enable seamless integration of future datasets, features, and to allow for independent development and scaling of components. (Also listed as NFR2.2)
- **AR2 Backend Architecture**
    - AR2.1 **Scalable Backend:** The backend system must be designed for scalability to handle growth in users, data, and request loads.
        - AR2.1.1 The project proposal suggests using a cloud-based system (e.g., Firebase, Supabase) for centralized data storage and backend services. This choice should be confirmed and detailed.
    - AR2.2 **API Design:**
        - AR2.2.1 If APIs are exposed (e.g., for NLP researchers or future integrations), they should be designed following RESTful principles.
        - AR2.2.2 APIs should be well-documented.
- **AR3 Frontend Architecture**
    - AR3.1 **Component-Based Architecture:** Given the use of React, the frontend will follow a component-based architecture, promoting reusability and maintainability.
    - AR3.2 **State Management:** A clear strategy for state management (e.g., React Context, Redux, Zustand) must be chosen and documented.
- **AR4 Data Architecture**
    - AR4.1 **Data Storage:** Specify the chosen database solution (e.g., NoSQL like Firebase Firestore, SQL like PostgreSQL via Supabase, or other, based on project needs for structured/unstructured data and search).
    - AR4.2 **Data Flow:** Define how data flows between the frontend, backend, database, and any external services (e.g., for PWA offline storage, synchronization).
    - AR4.3 **Indexing for Search:** The architecture must support efficient indexing mechanisms for fast and effective searching across multilingual lexicons. (Also listed as NFR1.1)
    - AR4.4 **Data Synchronization Mechanism:** Define the architectural approach for synchronizing offline data with the central repository when the user is online.
- **AR5 Offline Support Architecture**
    - AR5.1 **Service Workers:** Utilize service workers for caching application assets and data to enable offline functionality.
    - AR5.2 **Local Storage/IndexedDB:** Specify how browser storage (e.g., IndexedDB) will be used for storing downloaded lexicons and user data for offline access.
- **AR6 Security Architecture**
    - AR6.1 **Authentication and Authorization:** Define the mechanisms for user authentication and how authorization will be handled to protect resources and user data.
    - AR6.2 **Data Security:** Outline measures for securing data both in transit (e.g., HTTPS) and at rest. (Also NFR5.1)
- **AR7 Architectural Patterns**
    - **Microkernel Architecture**
      Adoption of a microkernel architecture for the backend of the Marito project. This architecture will support clean separation between core system       
      functionality and optional features, enabling the team to develop and maintain the platform in a more modular, scalable, and collaborative way.
    - **Core of Architecture**
      A microkernel architecture consists of a minimal, stable core application that handles essential operations, with optional features implemented as 
      independent plugins. These plugins integrate with the core through clearly defined interfaces and can be added, updated, or removed without affecting the main system.
      In Marito’s case, the core will manage fundamental features such as glossary browsing, term searching, and feedback submission, while features like AI-powered translations, text- 
      to-speech, and usage statistics will be developed as modular plugins.
     - **Advantages**
      - Modularity: Each plugin can be developed independently allowing team members to work in parallel.
      - Maintainability: Advanced features can be updated or removed without changing the core.
      - Scalability: New features can be added in future iterations
    - **Proposed File Structure**
        - main.py	(app entry)
        - core/		(Core app logic)
        - plugins/	(Optional feature modules)
                - gamification
                - ai_suggestion
        - shared		(Reusable utilities)
    - **Technical Things**
      - FastAPI will serve as the backend framework.
      - Each plugin will define its own router and can be mounted via the core using route registration logic.
      - Plugins will be self-contained, promoting clean code separation and independent testing.
      - Shared functionality (database access, caching) will reside in a shared/ directory accessible by both core and plugins.
    - **Project Plan**
        - **Initial Development (Core system)**
            - Search
            - Feedback
            - Multi-language interface
            - Export Tools
            - Analytics Dashboard
        - **Plugin System (After Core System)**
            - AI suggestion
            - AI Semantic Search
            - User Submissions
            - User glossary upload
            - User term/edit upload
        - **Optional Enhancements (After Plugin System)**
            - Gamification
            - NLP APIs for external research access

- **AR8 Design Patterns (to be documented in SRS as per Demo 1 Instructions)**
    - AR8.1 **Repository Pattern**
       - Type: Backend
       - Description: Abstracts the data access layer and isolates the domain logic from the persistence logic
       - Use Case: Helps decouple FastAPI endpoints from the database logic

    - AR8.2 **Service Layer Pattern**
       - Type: Backend
       - Description: Encapsulates business logic between controllers (FastAPI routes) and data access
       - Use Case: Enables cleaner FastAPI route functions and reusable services for glossary manipulation

    - AR8.3 **Proxy Pattern**
       - Type: Backend
       - Description: Acts as a placeholder to control access
       - Use Case: Lazy-loading or protecting access to sensitive glossary data
      
    - AR8.4 **Adapter Pattern**
       - Type: Backend
       - Description: Converts interface of one class into another
       - Use Case: Wrapping external AI/NLP services
      
    - AR8.5 **Builder Pattern**
       - Type: Backend
       - Description: Constructs complex objects step-by-step
       - Use Case: Building API responses or assembling glossary entries
      
     - AR8.6 **Observer Pattern**
       - Type: Frontend
       - Description: Allows objects to subscribe to changes
       - Use Case: Real-time UI updates on data sync or new glossary terms
       
     - AR8.7 **Model–View–Controller(MVC)**
       - Type: Frontend
       - Description: Separates data (Model), UI (View), and logic (Controller)
       - Use Case: React naturally supports MV-like separation with state as model, JSX as view, and hooks/handlers as controller logic

     - AR8.8 **Model–View–ViewModel(MVVM)**
       - Type: Frontend
       - Description: Variation of MVC suited for component-based UI frameworks
       - Use Case: Could apply with custom React hooks that manage state and side effects for the View
       
- **AR9 Quality Requirements (to be documented in SRS as per Demo 1 Instructions - these heavily influence architecture)**
    - AR9.1 **Performance:** The architecture must support fast load times, quick search responses, and efficient data handling.
    - AR9.2 **Reliability:** The system, especially data synchronization and offline access, must be reliable.
    - AR9.3 **Scalability:** The architecture must be able to scale to accommodate more users, data, and features over time.
    - AR9.4 **Security:** The architecture must incorporate security best practices to protect data and system integrity.
    - AR9.5 **Maintainability:** The architecture should promote ease of understanding, modification, and extension by current and future developers.
