import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import pytest
from unittest.mock import AsyncMock, MagicMock
from api.v1.endpoints import analytics


@pytest.mark.asyncio
async def test_get_domain_statistics_returns_expected_dict():
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.all.return_value = [
        ("Agriculture", 5),
        ("Education", 3),
        ("Technology", 2),
    ]
    mock_db.execute.return_value = mock_result
    result = await analytics.get_domain_statistics(mock_db)
    assert result == {"Agriculture": 5, "Education": 3, "Technology": 2}


@pytest.mark.asyncio
async def test_get_language_statistics_returns_expected_dict():
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.all.return_value = [
        ("english", 10),
        ("afrikaans", 8),
        ("zulu", 6),
    ]
    mock_db.execute.return_value = mock_result
    result = await analytics.get_language_statistics(mock_db)
    assert result == {"english": 10, "afrikaans": 8, "zulu": 6}


@pytest.mark.asyncio
async def test_get_all_terms_returns_list():
    mock_db = AsyncMock()
    mock_scalars = MagicMock()
    mock_scalars.all.return_value = ["term1", "term2"]
    mock_result = MagicMock()
    mock_result.scalars.return_value = mock_scalars
    mock_db.execute.return_value = mock_result
    result = await analytics.get_all_terms(mock_db)
    assert result == ["term1", "term2"]


@pytest.mark.asyncio
async def test_get_language_coverage_handles_zero_terms():
    mock_db = AsyncMock()
    # total_terms = 0
    mock_total_result = MagicMock()
    mock_total_result.scalar.return_value = 0
    mock_db.execute.side_effect = [mock_total_result]
    result = await analytics.get_language_coverage(mock_db)
    assert result == {}


@pytest.mark.asyncio
async def test_get_language_coverage_computes_percentages():
    mock_db = AsyncMock()
    # total_terms = 10
    mock_total_result = MagicMock()
    mock_total_result.scalar.return_value = 10

    # language_stats = {"english": 7, "afrikaans": 3}
    async def fake_get_language_statistics(db):
        return {"english": 7, "afrikaans": 3}

    mock_db.execute.side_effect = [mock_total_result]
    # Patch get_language_statistics
    orig = analytics.get_language_statistics
    analytics.get_language_statistics = fake_get_language_statistics
    result = await analytics.get_language_coverage(mock_db)
    assert result == {"english": 70.0, "afrikaans": 30.0}
    analytics.get_language_statistics = orig


@pytest.mark.asyncio
async def test_get_term_length_analysis_returns_expected():
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.all.return_value = [
        ("english", 4.5),
        ("afrikaans", 5.2),
    ]
    mock_db.execute.return_value = mock_result
    result = await analytics.get_term_length_analysis(mock_db)
    assert result == {"english": 4.5, "afrikaans": 5.2}


@pytest.mark.asyncio
async def test_get_definition_length_analysis_returns_expected():
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.all.return_value = [
        ("english", 12.0),
        ("afrikaans", 10.5),
    ]
    mock_db.execute.return_value = mock_result
    result = await analytics.get_definition_length_analysis(mock_db)
    assert result == {"english": 12.0, "afrikaans": 10.5}


@pytest.mark.asyncio
async def test_get_unique_terms_count_returns_expected():
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.all.return_value = [
        ("english", 7),
        ("afrikaans", 3),
    ]
    mock_db.execute.return_value = mock_result
    result = await analytics.get_unique_terms_count(mock_db)
    assert result == {"english": 7, "afrikaans": 3}


@pytest.mark.asyncio
async def test_get_terms_by_domain_and_language_returns_expected():
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.all.return_value = [
        ("Agriculture", "english", 5),
        ("Agriculture", "afrikaans", 3),
        ("Education", "english", 2),
    ]
    mock_db.execute.return_value = mock_result
    result = await analytics.get_terms_by_domain_and_language(mock_db)
    assert result == {
        "Agriculture": {"english": 5, "afrikaans": 3},
        "Education": {"english": 2},
    }


@pytest.mark.asyncio
async def test_get_total_statistics_returns_expected():
    mock_db = AsyncMock()
    # total_terms, unique_languages, unique_domains, avg_term_length, avg_def_length
    mock_total_terms = MagicMock()
    mock_total_terms.scalar.return_value = 10
    mock_unique_langs = MagicMock()
    mock_unique_langs.scalar.return_value = 2
    mock_unique_domains = MagicMock()
    mock_unique_domains.scalar.return_value = 3
    mock_avg_term_length = MagicMock()
    mock_avg_term_length.scalar.return_value = 4.5
    mock_avg_def_length = MagicMock()
    mock_avg_def_length.scalar.return_value = 12.0
    mock_db.execute.side_effect = [
        mock_total_terms,
        mock_unique_langs,
        mock_unique_domains,
        mock_avg_term_length,
        mock_avg_def_length,
    ]
    result = await analytics.get_total_statistics(mock_db)
    assert result == {
        "total_terms": 10,
        "unique_languages": 2,
        "unique_domains": 3,
        "average_term_length": 4.5,
        "average_definition_length": 12.0,
    }


