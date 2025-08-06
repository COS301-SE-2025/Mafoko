from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, distinct, text
from sqlalchemy.orm import selectinload
from typing import Any

from mavito_common.models.term import Term
from mavito_common.db.session import get_db

router = APIRouter()

# Language mappings
LANGUAGE_MAP = {
    "English": "English",
    "Afrikaans": "Afrikaans",
    "Ndebele": "Ndebele",
    "Xhosa": "Xhosa",
    "Zulu": "Zulu",
    "Northern Sotho": "Northern Sotho",
    "Sotho": "Sotho",
    "Tswana": "Tswana",
    "Swazi": "Swazi",
    "Venda": "Venda",
    "Tsonga": "Tsonga",
}


# Helper functions for glossary API
def transform_category_name(category: str, for_display: bool = True) -> str:
    """
    Transform category names between storage format and display format.

    Args:
        category: The category name to transform
        for_display: If True, transforms from storage format (with slashes) to
                    display format (with "or"). If False, does the reverse.

    Returns:
        The transformed category name
    """
    if for_display:
        # Transform from storage format to display format (/ -> or)
        return category.replace("/", " or ").strip()
    else:
        # Transform from display format to storage format (or -> /)
        # Also handle the case where user might input actual slashes
        result = category.replace(" or ", "/").replace(" OR ", "/")
        # Also normalize any remaining slashes with spaces around them
        import re

        result = re.sub(r"\s*/\s*", "/", result)
        return result.strip()


async def get_all_categories(db: AsyncSession) -> List[str]:
    """Get all unique categories/domains from the database."""
    query: Any = select(distinct(Term.domain)).order_by(Term.domain)
    result = await db.execute(query)
    # Transform categories for display
    return [transform_category_name(domain) for domain, in result.all()]


async def get_terms_by_category(
    db: AsyncSession, category: str
) -> List[Dict[str, Any]]:
    """Get all terms for a specific category/domain."""
    # URL-decode the category name to handle special characters like forward slashes
    from urllib.parse import unquote_plus

    # Decode the category properly
    decoded_category = unquote_plus(category)

    # Transform from display format ("or") back to storage format ("/")
    storage_category = transform_category_name(decoded_category, for_display=False)

    # Use ORM with selectinload to fetch translations for each term
    from sqlalchemy.orm import selectinload

    orm_query = (
        select(Term)
        .options(selectinload(Term.translations))
        .where(func.lower(Term.domain) == storage_category.lower())
        .order_by(Term.term)
    )
    result = await db.execute(orm_query)
    orm_terms = result.scalars().all()

    # If no results, fallback to previous SQL approaches for category matching
    if not orm_terms:
        try:
            sql_query = text(
                """
                SELECT id, term, definition, domain, language 
                FROM terms 
                WHERE LOWER(TRIM(domain)) = LOWER(:category)
                ORDER BY term
                """
            )
            result = await db.execute(sql_query, {"category": storage_category})
            rows = result.fetchall()
            if rows:
                # For fallback, fetch translations for each term by ORM
                ids = [row[0] for row in rows]
                fallback_query = (
                    select(Term)
                    .options(selectinload(Term.translations))
                    .where(Term.id.in_(ids))
                )
                fallback_result = await db.execute(fallback_query)
                fallback_terms = fallback_result.scalars().all()
                orm_terms = fallback_terms
        except Exception:
            pass

    # Format and return the results with translations
    results = []
    for term in orm_terms:
        translations = {}
        if hasattr(term, "translations") and term.translations:
            for translation in term.translations:
                translations[translation.language] = translation.term
        results.append(
            {
                "id": str(term.id),
                "term": term.term,
                "definition": term.definition,
                "category": term.domain,
                "language": term.language,
                "translations": translations,
            }
        )
    return results


async def get_term_translations(
    db: AsyncSession, term_id: str
) -> Optional[Dict[str, Any]]:
    """Get all available translations for a specific term."""
    # First try to find by UUID if it's a valid UUID
    try:
        from uuid import UUID

        uuid_obj = UUID(term_id)
        query = (
            select(Term)
            .where(Term.id == uuid_obj)
            .options(selectinload(Term.translations))
        )
    except ValueError:
        # If not a UUID, try to find by term name
        query = (
            select(Term)
            .where(func.lower(Term.term) == term_id.lower())
            .options(selectinload(Term.translations))
        )

    result = await db.execute(query)
    term = result.scalars().first()

    if not term:
        return None

    # Get all translations
    translations = {}
    if term.translations:
        for translation in term.translations:
            translations[translation.language] = translation.term

    return {
        "term": term.term,
        "definition": term.definition,
        "translations": translations,
    }


