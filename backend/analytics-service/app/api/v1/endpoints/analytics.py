from typing import Dict, Optional, Union, Annotated, Any, List
from fastapi import APIRouter, Depends

# Query
# from typing import Dict, Optional, Union
from fastapi.params import Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import Select, func, distinct, select

# from collections import Counter

from mavito_common.models.term import Term
from mavito_common.db.session import get_db

router = APIRouter()


# Analytics helper functions
async def get_all_terms(db: AsyncSession) -> List[Any]:
    """Get all terms from the database."""
    query = select(Term)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_language_statistics(db: AsyncSession) -> Dict[str, int]:
    """Get language-specific statistics from the database."""
    query = select(Term.language, func.count(Term.id).label("count")).group_by(
        Term.language
    )
    result = await db.execute(query)
    return {lang: count for lang, count in result.all()}


async def get_domain_statistics(
    db: AsyncSession, language: Optional[str] = None
) -> Dict[str, int]:
    """Get domain/category statistics from the database."""
    query = select(Term.domain, func.count(Term.id).label("count"))

    # Apply language filter if provided
    if language:
        query = query.where(func.lower(Term.language) == language.lower())

    query = query.group_by(Term.domain)
    result = await db.execute(query)
    all_rows = result.all()
    if hasattr(all_rows, "__await__"):
        all_rows = await all_rows
    return {domain: count for domain, count in all_rows}


@router.get("/descriptive")
async def get_descriptive_analytics(
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Union[Dict[str, int], Dict[str, float]]]:
    """Get all descriptive analytics (legacy endpoint).
    This endpoint combines all analytics for backward compatibility."""

    # Get individual analytics
    category_counts = await get_category_frequency(None, db)
    language_coverage = await get_language_coverage(db)
    term_lengths = await get_term_length_analysis(db)
    def_lengths = await get_definition_length_analysis(db)
    unique_term_counts = await get_unique_terms_count(db)

    # Combine all analytics
    return {
        "category_frequency": category_counts,
        "language_coverage_percent": language_coverage,
        "average_term_lengths": term_lengths,
        "average_definition_lengths": def_lengths,
        "unique_term_counts": unique_term_counts,
    }


@router.get("/descriptive/category-frequency")
async def get_category_frequency(
    language: Annotated[Optional[str], Query()] = None,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, int]:
    """Get frequency distribution of terms across different categories."""
    return await get_domain_statistics(db, language)


@router.get("/descriptive/language-coverage")
async def get_language_coverage(db: AsyncSession = Depends(get_db)) -> Dict[str, float]:
    """Get coverage percentage for each language (% of non-empty terms)."""
    # Get total terms count
    total_query = select(func.count(Term.id))
    total_result = await db.execute(total_query)
    total_terms = total_result.scalar()

    if total_terms == 0 or total_terms is None:
        return {}

    # Get language statistics
    language_stats = await get_language_statistics(db)

    # Calculate coverage percentages
    language_coverage = {
        lang: round((count / total_terms) * 100, 2)
        for lang, count in language_stats.items()
    }
    return language_coverage


@router.get("/descriptive/term-length")
async def get_term_length_analysis(
    db: AsyncSession = Depends(get_db),
) -> Dict[str, float]:
    """Get average length of terms for each language."""
    query = select(
        Term.language, func.avg(func.length(Term.term)).label("avg_length")
    ).group_by(Term.language)

    result = await db.execute(query)
    term_lengths = {
        lang: round(float(avg_length), 2) if avg_length else 0
        for lang, avg_length in result.all()
    }
    return term_lengths


@router.get("/descriptive/definition-length")
async def get_definition_length_analysis(
    db: AsyncSession = Depends(get_db),
) -> Dict[str, float]:
    """Get average length of definitions for each language."""
    query = select(
        Term.language, func.avg(func.length(Term.definition)).label("avg_length")
    ).group_by(Term.language)

    result = await db.execute(query)
    def_lengths = {
        lang: round(float(avg_length), 2) if avg_length else 0
        for lang, avg_length in result.all()
    }
    return def_lengths


