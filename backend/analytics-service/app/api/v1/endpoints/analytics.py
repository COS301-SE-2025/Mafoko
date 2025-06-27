from fastapi import APIRouter
import pandas as pd
from collections import Counter  # noqa: F401
import os


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


# Analytics helper functions
async def get_dataset_columns():
    """Get column information from the dataset."""
    df = await load_marito_data()
    # Get language columns (ends with _term)
    language_columns = [col for col in df.columns if col.endswith("_term")]
    # Get definition columns (ends with _definition)
    definition_columns = [col for col in df.columns if col.endswith("_definition")]
    category_column = "category"
    return df, language_columns, definition_columns, category_column


@router.get("/descriptive")
async def get_descriptive_analytics():
    """Get all descriptive analytics (legacy endpoint).
    This endpoint combines all analytics for backward compatibility."""

    # Get individual analytics
    category_counts = await get_category_frequency()
    language_coverage = await get_language_coverage()
    term_lengths = await get_term_length_analysis()
    def_lengths = await get_definition_length_analysis()
    unique_term_counts = await get_unique_terms_count()

    # Combine all analytics
    return {
        "category_frequency": category_counts,
        "language_coverage_percent": language_coverage,
        "average_term_lengths": term_lengths,
        "average_definition_lengths": def_lengths,
        "unique_term_counts": unique_term_counts,
    }


@router.get("/descriptive/category-frequency")
async def get_category_frequency():
    """Get frequency distribution of terms across different categories."""
    df, _, _, category_column = await get_dataset_columns()
    category_counts = df[category_column].value_counts().to_dict()
    return category_counts


@router.get("/descriptive/language-coverage")
async def get_language_coverage():
    """Get coverage percentage for each language (% of non-empty terms)."""
    df, language_columns, _, _ = await get_dataset_columns()
    language_coverage = {
        lang: round(df[lang].notna().sum() / len(df) * 100, 2)
        for lang in language_columns
    }
    return language_coverage


@router.get("/descriptive/term-length")
async def get_term_length_analysis():
    """Get average length of terms for each language."""
    df, language_columns, _, _ = await get_dataset_columns()
    term_lengths = {
        lang: round(df[lang].dropna().apply(len).mean(), 2) for lang in language_columns
    }
    return term_lengths


@router.get("/descriptive/definition-length")
async def get_definition_length_analysis():
    """Get average length of definitions for each language."""
    df, _, definition_columns, _ = await get_dataset_columns()
    if definition_columns:
        def_lengths = {
            col: round(df[col].dropna().apply(len).mean(), 2)
            for col in definition_columns
        }
    else:
        def_lengths = {
            "eng_definition": round(df["eng_definition"].dropna().apply(len).mean(), 2)
        }
    return def_lengths


@router.get("/descriptive/unique-terms")
async def get_unique_terms_count():
    """Get count of unique terms for each language."""
    df, language_columns, _, _ = await get_dataset_columns()
    unique_term_counts = {
        lang: df[lang].nunique(dropna=True) for lang in language_columns
    }
    return unique_term_counts
