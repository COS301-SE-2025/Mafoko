# app/core/config.py
import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv
from typing import Optional, List  # Keep List for the final type
import logging

logger = logging.getLogger(__name__)
load_dotenv()


class Settings(BaseSettings):
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "Mavito API Default")
    API_V1_STR: str = "/api/v1"

    SECRET_KEY: str = os.getenv("SECRET_KEY", "!!!CONFIG_ERROR_SECRET_KEY_NOT_SET!!!")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 7))
    )

    DB_USER: Optional[str] = os.getenv("DB_USER")
    DB_PASSWORD: Optional[str] = os.getenv("DB_PASSWORD")
    DB_NAME: Optional[str] = os.getenv("DB_NAME")
    DB_HOST: Optional[str] = os.getenv("DB_HOST")
    DB_PORT: Optional[str] = os.getenv("DB_PORT")
    INSTANCE_CONNECTION_NAME: Optional[str] = os.getenv("INSTANCE_CONNECTION_NAME")

    SQLALCHEMY_DATABASE_URL: str

    GITHUB_ORGANIZATION: str = os.getenv("GITHUB_ORGANIZATION", "cos301-se-2025")

    RAW_BACKEND_CORS_ORIGINS: Optional[str] = os.getenv(
        "BACKEND_CORS_ORIGINS", ""
    )  # Default to empty string if not present

    BACKEND_CORS_ORIGINS_LIST: List[str] = []

    def __init__(self, **values):
        super().__init__(**values)  # Pydantic-Settings initializes fields from .env

        db_url: Optional[str] = None  # A temporary variable to hold the constructed URL

        if self.SECRET_KEY == "!!!CONFIG_ERROR_SECRET_KEY_NOT_SET!!!":
            logger.critical(
                "CRITICAL: SECRET_KEY is not set. Please set it in your .env file."
            )

        if self.RAW_BACKEND_CORS_ORIGINS:
            self.BACKEND_CORS_ORIGINS_LIST = [
                origin.strip()
                for origin in self.RAW_BACKEND_CORS_ORIGINS.split(",")
                if origin.strip()
            ]

        # Construct SQLALCHEMY_DATABASE_URL
        if self.DB_USER and self.DB_PASSWORD and self.DB_NAME:
            if self.INSTANCE_CONNECTION_NAME:
                # Cloud SQL Connection
                db_url = f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@/{self.DB_NAME}?host=/cloudsql/{self.INSTANCE_CONNECTION_NAME}"
                logger.info("Configured for Cloud SQL connection.")
            elif self.DB_HOST and self.DB_PORT:
                # Local Docker/TCP Connection
                db_url = f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
                logger.info("Configured for PostgreSQL TCP connection.")

        # If after all checks, db_url is still not set, raise an error.
        if not db_url:
            logger.critical(
                "DATABASE NOT CONFIGURED. Please set either INSTANCE_CONNECTION_NAME (for Cloud SQL) or DB_HOST/DB_PORT (for local Docker) in your environment."
            )
            raise ValueError("Database configuration is incomplete or invalid.")

        # Set the final, validated URL.
        self.SQLALCHEMY_DATABASE_URL = db_url

    def _use_sqlite_fallback(self):
        self.SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///./local_mavito_fallback.db"
        logger.warning(
            f"Falling back to local SQLite for development: {self.SQLALCHEMY_DATABASE_URL}. "
            "This is NOT recommended for production or shared development targeting Cloud SQL."
        )

    model_config = SettingsConfigDict(
        case_sensitive=True, env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


settings = Settings()