@router.get("/descriptive/unique-terms")
async def get_unique_terms_count(db: AsyncSession = Depends(get_db)) -> Dict[str, int]:
    """Get count of unique terms for each language."""
    query = select(
        Term.language, func.count(distinct(Term.term)).label("unique_count")
    ).group_by(Term.language)

    result = await db.execute(query)
    unique_term_counts = {lang: unique_count for lang, unique_count in result.all()}
    return unique_term_counts


@router.get("/descriptive/terms-by-domain-and-language")
async def get_terms_by_domain_and_language(
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Dict[str, int]]:
    """Get term distribution across domains and languages."""
    query = select(
        Term.domain, Term.language, func.count(Term.id).label("count")
    ).group_by(Term.domain, Term.language)

    result = await db.execute(query)

    # Organize data by domain, then by language
    data: Dict[str, Dict[str, int]] = {}
    for domain, language, count in result.all():
        if domain not in data:
            data[domain] = {}
        data[domain][language] = count

    return data


@router.get("/descriptive/total-statistics")
async def get_total_statistics(
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Union[int, float, None]]:
    """Get overall statistics about the term database."""
    # Total terms
    total_terms_query = select(func.count(Term.id))
    total_terms_result = await db.execute(total_terms_query)
    total_terms = total_terms_result.scalar()

    # Total unique languages
    unique_languages_query = select(func.count(distinct(Term.language)))
    unique_languages_result = await db.execute(unique_languages_query)
    unique_languages = unique_languages_result.scalar()

    # Total unique domains
    unique_domains_query = select(func.count(distinct(Term.domain)))
    unique_domains_result = await db.execute(unique_domains_query)
    unique_domains = unique_domains_result.scalar()

    # Average term length across all terms
    avg_term_length_query = select(func.avg(func.length(Term.term)))
    avg_term_length_result = await db.execute(avg_term_length_query)
    avg_term_length = avg_term_length_result.scalar()

    # Average definition length across all terms
    avg_def_length_query = select(func.avg(func.length(Term.definition)))
    avg_def_length_result = await db.execute(avg_def_length_query)
    avg_def_length = avg_def_length_result.scalar()

    return {
        "total_terms": total_terms or 0,
        "unique_languages": unique_languages or 0,
        "unique_domains": unique_domains or 0,
        "average_term_length": (
            round(float(avg_term_length), 2) if avg_term_length else 0
        ),
        "average_definition_length": (
            round(float(avg_def_length), 2) if avg_def_length else 0
        ),
    }


@router.get("/descriptive/domain-language-matrix")
async def get_domain_language_matrix(
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Union[List[str], Dict[str, Dict[str, int]]]]:
    """Get a matrix showing term availability across domains and languages."""
    # Get all domains and languages
    domains_query: Select = select(distinct(Term.domain)).order_by(Term.domain)
    languages_query: Select = select(distinct(Term.language)).order_by(Term.language)

    domains_result = await db.execute(domains_query)
    languages_result = await db.execute(languages_query)

    domains = [domain for (domain,) in domains_result.all()]
    languages = [lang for (lang,) in languages_result.all()]

    # Get term counts for each domain-language combination
    query = select(
        Term.domain, Term.language, func.count(Term.id).label("count")
    ).group_by(Term.domain, Term.language)

    result = await db.execute(query)

    # Create matrix
    matrix = {}
    for domain in domains:
        matrix[domain] = {lang: 0 for lang in languages}

    for domain, language, count in result.all():
        matrix[domain][language] = count

    return {"domains": domains, "languages": languages, "matrix": matrix}


@router.get("/descriptive/popular-terms")
async def get_popular_terms(
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
    domain: Annotated[Optional[str], Query()] = None,
    language: Annotated[Optional[str], Query()] = None,
    db: AsyncSession = Depends(get_db),
) -> List[Dict[str, Union[str, int]]]:
    """Get the most common terms (by frequency of appearance across languages)."""
    # Base query to count term frequencies
    query = select(Term.term, func.count(Term.id).label("frequency"))

    # Apply filters if provided
    if domain:
        query = query.where(func.lower(Term.domain) == domain.lower())
    if language:
        query = query.where(func.lower(Term.language) == language.lower())

    # Group by term and order by frequency
    query = query.group_by(Term.term).order_by(func.count(Term.id).desc()).limit(limit)

    result = await db.execute(query)

    return [{"term": term, "frequency": frequency} for term, frequency in result.all()]


