"""Language network analytics endpoint with optimization."""

from typing import Dict, List, Optional, Union, Annotated
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, distinct, text
from mavito_common.models.term import Term
from mavito_common.db.session import get_db
from app.core.cache import cached

router = APIRouter()


async def get_language_pairs(
    db: AsyncSession, min_connections: int = 5, limit: int = 100, offset: int = 0
) -> tuple[List[Dict[str, Union[str, int]]], List[Dict[str, Union[str, int, float]]]]:
    """Get language pairs with optimized SQL query."""
    # Get language statistics first
    lang_stats_query = select(
        Term.language,
        func.count(Term.id).label("term_count"),
        func.array_agg(distinct(Term.domain)).label("domains"),
    ).group_by(Term.language)

    lang_stats_result = await db.execute(lang_stats_query)
    lang_stats = {
        lang: {"count": count, "domains": domains}
        for lang, count, domains in lang_stats_result
    }

    # Efficient query for language pairs
    pairs_query = text(
        """
        WITH language_pairs AS (
            SELECT 
                t1.language as lang1,
                t2.language as lang2,
                COUNT(DISTINCT t1.term) as shared_terms
            FROM 
                terms t1
                JOIN terms t2 ON t1.term = t2.term
                AND t1.language < t2.language
            GROUP BY 
                t1.language, t2.language
            HAVING 
                COUNT(DISTINCT t1.term) >= :min_connections
            ORDER BY 
                shared_terms DESC
            LIMIT :limit OFFSET :offset
        )
        SELECT * FROM language_pairs
    """
    )

    result = await db.execute(
        pairs_query,
        {"min_connections": min_connections, "limit": limit, "offset": offset},
    )
    pairs = result.fetchall()

    # Build nodes and links
    # Properly typed dictionaries for nodes and links
    nodes_typed: List[Dict[str, Union[str, int]]] = [
        {
            "id": str(lang),  # Ensure id is always string
            "group": len(stats["domains"]),
            "size": stats["count"],
            "domains": "; ".join(sorted(stats["domains"])),
        }
        for lang, stats in lang_stats.items()
        if any(lang in (p.lang1, p.lang2) for p in pairs)
    ]

    links_typed: List[Dict[str, Union[str, int, float]]] = [
        {
            "source": str(pair.lang1),  # Ensure source is always string
            "target": str(pair.lang2),  # Ensure target is always string
            "value": pair.shared_terms,
            "normalized_strength": float(pair.shared_terms)
            / min(lang_stats[pair.lang1]["count"], lang_stats[pair.lang2]["count"]),
        }
        for pair in pairs
    ]

    return nodes_typed, links_typed


@router.get("/advanced/language-network")
@cached(expire=3600)  # Cache for 1 hour
async def get_language_network(
    db: AsyncSession = Depends(get_db),
    min_connections: Annotated[int, Query(ge=1)] = 5,
    limit: Annotated[int, Query(ge=1, le=1000)] = 100,
    offset: Annotated[int, Query(ge=0)] = 0,
    language_filter: Annotated[Optional[str], Query()] = None,
) -> Dict[
    str,
    Union[List[Dict[str, Union[str, int]]], List[Dict[str, Union[str, int, float]]]],
]:
    """Get network data showing connections between languages based on shared terms.

    Args:
        min_connections: Minimum number of shared terms required for a connection
        limit: Maximum number of connections to return
        offset: Number of connections to skip
        language_filter: Optional filter for specific language
    """
    nodes, links = await get_language_pairs(db, min_connections, limit, offset)

    # Apply language filter if specified
    if language_filter:
        filtered_nodes = [
            node for node in nodes if str(node["id"]).lower() == language_filter.lower()
        ]
        if filtered_nodes:
            filtered_links = [
                link
                for link in links
                if (
                    str(link["source"]).lower() == language_filter.lower()
                    or str(link["target"]).lower() == language_filter.lower()
                )
            ]
            # Include connected nodes
            connected_langs = {language_filter.lower()}
            for link in filtered_links:
                connected_langs.add(str(link["source"]).lower())
                connected_langs.add(str(link["target"]).lower())
            nodes = [
                node for node in nodes if str(node["id"]).lower() in connected_langs
            ]
            links = filtered_links

    return {"nodes": nodes, "links": links}
