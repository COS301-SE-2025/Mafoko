# In mavito-common-lib/core/config.py

import os  # noqa F401
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv
from typing import Optional, List, Any, Dict
from pydantic import model_validator
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
    DB_USER: Optional[str] = None
    DB_PASSWORD: Optional[str] = None
    DB_NAME: Optional[str] = None
    DB_HOST: Optional[str] = None
    DB_PORT: Optional[str] = None
    INSTANCE_CONNECTION_NAME: Optional[str] = None
    GCS_BUCKET_NAME: str = "your-bucket-name-is-not-set"
    # --- Base CORS Settings ---
    BACKEND_CORS_ORIGINS: str = ""
    BACKEND_CORS_ORIGINS_LIST: List[str] = []

    # Give the field a placeholder default to satisfy mypy during static analysis.
    # The validator below will ALWAYS overwrite this at runtime.
    SQLALCHEMY_DATABASE_URL: str = "postgresql+asyncpg://user:pass@host/db"

    @model_validator(mode="before")
    def process_settings(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Builds computed fields like the database URL and CORS origins list.
        """
        # --- Build Database URL ---
        db_url: Optional[str] = None
        db_user, db_password, db_name = (
            data.get("DB_USER"),
            data.get("DB_PASSWORD"),
            data.get("DB_NAME"),
        )

        if db_user and db_password and db_name:
            instance_connection_name = data.get("INSTANCE_CONNECTION_NAME")
            db_host = data.get("DB_HOST")
            db_port = data.get("DB_PORT")

            if instance_connection_name:
                db_url = f"postgresql+asyncpg://{db_user}:{db_password}@/{db_name}?host=/cloudsql/{instance_connection_name}"
            elif db_host and db_port:
                db_url = f"postgresql+asyncpg://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"

        if not db_url:
            raise ValueError(
                "Database configuration is invalid. Could not determine SQLALCHEMY_DATABASE_URL."
            )

        data["SQLALCHEMY_DATABASE_URL"] = db_url

        # --- Parse CORS origins ---
        raw_origins = data.get("BACKEND_CORS_ORIGINS", "")
        if raw_origins:
            data["BACKEND_CORS_ORIGINS_LIST"] = [
                origin.strip() for origin in raw_origins.split(",") if origin.strip()
            ]
        else:
            data["BACKEND_CORS_ORIGINS_LIST"] = []

        return data

    model_config = SettingsConfigDict(
        case_sensitive=True, env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


# Create the global settings instance
settings = Settings()