@router.get("/descriptive/terms-without-translations")
async def get_terms_without_translations(
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Dict[str, List[str]]]:
    """Get terms that don't have translations in other languages."""
    # This is a complex query - we need to find terms that appear in only one language
    subquery = (
        select(Term.term, func.count(distinct(Term.language)).label("language_count"))
        .group_by(Term.term)
        .subquery()
    )

    # Get terms that appear in only one language
    query = (
        select(Term.term, Term.language, Term.domain)
        .join(subquery, Term.term == subquery.c.term)
        .where(subquery.c.language_count == 1)
        .order_by(Term.domain, Term.language, Term.term)
    )

    result = await db.execute(query)

    # Group by domain and language
    missing_translations: Dict[str, Dict[str, list]] = {}
    for term, language, domain in result.all():
        if domain not in missing_translations:
            missing_translations[domain] = {}
        if language not in missing_translations[domain]:
            missing_translations[domain][language] = []
        missing_translations[domain][language].append(term)

    return missing_translations


@router.get("/descriptive/translation-completeness")
async def get_translation_completeness(
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Union[int, None, Dict[str, Dict[str, Union[int, float]]]]]:
    """Get translation completeness statistics per domain."""
    # Get all unique terms and count how many languages each appears in
    query = select(
        Term.domain,
        Term.term,
        func.count(distinct(Term.language)).label("language_count"),
    ).group_by(Term.domain, Term.term)

    result = await db.execute(query)

    # Get total number of languages available
    total_languages_query = select(func.count(distinct(Term.language)))
    total_languages_result = await db.execute(total_languages_query)
    total_languages = total_languages_result.scalar()

    # Calculate completeness by domain
    domain_stats: Dict[str, Dict[str, Union[int, float]]] = {}
    for domain, term, lang_count in result.all():
        if domain not in domain_stats:
            domain_stats[domain] = {
                "total_terms": 0,
                "fully_translated": 0,
                "partial_translations": 0,
                "single_language_only": 0,
            }

        domain_stats[domain]["total_terms"] += 1

        if lang_count == total_languages:
            domain_stats[domain]["fully_translated"] += 1
        elif lang_count > 1:
            domain_stats[domain]["partial_translations"] += 1
        else:
            domain_stats[domain]["single_language_only"] += 1

    # Calculate percentages
    for domain in domain_stats:
        total = domain_stats[domain]["total_terms"]
        domain_stats[domain]["completeness_percentage"] = (
            round((domain_stats[domain]["fully_translated"] / total) * 100, 2)
            if total > 0
            else 0
        )

    return {
        "total_languages_available": total_languages or 0,
        "domain_statistics": domain_stats,
    }


@router.get("/advanced/language-network")
async def get_language_network_legacy(
    db: AsyncSession = Depends(get_db),
    min_connections: Annotated[int, Query(ge=1)] = 5,
) -> Dict[str, List[Dict[str, Union[str, int, float]]]]:
    """Legacy endpoint that redirects to the new optimized implementation."""
    from .language_network import get_language_network

    return await get_language_network(db=db, min_connections=min_connections)


@router.get("/health")
async def health_check() -> Dict[str, str]:
    """Simple health check endpoint to verify the service is running."""
    return {"status": "healthy", "service": "analytics"}


@router.get("/test")
async def test_endpoint() -> Dict[str, Union[str, List[str]]]:
    """Test endpoint that doesn't require database access."""
    return {
        "message": "Analytics service is working!",
        "timestamp": "2025-07-07",
        "endpoints": [
            "/api/v1/analytics/health",
            "/api/v1/analytics/test",
            "/api/v1/analytics/descriptive",
            "/api/v1/analytics/descriptive/category-frequency",
            "/api/v1/analytics/descriptive/language-coverage",
            "/api/v1/analytics/descriptive/term-length",
            "/api/v1/analytics/descriptive/definition-length",
            "/api/v1/analytics/descriptive/unique-terms",
        ],
    }
