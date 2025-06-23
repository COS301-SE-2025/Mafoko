from fastapi import APIRouter
from typing import List
import pandas as pd
from collections import Counter  # noqa: F401
import os
from fastapi import HTTPException, Query
from typing import Dict, Optional

router = APIRouter()

# caches dataset
TERM_DATASET = None

# Build path relative to the current file location
DATASET_PATH = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "../../../../Mock_Data/multilingual_statistical_terminology_clean.json",
    )
)


# load marito data from json
async def load_marito_data():
    global TERM_DATASET
    if TERM_DATASET is None:
        df = pd.read_json(DATASET_PATH)
        # Normalize column names
        df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]
        TERM_DATASET = df
    return TERM_DATASET


# Language mappings
LANGUAGE_MAP = {
    "eng_term": "English",
    "afr_term": "Afrikaans",
    "nde_term": "Ndebele",
    "xho_term": "Xhosa",
    "zul_term": "Zulu",
    "nso_term": "Northern Sotho",
    "sot_term": "Sotho",
    "tsn_term": "Tswana",
    "ssw_term": "Swazi",
    "ven_term": "Venda",
    "tso_term": "Tsonga",
}


# Helper functions for glossary API
async def get_all_categories():
    """Get all unique categories from the dataset."""
    df = await load_marito_data()
    return sorted(df["category"].unique().tolist()) if "category" in df.columns else []


async def get_terms_by_category(category: str):
    """Get all terms for a specific category."""
    df = await load_marito_data()

    if "category" not in df.columns:
        return []

    filtered_df = df[df["category"].str.lower() == category.lower()]

    result = []
    for _, row in filtered_df.iterrows():
        term_data = {
            "id": row.get("eng_term", ""),
            "term": row.get("eng_term", ""),
            "definition": row.get("eng_definition", ""),
            "category": row.get("category", ""),
        }
        result.append(term_data)

    return result


async def get_term_translations(term_id: str):
    """Get all available translations for a specific term."""
    df = await load_marito_data()

    # Find the term (case-insensitive)
    term_row = df[df["eng_term"].str.lower() == term_id.lower()]

    if term_row.empty:
        return None

    row = term_row.iloc[0]

    translations = {}
    for lang_col, lang_name in LANGUAGE_MAP.items():
        if lang_col in row and not pd.isna(row[lang_col]):
            translations[lang_name] = row[lang_col]

    return {
        "term": row.get("eng_term", ""),
        "definition": row.get("eng_definition", ""),
        "translations": translations,
    }


async def search_terms(query: str):
    """Search for terms across all categories."""
    df = await load_marito_data()

    # Search in both term and definition columns (case-insensitive)
    mask = df["eng_term"].str.lower().str.contains(query.lower()) | df[
        "eng_definition"
    ].str.lower().str.contains(query.lower())
    results = df[mask]

    return [
        {
            "id": row.get("eng_term", ""),
            "term": row.get("eng_term", ""),
            "definition": row.get("eng_definition", ""),
            "category": row.get("category", ""),
        }
        for _, row in results.iterrows()
    ]


@router.get("/descriptive")
async def get_descriptive_analytics():
    df = await load_marito_data()

    language_columns = [col for col in df.columns if col.endswith("_term")]
    definition_columns = [col for col in df.columns if col.endswith("_definition")]
    category_column = "category"

    # Category Frequency
    category_counts = df[category_column].value_counts().to_dict()

    # Language Coverage (% non-empty terms)
    language_coverage = {
        lang: round(df[lang].notna().sum() / len(df) * 100, 2)
        for lang in language_columns
    }

    # Term Length Analysis (average length of terms)
    term_lengths = {
        lang: round(df[lang].dropna().apply(len).mean(), 2) for lang in language_columns
    }

    # Definition Length Analysis (if definitions are multilingual; else use eng only)
    if definition_columns:
        def_lengths = {
            col: round(df[col].dropna().apply(len).mean(), 2)
            for col in definition_columns
        }
    else:
        def_lengths = {
            "eng_definition": round(df["eng_definition"].dropna().apply(len).mean(), 2)
        }

    # Unique Terms per Language
    unique_term_counts = {
        lang: df[lang].nunique(dropna=True) for lang in language_columns
    }

    return {
        "category_frequency": category_counts,
        "language_coverage_percent": language_coverage,
        "average_term_lengths": term_lengths,
        "average_definition_lengths": def_lengths,
        "unique_term_counts": unique_term_counts,
    }


# ========== Glossary API Endpoints ==========


@router.get("/glossary/categories", response_model=List[str])
async def get_categories():
    """Get all available categories."""
    categories = await get_all_categories()
    return categories


@router.get("/glossary/categories/{category_name}/terms")
async def get_terms_by_category_api(category_name: str):
    """Get all terms for a specific category."""
    terms = await get_terms_by_category(category_name)
    if not terms:
        raise HTTPException(
            status_code=404, detail=f"No terms found for category: {category_name}"
        )
    return terms