async def search_terms(db: AsyncSession, query: str) -> List[Dict[str, Any]]:
    """Search for terms across all categories."""
    # Search in both term and definition columns (case-insensitive)
    search_query = (
        select(Term)
        .where(or_(Term.term.ilike(f"%{query}%"), Term.definition.ilike(f"%{query}%")))
        .order_by(Term.term)
    )

    result = await db.execute(search_query)
    terms = result.scalars().all()

    return [
        {
            "id": str(term.id),
            "term": term.term,
            "definition": term.definition,
            "category": term.domain,
            "language": term.language,
        }
        for term in terms
    ]


# ========== Glossary API Endpoints ==========


@router.get("/categories", response_model=List[str])
async def get_categories(db: AsyncSession = Depends(get_db)) -> List[str]:
    """Get all available categories."""
    categories = await get_all_categories(db)
    return categories


@router.get("/categories/stats", response_model=Dict[str, int])
async def get_categories_with_counts(
    db: AsyncSession = Depends(get_db),
) -> Dict[str, int]:
    """Get all categories with their term counts."""
    # Query to get domain and count of terms for each domain
    query = (
        select(Term.domain, func.count(Term.id).label("term_count"))
        .group_by(Term.domain)
        .order_by(Term.domain)
    )

    result = await db.execute(query)
    domain_counts = result.all()

    # Transform to display format and create dictionary
    category_counts = {}
    for domain, count in domain_counts:
        display_category = transform_category_name(domain, for_display=True)
        category_counts[display_category] = count

    return category_counts


