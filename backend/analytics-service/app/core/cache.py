"""Redis caching utilities for analytics."""

from typing import Any, Optional, TypeVar, Callable, Awaitable
import json
import redis.asyncio as redis
from functools import wraps

redis_client = redis.from_url("redis://redis:6379")
T = TypeVar("T")


async def cache_get(key: str) -> Optional[str]:
    """Get a value from cache."""
    return await redis_client.get(key)


async def cache_set(key: str, value: Any, expire: int = 3600) -> None:
    """Set a value in cache with expiration."""
    await redis_client.set(key, json.dumps(value), ex=expire)


def cached(expire: int = 3600):
    """Decorator to cache function results."""

    def decorator(func: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> T:
            # Create cache key from function name and arguments
            key = f"analytics:{func.__name__}:{hash(str(args))}-{hash(str(kwargs))}"

            # Try to get from cache
            cached_value = await cache_get(key)
            if cached_value:
                return json.loads(cached_value)

            # If not in cache, compute and store
            result = await func(*args, **kwargs)
            await cache_set(key, result, expire)
            return result

        return wrapper

    return decorator