@pytest.mark.asyncio
async def test_get_domain_language_matrix_returns_expected():
    mock_db = AsyncMock()
    # domains_result, languages_result, result
    mock_domains_result = MagicMock()
    mock_domains_result.all.return_value = [("Agriculture",), ("Education",)]
    mock_languages_result = MagicMock()
    mock_languages_result.all.return_value = [("english",), ("afrikaans",)]
    mock_result = MagicMock()
    mock_result.all.return_value = [
        ("Agriculture", "english", 5),
        ("Agriculture", "afrikaans", 3),
        ("Education", "english", 2),
    ]
    mock_db.execute.side_effect = [
        mock_domains_result,
        mock_languages_result,
        mock_result,
    ]
    result = await analytics.get_domain_language_matrix(mock_db)
    assert result == {
        "domains": ["Agriculture", "Education"],
        "languages": ["english", "afrikaans"],
        "matrix": {
            "Agriculture": {"english": 5, "afrikaans": 3},
            "Education": {"english": 2, "afrikaans": 0},
        },
    }


@pytest.mark.asyncio
async def test_get_popular_terms_returns_expected():
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.all.return_value = [
        ("Farm", 5),
        ("School", 3),
    ]
    mock_db.execute.return_value = mock_result
    result = await analytics.get_popular_terms(db=mock_db)
    assert result == [
        {"term": "Farm", "frequency": 5},
        {"term": "School", "frequency": 3},
    ]


@pytest.mark.asyncio
async def test_get_terms_without_translations_returns_expected():
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.all.return_value = [
        ("Farm", "english", "Agriculture"),
        ("Plaas", "afrikaans", "Agriculture"),
        ("School", "english", "Education"),
    ]
    mock_db.execute.return_value = mock_result
    result = await analytics.get_terms_without_translations(mock_db)
    assert result == {
        "Agriculture": {"english": ["Farm"], "afrikaans": ["Plaas"]},
        "Education": {"english": ["School"]},
    }


@pytest.mark.asyncio
async def test_get_translation_completeness_returns_expected():
    mock_db = AsyncMock()
    # result for main query
    mock_result = MagicMock()
    mock_result.all.return_value = [
        ("Agriculture", "Farm", 2),
        ("Agriculture", "Plaas", 1),
        ("Education", "School", 2),
    ]
    # result for total_languages_query
    mock_total_languages_result = MagicMock()
    mock_total_languages_result.scalar.return_value = 2
    mock_db.execute.side_effect = [mock_result, mock_total_languages_result]
    result = await analytics.get_translation_completeness(mock_db)
    assert result["total_languages_available"] == 2
    assert "domain_statistics" in result
    assert result["domain_statistics"]["Agriculture"]["total_terms"] == 2
    assert result["domain_statistics"]["Education"]["fully_translated"] == 1


@pytest.mark.asyncio
async def test_get_domain_statistics_with_awaitable_result():
    """Test get_domain_statistics when result.all() returns an awaitable object."""
    mock_db = AsyncMock()
    mock_result = MagicMock()

    # Create a mock awaitable object
    async def mock_awaitable():
        return [("Agriculture", 5), ("Education", 3)]

    # Make all() return an awaitable
    mock_result.all.return_value = mock_awaitable()
    mock_db.execute.return_value = mock_result

    result = await analytics.get_domain_statistics(mock_db)
    assert result == {"Agriculture": 5, "Education": 3}


