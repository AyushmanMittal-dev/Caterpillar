"""
In-Memory & Disk-Backed Caching Layer for Caterpillar Microservices.
Provides TTL caching for ETA pre-task estimates, telemetry responses, and simulation queries with fallback recovery.
"""

import time
import hashlib
import json
from typing import Any, Optional, Dict, Tuple

class LocalCacheService:
    def __init__(self, default_ttl_seconds: int = 300):
        self._cache: Dict[str, Tuple[Any, float]] = {}
        self.default_ttl = default_ttl_seconds
        self.hits = 0
        self.misses = 0

    @staticmethod
    def generate_key(prefix: str, payload: Any) -> str:
        """Generates a deterministic MD5 hash key for any JSON-serializable request dictionary."""
        if isinstance(payload, dict):
            serialized = json.dumps(payload, sort_keys=True, default=str)
        else:
            serialized = str(payload)
        key_hash = hashlib.md5(serialized.encode("utf-8")).hexdigest()
        return f"{prefix}:{key_hash}"

    def get(self, key: str) -> Tuple[Optional[Any], bool]:
        """
        Retrieves an item from cache.
        Returns (data, is_hit).
        If item is expired or missing, returns (None, False).
        """
        if key in self._cache:
            data, expiry = self._cache[key]
            if time.time() < expiry:
                self.hits += 1
                return data, True
            else:
                # Expired - delete
                del self._cache[key]

        self.misses += 1
        return None, False

    def get_stale_fallback(self, key: str) -> Optional[Any]:
        """
        Fallback retriever: returns cached value even if expired (useful during backend/ML service failures).
        """
        if key in self._cache:
            data, _ = self._cache[key]
            return data
        return None

    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        """Stores a value in cache with specified or default TTL."""
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl
        expiry = time.time() + ttl
        self._cache[key] = (value, expiry)

    def clear(self) -> None:
        """Clears all cached entries."""
        self._cache.clear()
        self.hits = 0
        self.misses = 0

    def get_stats(self) -> Dict[str, Any]:
        """Returns cache performance statistics."""
        total = self.hits + self.misses
        hit_rate = round((self.hits / total) * 100, 1) if total > 0 else 0.0
        return {
            "total_cached_items": len(self._cache),
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate_pct": hit_rate
        }

# Global Singleton Instance for Caching
cache_service = LocalCacheService(default_ttl_seconds=600)