@router.get("/categories/{category_name}/terms")
async def get_terms_by_category_api(
    category_name: str, db: AsyncSession = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get all terms for a specific category."""
    terms = await get_terms_by_category(db, category_name)
    if not terms:
        raise HTTPException(
            status_code=404, detail=f"No terms found for category: {category_name}"
        )
    return terms


@router.get("/terms/{term_id}/translations")
async def get_term_translations_api(
    term_id: str, db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """Get all available translations for a specific term."""
    translations = await get_term_translations(db, term_id)
    if not translations:
        raise HTTPException(status_code=404, detail=f"Term not found: {term_id}")
    return translations


@router.get("/search")
async def search_terms_api(
    query: str = Query(..., description="Search query for terms or definitions"),
    db: AsyncSession = Depends(get_db),
) -> List[Dict[str, Any]]:
    """Search for terms across all categories."""
    results = await search_terms(db, query)
    return results


@router.get("/domains", response_model=List[str])
async def get_domains(db: AsyncSession = Depends(get_db)) -> List[str]:
    """Get all available domains (same as categories)."""
    return await get_all_categories(db)


@router.get("/languages", response_model=Dict[str, str])
async def get_available_languages(db: AsyncSession = Depends(get_db)) -> Dict[str, str]:
    """Get all available languages in the glossary."""
    # Query distinct languages from the database
    query: Any = select(distinct(Term.language))
    result = await db.execute(query)
    languages = [lang for lang, in result.all()]

    # Return only the languages that exist in our mapping
    return {lang: lang for lang in languages if lang in LANGUAGE_MAP.values()}


@router.post("/search")
async def advanced_search(
    query: Optional[str] = None,
    domain: Optional[str] = None,
    language: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Advanced search endpoint with filtering by domain and language, and pagination.

    This endpoint can be used for the main glossary view with filtering capabilities.
    """
    # Build the base query
    base_query = select(Term)

    # Apply filters
    if domain:
        # URL-decode the domain name to handle special characters like forward slashes
        from urllib.parse import unquote_plus
        import re
        from sqlalchemy import text

        # Decode the domain properly
        decoded_domain = unquote_plus(domain)

        # Transform from display format ("or") back to storage format ("/")
        storage_domain = transform_category_name(decoded_domain, for_display=False)

        # Check if we can find the exact domain with trailing space
        domain_query = text(
            """
            SELECT DISTINCT domain FROM terms WHERE LOWER(domain) = LOWER(:domain) OR LOWER(domain) = LOWER(:domain_with_space)
        """
        )
        result = await db.execute(
            domain_query,
            {"domain": storage_domain, "domain_with_space": storage_domain + " "},
        )
        exact_domains = [row[0] for row in result.fetchall()]

        if exact_domains:
            domain_conditions = [Term.domain == d for d in exact_domains]
            base_query = base_query.where(or_(*domain_conditions))
        else:
            # Try TRIM approach
            trim_query = text(
                """
                SELECT DISTINCT domain FROM terms WHERE LOWER(TRIM(domain)) = LOWER(:domain)
            """
            )
            result = await db.execute(trim_query, {"domain": storage_domain})
            trim_domains = [row[0] for row in result.fetchall()]

            if trim_domains:
                domain_conditions = [Term.domain == d for d in trim_domains]
                base_query = base_query.where(or_(*domain_conditions))
            else:
                # If still not found, look for similar domains
                first_part = decoded_domain.split("/")[0].strip()
                if len(first_part) > 2:
                    similar_query = text(
                        """
                        SELECT DISTINCT domain FROM terms WHERE LOWER(domain) LIKE '%' || LOWER(:part) || '%'
                    """
                    )
                    result = await db.execute(similar_query, {"part": first_part})
                    similar_domains = [row[0] for row in result.fetchall()]

                    if similar_domains:
                        # Check how many terms each domain has
                        matching_domains: List[tuple[str, int]] = []
                        for d in similar_domains:
                            count_query = text(
                                "SELECT COUNT(*) FROM terms WHERE domain = :domain"
                            )
                            term_count = await db.scalar(count_query, {"domain": d})
                            if term_count:
                                matching_domains.append((d, term_count))

                        if matching_domains:
                            # Sort by term count (most terms first)
                            matching_domains.sort(key=lambda x: x[1], reverse=True)
                            best_domain = matching_domains[0][0]
                            base_query = base_query.where(Term.domain == best_domain)
                        else:
                            # Fall back to direct match (which will probably return no results)
                            base_query = base_query.where(
                                func.lower(Term.domain) == storage_domain.lower()
                            )
                    else:
                        # Fall back to direct match (which will probably return no results)
                        base_query = base_query.where(
                            func.lower(Term.domain) == storage_domain.lower()
                        )

    if language and language.lower() != "all":
        base_query = base_query.where(Term.language == language)

    # Apply text search if query is provided
    if query and query.strip():
        base_query = base_query.where(
            or_(Term.term.ilike(f"%{query}%"), Term.definition.ilike(f"%{query}%"))
        )

    # First, get count for pagination
    count_sql_query = select(func.count()).select_from(base_query.subquery())
    total_results = await db.scalar(count_sql_query) or 0

    # First, get count to check if we found any results
    initial_sql_query = select(func.count()).select_from(base_query.subquery())
    initial_count = await db.scalar(initial_sql_query) or 0

    # If we have a domain filter and no results, try more flexible matching
    if domain and initial_count == 0:
        # Create a new base query without the domain filter
        base_query = select(Term)

        # Apply other filters that might still be present
        if language and language.lower() != "all":
            base_query = base_query.where(Term.language == language)

        if query and query.strip():
            base_query = base_query.where(
                or_(Term.term.ilike(f"%{query}%"), Term.definition.ilike(f"%{query}%"))
            )  # Try with normalized category (removing spaces around slashes)
            normalized_domain = re.sub(r"\s*/\s*", "/", storage_domain)
            base_query = base_query.where(
                func.lower(Term.domain) == normalized_domain.lower()
            )

        # Check if we have results with this approach
        normalized_sql_query = select(func.count()).select_from(base_query.subquery())
        normalized_count = await db.scalar(normalized_sql_query) or 0

        # If still no results, try with partial matching as last resort
        if normalized_count == 0:
            # Start with a fresh base query
            base_query = select(Term)

            # Re-apply other filters
            if language and language.lower() != "all":
                base_query = base_query.where(Term.language == language)

            if query and query.strip():
                base_query = base_query.where(
                    or_(
                        Term.term.ilike(f"%{query}%"),
                        Term.definition.ilike(f"%{query}%"),
                    )
                )

            # Split category by slash and create LIKE conditions
            category_parts = re.split(r"/+", storage_domain)
            if len(category_parts) > 1:
                like_conditions = []
                for part in category_parts:
                    part = part.strip()
                    if len(part) > 2:  # Skip very short parts
                        like_conditions.append(
                            func.lower(Term.domain).like(f"%{part.lower()}%")
                        )

                if like_conditions:
                    # Combine with AND to ensure all parts are present
                    base_query = base_query.where(and_(*like_conditions))

    # Now get the final count for pagination
    final_sql_query = select(func.count()).select_from(base_query.subquery())
    total_results = await db.scalar(final_sql_query) or 0

    # Apply pagination and execute the query
    final_query = base_query.order_by(Term.term).offset((page - 1) * limit).limit(limit)
    result = await db.execute(final_query)
    terms = result.scalars().all()

    # Prepare results in the format expected by the frontend
    results = []
    for term in terms:
        term_data = {
            "id": str(term.id),
            "term": term.term,
            "definition": term.definition,
            "language": term.language,
            "category": term.domain,
        }
        results.append(term_data)

    return {
        "results": results,
        "total": total_results,
        "page": page,
        "limit": limit,
        "pages": (total_results + limit - 1)
        // limit,  # Ceiling division for total pages
    }


@router.post("/translate")
async def translate_terms(
    terms: List[str],
    source_language: str = "English",
    target_languages: Optional[List[str]] = None,
    domain: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Translate a list of terms from source language to specified target languages.
    If target_languages is not provided, translates to all available languages.
    """
    # Find terms with the specified source language
    base_query = select(Term).where(Term.language == source_language)

    # Filter by domain if specified
    if domain:
        # URL-decode the domain name to handle special characters like forward slashes
        from urllib.parse import unquote_plus

        # Decode the domain properly
        decoded_domain = unquote_plus(domain)

        # Transform from display format ("or") back to storage format ("/")
        storage_domain = transform_category_name(decoded_domain, for_display=False)

        # For translation function, we'll use a simpler approach - just case insensitive matching
        base_query = base_query.where(func.lower(Term.domain) == storage_domain.lower())

    # Filter by terms list
    term_filters = [func.lower(Term.term) == term.lower() for term in terms]
    if term_filters:
        base_query = base_query.where(or_(*term_filters))

    # Include translations
    base_query = base_query.options(selectinload(Term.translations))

    # Execute query
    result = await db.execute(base_query)
    source_terms = result.scalars().all()

    # Prepare results
    result_data = []
    for term in source_terms:
        translations = {}

        # Filter translations by target languages if specified
        for translation in term.translations:
            if not target_languages or translation.language in target_languages:
                translations[translation.language] = translation.term

        result_data.append(
            {
                "id": str(term.id),
                "term": term.term,
                "definition": term.definition,
                "source_language": source_language,
                "translations": translations,
            }
        )

    return {"results": result_data}


# Additional glossary functionality
@router.get("/stats")
async def get_glossary_stats(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Get basic statistics about the glossary."""
    # Count total terms
    total_sql = select(func.count()).select_from(Term)
    total_terms = await db.scalar(total_sql)

    # Count unique languages
    langs_sql = select(func.count(distinct(Term.language)))
    languages_count = await db.scalar(langs_sql)

    # Count unique domains/categories
    domains_sql = select(func.count(distinct(Term.domain)))
    categories_count = await db.scalar(domains_sql)

    # Get available languages
    langs_list_sql: Any = select(distinct(Term.language))
    result = await db.execute(langs_list_sql)
    languages = {lang: lang for lang, in result.all()}

    return {
        "total_terms": total_terms or 0,
        "languages_count": languages_count or 0,
        "categories_count": categories_count or 0,
        "languages": languages,
    }


@router.get("/random")
async def get_random_term(
    count: int = 1, db: AsyncSession = Depends(get_db)
) -> List[Dict[str, Any]]:
    """Get a random term or set of terms."""
    # Count total terms
    total_query = select(func.count()).select_from(Term)
    total_terms = await db.scalar(total_query) or 0

    # If there are no terms, return an empty list
    if total_terms == 0:
        return []

    # Get random terms using SQL
    # In PostgreSQL, we can use ORDER BY RANDOM() to get random rows
    query = select(Term).order_by(func.random()).limit(min(count, total_terms))
    result = await db.execute(query)
    terms = result.scalars().all()

    results = []
    for term in terms:
        term_data = {
            "id": str(term.id),
            "term": term.term,
            "definition": term.definition,
            "category": term.domain,
            "language": term.language,
        }
        results.append(term_data)

    return results