@pytest.mark.asyncio
async def test_get_descriptive_analytics_endpoint():
    """Test the main descriptive analytics endpoint that combines all analytics."""
    mock_db = AsyncMock()

    # Mock all the individual analytics functions
    orig_get_category_frequency = analytics.get_category_frequency
    orig_get_language_coverage = analytics.get_language_coverage
    orig_get_term_length_analysis = analytics.get_term_length_analysis
    orig_get_definition_length_analysis = analytics.get_definition_length_analysis
    orig_get_unique_terms_count = analytics.get_unique_terms_count

    async def mock_category_frequency(language, db):
        return {"Agriculture": 5}

    async def mock_language_coverage(db):
        return {"english": 80.0}

    async def mock_term_length(db):
        return {"english": 4.5}

    async def mock_def_length(db):
        return {"english": 12.0}

    async def mock_unique_count(db):
        return {"english": 10}

    analytics.get_category_frequency = mock_category_frequency
    analytics.get_language_coverage = mock_language_coverage
    analytics.get_term_length_analysis = mock_term_length
    analytics.get_definition_length_analysis = mock_def_length
    analytics.get_unique_terms_count = mock_unique_count

    result = await analytics.get_descriptive_analytics(mock_db)

    assert result == {
        "category_frequency": {"Agriculture": 5},
        "language_coverage_percent": {"english": 80.0},
        "average_term_lengths": {"english": 4.5},
        "average_definition_lengths": {"english": 12.0},
        "unique_term_counts": {"english": 10},
    }

    # Restore original functions
    analytics.get_category_frequency = orig_get_category_frequency
    analytics.get_language_coverage = orig_get_language_coverage
    analytics.get_term_length_analysis = orig_get_term_length_analysis
    analytics.get_definition_length_analysis = orig_get_definition_length_analysis
    analytics.get_unique_terms_count = orig_get_unique_terms_count


@pytest.mark.asyncio
async def test_get_category_frequency_endpoint():
    """Test the category frequency endpoint wrapper."""
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.all.return_value = [("Agriculture", 5), ("Education", 3)]
    mock_db.execute.return_value = mock_result

    result = await analytics.get_category_frequency(language=None, db=mock_db)
    assert result == {"Agriculture": 5, "Education": 3}


@pytest.mark.asyncio
async def test_get_popular_terms_with_domain_filter():
    """Test popular terms endpoint with domain filter."""
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.all.return_value = [("Farm", 5), ("Crop", 3)]
    mock_db.execute.return_value = mock_result

    result = await analytics.get_popular_terms(db=mock_db, domain="Agriculture")
    assert result == [
        {"term": "Farm", "frequency": 5},
        {"term": "Crop", "frequency": 3},
    ]


@pytest.mark.asyncio
async def test_get_popular_terms_with_language_filter():
    """Test popular terms endpoint with language filter."""
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.all.return_value = [("School", 4), ("Teacher", 2)]
    mock_db.execute.return_value = mock_result

    result = await analytics.get_popular_terms(db=mock_db, language="english")
    assert result == [
        {"term": "School", "frequency": 4},
        {"term": "Teacher", "frequency": 2},
    ]


@pytest.mark.asyncio
async def test_get_popular_terms_with_both_filters():
    """Test popular terms endpoint with both domain and language filters."""
    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.all.return_value = [("University", 3)]
    mock_db.execute.return_value = mock_result

    result = await analytics.get_popular_terms(
        db=mock_db, domain="Education", language="english"
    )
    assert result == [{"term": "University", "frequency": 3}]


@pytest.mark.asyncio
async def test_get_translation_completeness_edge_cases():
    """Test translation completeness with edge cases for coverage."""
    mock_db = AsyncMock()
    # Mock data that covers different translation scenarios
    mock_result = MagicMock()
    mock_result.all.return_value = [
        ("Agriculture", "Farm", 3),  # fully translated (equals total_languages)
        ("Agriculture", "Soil", 2),  # partial translation
        ("Agriculture", "Seed", 1),  # single language only
        ("Education", "School", 3),  # fully translated
    ]
    mock_total_languages_result = MagicMock()
    mock_total_languages_result.scalar.return_value = 3

    mock_db.execute.side_effect = [mock_result, mock_total_languages_result]

    result = await analytics.get_translation_completeness(mock_db)

    assert result["total_languages_available"] == 3
    assert "domain_statistics" in result
    # Check that all translation categories are covered
    agri_stats = result["domain_statistics"]["Agriculture"]
    assert agri_stats["total_terms"] == 3
    assert agri_stats["fully_translated"] == 1  # Farm with 3 languages
    assert agri_stats["partial_translations"] == 1  # Soil with 2 languages
    assert agri_stats["single_language_only"] == 1  # Seed with 1 language


@pytest.mark.asyncio
async def test_health_check_endpoint():
    """Test the health check endpoint."""
    result = await analytics.health_check()
    assert result == {"status": "healthy", "service": "analytics"}


@pytest.mark.asyncio
async def test_test_endpoint():
    """Test the test endpoint."""
    result = await analytics.test_endpoint()
    assert "message" in result
    assert "timestamp" in result
    assert "endpoints" in result
    assert result["message"] == "Analytics service is working!"
    assert isinstance(result["endpoints"], list)
