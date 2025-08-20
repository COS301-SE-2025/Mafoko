```mermaid
flowchart TD
 subgraph pwa["PWA (React)"]
        Container["Container Components"]
        Presentational["Presentational Components"]
  end
 subgraph client["Client Layer"]
        pwa
        ServiceWorker["Service Worker"]
        Cache["Cache Storage"]
  end
 subgraph gateway_layer["API Gateway Layer"]
        Gateway["API Gateway"]
  end
 subgraph services["Microservices"]
        Auth["Auth Service"]
        Search["Search Service"]
        Vote["Vote Service"]
        Comment["Comment Service"]
        Workspace["Workspace Service"]
        Analytics["Analytics Service"]
        Glossary["Glossary Service"]
  end
 subgraph data_access["Data Access"]
        AuthRepo["Auth Repository"]
        SearchRepo["Search Repository"]
        VoteRepo["Vote Repository"]
        CommentRepo["Comment Repository"]
        WorkspaceRepo["Workspace Repository"]
        AnalyticsRepo["Analytics Repository"]
        GlossaryRepo["Glossary Repository"]
  end
 subgraph app["Application Layer"]
        services
        data_access
        SharedLib["Shared Library"]
  end
 subgraph data["Data Layer"]
        Database["PostgreSQL Database"]
        Storage["Cloud Storage"]
  end
    Container -- HTTPS API Calls --> Gateway
    ServiceWorker -- Background Sync --> Container
    Container -- Caches data --> Cache
    Gateway -- Routes to --> Auth & Search & Vote & Comment & Workspace & Analytics & Glossary
    Auth -. Uses .-> AuthRepo
    Search -. Uses .-> SearchRepo
    Vote -. Uses .-> VoteRepo
    Comment -. Uses .-> CommentRepo
    Workspace -. Uses .-> WorkspaceRepo
    Analytics -. Uses .-> AnalyticsRepo
    Glossary -. Uses .-> GlossaryRepo
    AuthRepo -- CRUD --> Database
    SearchRepo -- CRUD --> Database
    VoteRepo -- CRUD --> Database
    CommentRepo -- CRUD --> Database
    WorkspaceRepo -- CRUD --> Database
    AnalyticsRepo -- CRUD --> Database
    GlossaryRepo -- CRUD --> Database
    services -- Signed URLs --> Storage
    Container -- Direct upload --> Storage
    services -- Imports --> SharedLib
    style data_access fill:#f3e5f5,stroke:#9c27b0,stroke-width:1px
    style client fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    style gateway_layer fill:#e8f5e8,stroke:#4caf50,stroke-width:2px
    style app fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    style data fill:#fce4ec,stroke:#e91e63,stroke-width:2px
