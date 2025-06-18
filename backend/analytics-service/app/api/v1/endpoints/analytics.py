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
