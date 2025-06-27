from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, distinct
from sqlalchemy.orm import selectinload

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
async def get_all_categories(db: AsyncSession):
    """Get all unique categories/domains from the database."""
    query = select(distinct(Term.domain)).order_by(Term.domain)
    result = await db.execute(query)
    return [domain for domain, in result.all()]


async def get_terms_by_category(db: AsyncSession, category: str):
    """Get all terms for a specific category/domain."""
    query = (
        select(Term)
        .where(func.lower(Term.domain) == category.lower())
        .order_by(Term.term)
    )
    result = await db.execute(query)
    terms = result.scalars().all()

    return [
        {
            "id": str(term.id),
            "term": term.term,
            "definition": term.definition,
            "category": term.domain,
        }
        for term in terms
    ]


async def get_term_translations(db: AsyncSession, term_id: str):
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


async def search_terms(db: AsyncSession, query: str):
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
        }
        for term in terms
    ]


# ========== Glossary API Endpoints ==========


@router.get("/categories", response_model=List[str])
async def get_categories(db: AsyncSession = Depends(get_db)):
    """Get all available categories."""
    categories = await get_all_categories(db)
    return categories


@router.get("/categories/{category_name}/terms")
async def get_terms_by_category_api(
    category_name: str, db: AsyncSession = Depends(get_db)
):
    """Get all terms for a specific category."""
    terms = await get_terms_by_category(db, category_name)
    if not terms:
        raise HTTPException(
            status_code=404, detail=f"No terms found for category: {category_name}"
        )
    return terms


@router.get("/terms/{term_id}/translations")
async def get_term_translations_api(term_id: str, db: AsyncSession = Depends(get_db)):
    """Get all available translations for a specific term."""
    translations = await get_term_translations(db, term_id)
    if not translations:
        raise HTTPException(status_code=404, detail=f"Term not found: {term_id}")
    return translations


@router.get("/search")
async def search_terms_api(
    query: str = Query(..., description="Search query for terms or definitions"),
    db: AsyncSession = Depends(get_db),
):
    """Search for terms across all categories."""
    results = await search_terms(db, query)
    return results


@router.get("/domains", response_model=List[str])
async def get_domains(db: AsyncSession = Depends(get_db)):
    """Get all available domains (same as categories)."""
    return await get_all_categories(db)


@router.get("/languages", response_model=Dict[str, str])
async def get_available_languages(db: AsyncSession = Depends(get_db)):
    """Get all available languages in the glossary."""
    # Query distinct languages from the database
    query = select(distinct(Term.language))
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
):
    """
    Advanced search endpoint with filtering by domain and language, and pagination.

    This endpoint can be used for the main glossary view with filtering capabilities.
    """
    # Build the base query
    base_query = select(Term)

    # Apply filters
    if domain:
        base_query = base_query.where(func.lower(Term.domain) == domain.lower())

    if language and language.lower() != "all":
        base_query = base_query.where(Term.language == language)

    # Apply text search if query is provided
    if query and query.strip():
        base_query = base_query.where(
            or_(Term.term.ilike(f"%{query}%"), Term.definition.ilike(f"%{query}%"))
        )

    # First, get count for pagination
    count_query = select(func.count()).select_from(base_query.subquery())
    total_results = await db.scalar(count_query) or 0

    # Apply pagination and execute
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
):
    """
    Translate a list of terms from source language to specified target languages.
    If target_languages is not provided, translates to all available languages.
    """
    # Find terms with the specified source language
    base_query = select(Term).where(Term.language == source_language)

    # Filter by domain if specified
    if domain:
        base_query = base_query.where(func.lower(Term.domain) == domain.lower())

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
async def get_glossary_stats(db: AsyncSession = Depends(get_db)):
    """Get basic statistics about the glossary."""
    # Count total terms
    total_query = select(func.count()).select_from(Term)
    total_terms = await db.scalar(total_query)

    # Count unique languages
    langs_query = select(func.count(distinct(Term.language)))
    languages_count = await db.scalar(langs_query)

    # Count unique domains/categories
    domains_query = select(func.count(distinct(Term.domain)))
    categories_count = await db.scalar(domains_query)

    # Get available languages
    langs_list_query = select(distinct(Term.language))
    result = await db.execute(langs_list_query)
    languages = {lang: lang for lang, in result.all()}

    return {
        "total_terms": total_terms or 0,
        "languages_count": languages_count or 0,
        "categories_count": categories_count or 0,
        "languages": languages,
    }


@router.get("/random")
async def get_random_term(count: int = 1, db: AsyncSession = Depends(get_db)):
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
        }
        results.append(term_data)

    return results
