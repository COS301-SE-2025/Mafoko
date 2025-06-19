"""
Module: crud_search

This module provides functions to load, filter, and sort multilingual terminology data
from a JSON dataset file. It defines two key functions:
- load_terms(): loads raw data and converts it into Term model objects.
- search_terms(): applies search queries, filters, and sorting to the loaded terms.

Note:
- Builds one Term per language per entry.
- Links translations by UUID across languages.
"""

import json
import spacy
import os
from uuid import uuid4
from typing import List, Optional
from mavito_common.schemas.term import Term

# Load spaCy
nlp = spacy.load("en_core_web_sm")

LANGUAGE_KEYS = {
    "eng term": "English",
    "afr term": "Afrikaans",
    "nde term": "isiNdebele",
    "xho term ": "isiXhosa",
    "zul term": "isiZulu",
    "nso term": "Sepedi",
    "sot term": "Sesotho",
    "tsn term ": "Setswana",
    "ssw term": "siSwati",
    "ven term": "Tshivenda",
    "tso term ": "Xitsonga",
}

DATA_FILE = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "../../Mock_Data/multilingual_statistical_terminology_clean.json",
    )
)


async def load_terms() -> List[Term]:
    """
    Load terms from the multilingual statistical terminology JSON file.

    For each input record, generates one Term object per language,
    linking all terms as translations of each other.

    Returns:
        List[Term]: A list of Term model objects populated from the JSON data.
    """
    with open(DATA_FILE) as f:
        raw_data = json.load(f)

    terms: List[Term] = []

    for item in raw_data:
        # Pre-generate UUIDs per language for cross-linking translations
        language_uuid_map = {
            lang_key: uuid4() for lang_key in LANGUAGE_KEYS.keys() if item.get(lang_key)
        }

        # Build Term objects per language
        for lang_key, lang_name in LANGUAGE_KEYS.items():
            term_value = item.get(lang_key)
            if term_value:
                term_uuid = language_uuid_map[lang_key]
                translation_uuids = [
                    uid for key, uid in language_uuid_map.items() if key != lang_key
                ]

                terms.append(
                    Term(
                        id=term_uuid,
                        term=term_value,
                        definition=item.get("eng definition ", "").strip(),
                        language=lang_name,
                        domain=item.get("category", "General"),
                        translations=translation_uuids,
                        example="",
                        related_terms=[],
                        upvotes=0,
                        downvotes=0,
                        comments=[],
                    )
                )

    return terms


async def search_terms(
    query: str,
    language: Optional[str] = None,
    domain: Optional[str] = None,
    sort_by: str = "name",
) -> List[Term]:
    """
    Search terms matching a query string, with optional filtering and sorting.

    Args:
        query (str): The search query to match against the term name.
        language (str, optional): Language filter (case-insensitive).
        domain (str, optional): Domain filter (case-insensitive).
        sort_by (str): Sorting criteria; either 'name' (alphabetical) or 'popularity' (upvotes - downvotes).

    Returns:
        List[Term]: A list of Term objects matching the query and filters, sorted accordingly.
    """
    terms = await load_terms()

    # Filter by query in term name
    filtered = [t for t in terms if query.lower() in t.term.lower()]

    # Apply optional filters
    if language:
        filtered = [t for t in filtered if t.language.lower() == language.lower()]
    if domain:
        filtered = [t for t in filtered if t.domain.lower() == domain.lower()]

    # Sort results
    if sort_by == "name":
        filtered.sort(key=lambda t: t.term.lower())
    elif sort_by == "popularity":
        filtered.sort(key=lambda t: t.upvotes - t.downvotes, reverse=True)

    return filtered
