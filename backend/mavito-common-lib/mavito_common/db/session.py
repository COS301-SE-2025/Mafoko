# app/db/session.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from mavito_common.core.config import settings
import logging

logger = logging.getLogger(__name__)
engine = None
AsyncSessionLocal = None

if settings.SQLALCHEMY_DATABASE_URL:
    try:
        engine = create_async_engine(
            settings.SQLALCHEMY_DATABASE_URL,
            pool_pre_ping=True,
            # echo=True, # Uncomment for SQL query debugging
        )
        AsyncSessionLocal = sessionmaker(
            bind=engine,
            class_=AsyncSession,
            autoflush=False,
            expire_on_commit=False,
            autocommit=False,
        )  # type: ignore[call-overload]
        db_url_display = (
            str(engine.url).split("@")[-1]
            if "@" in str(engine.url)
            else str(engine.url)
        )
        logger.info(
            f"Database engine initialized successfully for: ...@{db_url_display}"
        )
    except Exception as e:
        db_url_display_err = (
            settings.SQLALCHEMY_DATABASE_URL.split("@")[-1]
            if "@" in settings.SQLALCHEMY_DATABASE_URL
            else settings.SQLALCHEMY_DATABASE_URL
        )
        logger.error(
            f"Failed to initialize database engine with URL ...@{db_url_display_err}: {e}",
            exc_info=True,
        )
else:
    logger.critical(
        "SQLALCHEMY_DATABASE_URL is not set after config initialization. Database functionality will be unavailable."
    )


async def get_db():
    if AsyncSessionLocal is None:
        logger.error(
            "AsyncSessionLocal is None. Database might not be configured or initialization failed."
        )
        raise RuntimeError(
            "Database session factory (AsyncSessionLocal) is not available."
        )

    db = AsyncSessionLocal()
    try:
        yield db
    finally:
        await db.close()
