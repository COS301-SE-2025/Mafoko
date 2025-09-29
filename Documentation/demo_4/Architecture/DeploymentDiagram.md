```mermaid
---
config:
  layout: fixed
---
flowchart TD
 subgraph subGraph0["Developer Workstation"]
        GitHubRepo["GitHub Repository"]
        Dev["Developer"]
  end
 subgraph GitHub["GitHub"]
        GHActions["GitHub Actions CI/CD"]
  end
 subgraph subGraph2["Artifact Management"]
        ArtifactRegistry["Artifact Registry"]
  end
 subgraph subGraph3["Compute Services"]
        CR["Cloud Run (Services)"]
        CRJob["Cloud Run Job\n(alembic-migrate)"]
  end
 subgraph subGraph4["Data Services"]
        DB["Cloud SQL\nPostgreSQL"]
        GCS["Cloud Storage"]
  end
 subgraph Services["Services"]
        AuthService["auth-service"]
        SearchService["search-service"]
        VotingService["voting-service"]
        AnalyticsService["analytics-service"]
        LinguistService["linguist-service"]
  end
 subgraph subGraph6["Google Cloud Platform"]
        subGraph2
        subGraph3
        subGraph4
        Services
  end
    Dev -- 1 git push --> GitHubRepo
    GitHubRepo -- 2 Triggers --> GHActions
    GHActions -- "3a. Build & Push Images" --> ArtifactRegistry
    GHActions -- "3b. Deploy Services" --> CR
    GHActions -- "3c. Deploy Job" --> CRJob
    ArtifactRegistry -- "4a. Stores" --> AlembicImage["alembic-service image"]
    ArtifactRegistry -- "4b. Stores" --> ServiceImages["Service images"]
    CR -- 5 Runs --> Services
    CRJob -- 6 Runs --> AlembicImage
    Services -- 7 Connects to --> DB
    CRJob -- 8 Executes migrations --> DB
    LinguistService -- 9 Generates/uses --> GCS
    style GitHubRepo fill:#f96,stroke:#333
    style Dev fill:#f9f,stroke:#333
    style GHActions fill:#f96,stroke:#333
    style ArtifactRegistry fill:#6af,stroke:#333
    style CR fill:#8c8,stroke:#333
    style CRJob fill:#8c8,stroke:#333
    style DB fill:#0aa,stroke:#333
    style GCS fill:#0aa,stroke:#333
    style Services fill:#ddf,stroke:#333
    style AlembicImage fill:#ffd,stroke:#333
