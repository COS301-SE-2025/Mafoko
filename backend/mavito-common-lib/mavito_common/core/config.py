# In mavito-common-lib/core/config.py

import os  # noqa F401
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv
from typing import Optional, List
from pydantic import computed_field  # Import the new decorator
import logging

logger = logging.getLogger(__name__)
load_dotenv()


class Settings(BaseSettings):
    PROJECT_NAME: str = "Mavito API Default"
    API_V1_STR: str = "/api/v1"

    SECRET_KEY: str = "!!!CONFIG_ERROR_SECRET_KEY_NOT_SET!!!"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    # --- Base Database Connection Fields ---
    # These are loaded directly from the environment by Pydantic
    DB_USER: Optional[str] = None
    DB_PASSWORD: Optional[str] = None
    DB_NAME: Optional[str] = None
    DB_HOST: Optional[str] = None
    DB_PORT: Optional[str] = None
    INSTANCE_CONNECTION_NAME: Optional[str] = None

    # --- Base CORS Settings ---
    BACKEND_CORS_ORIGINS: str = ""

    # --- Computed Fields ---
    # These fields are derived from the base settings above.

    @property
    @computed_field
    def SQLALCHEMY_DATABASE_URL(self) -> str:
        """
        Constructs the database URL from other settings.
        This property is computed on-demand.
        """
        if self.DB_USER and self.DB_PASSWORD and self.DB_NAME:
            if self.INSTANCE_CONNECTION_NAME:
                # Cloud SQL Connection
                return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@/{self.DB_NAME}?host=/cloudsql/{self.INSTANCE_CONNECTION_NAME}"
            elif self.DB_HOST and self.DB_PORT:
                # Local Docker/TCP Connection
                return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

        # If no valid URL could be built, raise an error to fail fast
        raise ValueError(
            "Database configuration is invalid. Could not determine SQLALCHEMY_DATABASE_URL."
        )

    @property
    @computed_field
    def BACKEND_CORS_ORIGINS_LIST(self) -> List[str]:
        """
        Parses the comma-separated string of CORS origins into a list.
        """
        if self.BACKEND_CORS_ORIGINS:
            return [
                origin.strip()
                for origin in self.BACKEND_CORS_ORIGINS.split(",")
                if origin.strip()
            ]
        return []

    model_config = SettingsConfigDict(
        case_sensitive=True, env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


# Create the global settings instance
settings = Settings()