@router.get("/glossary/terms/{term_id}/translations")
async def get_term_translations_api(term_id: str):
    """Get all available translations for a specific term."""
    translations = await get_term_translations(term_id)
    if not translations:
        raise HTTPException(status_code=404, detail=f"Term not found: {term_id}")
    return translations


@router.get("/glossary/search")
async def search_terms_api(
    query: str = Query(..., description="Search query for terms or definitions")
):
    """Search for terms across all categories."""
    results = await search_terms(query)
    return results


@router.get("/glossary/domains", response_model=List[str])
async def get_domains():
    """Get all available domains (same as categories)."""
    return await get_all_categories()


@router.get("/glossary/languages", response_model=Dict[str, str])
async def get_available_languages():
    """Get all available languages in the glossary."""
    return LANGUAGE_MAP


@router.post("/glossary/search")
async def advanced_search(
    query: Optional[str] = None,
    domain: Optional[str] = None,
    language: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
):
    """
    Advanced search endpoint with filtering by domain and language, and pagination.

    This endpoint can be used for the main glossary view with filtering capabilities.
    """
    df = await load_marito_data()

    # Start with all records
    filtered_df = df.copy()

    # Apply filters
    if domain:
        filtered_df = filtered_df[filtered_df["category"].str.lower() == domain.lower()]

    # Check if we need language filtering
    language_col = None
    if language and language.lower() != "all":
        for col, lang_name in LANGUAGE_MAP.items():
            if lang_name.lower() == language.lower():
                language_col = col
                break

        if language_col:
            # Keep only rows where the specified language column is not empty
            filtered_df = filtered_df[filtered_df[language_col].notna()]

    # Apply text search if query is provided
    if query and query.strip():
        query = query.lower()
        term_columns = [col for col in filtered_df.columns if col.endswith("_term")]
        def_columns = [
            col for col in filtered_df.columns if col.endswith("_definition")
        ]

        # Create a mask for searching in all term and definition columns
        mask = pd.Series([False] * len(filtered_df))

        for col in term_columns + def_columns:
            mask = mask | filtered_df[col].str.lower().str.contains(query, na=False)

        filtered_df = filtered_df[mask]

    # Calculate total results for pagination
    total_results = len(filtered_df)

    # Apply pagination
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    paginated_df = filtered_df.iloc[start_idx:end_idx]

    # Prepare results in the format expected by the frontend
    results = []
    for _, row in paginated_df.iterrows():
        term_data = {
            "id": str(row.name),  # Use row index as id
            "term": row.get("eng_term", ""),
            "definition": row.get("eng_definition", ""),
            "language": "English",  # Default language for the main view
        }

        # If a specific non-English language is requested, use that term instead
        if (
            language_col
            and language_col != "eng_term"
            and not pd.isna(row.get(language_col))
        ):
            term_data["term"] = row.get(language_col)
            term_data["language"] = LANGUAGE_MAP.get(language_col, "Unknown")

        results.append(term_data)

    return {
        "results": results,
        "total": total_results,
        "page": page,
        "limit": limit,
        "pages": (total_results + limit - 1)
        // limit,  # Ceiling division for total pages
    }


@router.post("/glossary/translate")
async def translate_terms(
    terms: List[str],
    source_language: str = "English",
    target_languages: Optional[List[str]] = None,
    domain: Optional[str] = None,
):
    """
    Translate a list of terms from source language to specified target languages.
    If target_languages is not provided, translates to all available languages.
    """
    df = await load_marito_data()

    # Find the source language column
    source_col = next(
        (
            col
            for col, lang in LANGUAGE_MAP.items()
            if lang.lower() == source_language.lower()
        ),
        "eng_term",
    )

    # Determine target language columns
    if target_languages:
        target_langs = [lang.lower() for lang in target_languages]
        target_cols = [
            col for col, lang in LANGUAGE_MAP.items() if lang.lower() in target_langs
        ]
    else:
        # Use all languages except the source
        target_cols = [col for col, lang in LANGUAGE_MAP.items() if col != source_col]

    # Filter by domain if specified
    if domain:
        df = df[df["category"].str.lower() == domain.lower()]

    # Find the requested terms
    result = []
    for term in terms:
        # Find rows where the source language term matches
        term_rows = df[df[source_col].str.lower() == term.lower()]

        if not term_rows.empty:
            row = term_rows.iloc[0]

            translations = {}
            for col in target_cols:
                if col in row and not pd.isna(row[col]):
                    translations[LANGUAGE_MAP[col]] = row[col]

            result.append(
                {
                    "id": str(row.name),
                    "term": row[source_col],
                    "definition": row.get("eng_definition", ""),
                    "source_language": LANGUAGE_MAP[source_col],
                    "translations": translations,
                }
            )

    return {"results": result}
