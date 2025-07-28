# Mavito: A PWA for Multilingual Lexicons and Glossaries

The Mavito project provides a platform for language enthusiasts, NLP researchers, and linguists to access, browse, and contribute to multilingual glossaries, dictionaries, and terminology banks. This repository contains the backend for the Mavito application, architected as a set of independent microservices.

## Architecture Overview

This project follows a microservices architecture to ensure scalability, separation of concerns, and independent deployments. The system is composed of several key components:

- **`auth-service`**: Handles all user registration, authentication (login), and profile management.
- **`search-service`**: Responsible for all terminology search queries and providing autocomplete suggestions.
- **`analytics-service`**: Provides descriptive statistical analysis of the terminology dataset.
- **`mavito-common-lib`**: A shared internal Python library containing common code for database connections, security, configuration, and core data models to ensure consistency across all services.
- **API Gateway**: A single, public-facing entry point that receives all client requests and routes them to the appropriate microservice.
- **PostgreSQL Database**: A central database hosted on Google Cloud SQL that stores all application data, such as users and language information.

## Tech Stack

- **Backend**: Python 3.9+ with FastAPI & Uvicorn
- **Database**: PostgreSQL with SQLAlchemy (Asyncio)
- **Containerization**: Docker & Docker Compose
- **Cloud Platform**: Google Cloud Platform (GCP)
- **Core GCP Services**:
  - Cloud SQL (for PostgreSQL)
  - Cloud Run (for hosting services)
  - Artifact Registry (for Docker images & Python packages)
  - API Gateway
- **Data Analysis**: Pandas
- **NLP**: spaCy

## Project Structure

The project is organized into a monorepo containing each microservice and the shared library.

📁 mavito-project/
│
└── 📁 backend/
│
├── 📄 docker-compose.yml # Manages all services for local development
│
├── 📁 mavito-common-lib/ # The shared, installable Python library
│ ├── 📁 mavito_common/
│ └── pyproject.toml
│
├── 📁 auth-service/ # Handles user authentication
│ ├── 📁 app/
│ ├── 📄 Dockerfile
│ └── 📄 requirements.txt
│
├── 📁 search-service/ # Handles search and suggestions
│ ├── 📁 app/
│ ├── 📁 Mock_Data/
│ ├── 📄 Dockerfile
│ └── 📄 requirements.txt
│
└── 📁 analytics-service/ # Handles data statistics
├── 📁 app/
├── 📁 Mock_Data/
├── 📄 Dockerfile
└── 📄 requirements.txt

## Local Development Setup

To run the entire microservices stack on your local machine, follow these steps.

1.  **Prerequisites**:
    - Docker and Docker Compose must be installed and running.
    - You have cloned this repository.

2.  **Navigate to the Backend Directory**:

    ```bash
    cd path/to/mavito-project/backend
    ```

3.  **Create the Environment File**:
    Create a file named `.env` inside the `backend` directory. This file provides local configuration for the Docker Compose setup. It should contain the following:

    ```env
    # .env for LOCAL Docker Compose development

    # These credentials MUST match the 'environment' section of the 'db' service in docker-compose.yml
    DB_USER="mavito_dev_user"
    DB_PASSWORD="mavito_dev_password"
    DB_NAME="mavito_local_dev_db"

    # Your application's secret key for signing JWTs
    SECRET_KEY="some-long-random-secret-key-that-is-not-this"
    ```

4.  **Build and Run the Services**:
    Run the following command from the `backend` directory:

    ```bash
    docker-compose up --build
    ```

    This command will build the Docker image for each service and start all containers. The `--build` flag is only necessary the first time or after you make changes to a service's code or dependencies.

5.  **Accessing the Services**:
    Once running, the services will be accessible on your local machine at the following addresses:
    - **Auth Service**: `http://localhost:8001`
    - **Search Service**: `http://localhost:8002`
    - **Analytics Service**: `http://localhost:8003`

    You can now use a tool like Postman or Insomnia to interact with each service's API.

## Cloud Deployment Workflow

The high-level workflow for deploying this application to Google Cloud is as follows:

1.  **Publish Shared Library**: Build and publish the `mavito-common-lib` as a private Python package to Google Artifact Registry.
2.  **Build & Push Service Images**: For each microservice, build its Docker image and push it to Google Artifact Registry.
3.  **Deploy to Cloud Run**: For each microservice, create a dedicated Cloud Run service, pointing it to the correct Docker image and configuring its specific environment variables and secrets (including Cloud SQL connection details).
4.  **Configure API Gateway**: Create and configure an API Gateway to act as the single public entry point. Define routing rules to forward requests to the appropriate internal Cloud Run service based on the URL path.

## API Endpoints

The following is a summary of the main available endpoints.

| Service       | Method | Path                            | Description                                               |
| :------------ | :----- | :------------------------------ | :-------------------------------------------------------- |
| **Auth**      | `POST` | `/api/v1/auth/register`         | Create a new user account.                                |
| **Auth**      | `POST` | `/api/v1/auth/login`            | Authenticate a user and receive a JWT.                    |
| **Auth**      | `GET`  | `/api/v1/auth/me`               | Get the profile of the currently logged-in user.          |
| **Search**    | `GET`  | `/api/v1/search/`               | Search for terms with filters and pagination.             |
| **Search**    | `GET`  | `/api/v1/suggest/`              | Get autocomplete suggestions for a search query.          |
| **Analytics** | `GET`  | `/api/v1/analytics/descriptive` | Get descriptive statistics about the terminology dataset. |
