# search-service/scripts/ingest_data.py
import json
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from uuid import uuid4


sys.path.append(
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../mavito-common-lib"))
)

from mavito_common.models.term import Term
from mavito_common.db.base_class import Base

# --- CONFIGURATION ---
# Use environment variables for database connection, matching docker-compose
DB_USER = os.getenv("DB_USER", "mavito_dev_user")
DB_PASSWORD = os.getenv("DB_PASSWORD", "mavito_dev_password")
DB_NAME = os.getenv("DB_NAME", "mavito_local_dev_db")
DB_HOST = "db"  # The service name of the postgres container in docker-compose
DB_PORT = "5432"
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# Path to your mock data file
DATA_FILE = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "../Mock_Data/multilingual_statistical_terminology_clean.json",
    )
)

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


def main():
    print("Connecting to the database...")
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Create tables if they don't exist
    print("Creating tables (if they don't exist)...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    print(f"Loading data from {DATA_FILE}...")
    with open(DATA_FILE) as f:
        raw_data = json.load(f)

    print(f"Found {len(raw_data)} multilingual entries to process.")

    for i, item in enumerate(raw_data):
        print(f"Processing entry {i+1}/{len(raw_data)}...")

        # Create all term objects for this entry first
        created_terms = []
        for lang_key, lang_name in LANGUAGE_KEYS.items():
            term_value = item.get(lang_key)
            if term_value and term_value.strip():
                new_term = Term(
                    id=uuid4(),
                    term=term_value.strip(),
                    definition=item.get("eng definition ", "").strip(),
                    language=lang_name,
                    domain=item.get("category", "General"),
                )
                created_terms.append(new_term)

        # Now, establish the translation relationships
        if len(created_terms) > 1:
            for term_obj in created_terms:
                term_obj.translations = [
                    t for t in created_terms if t.id != term_obj.id
                ]

        # Add to the session
        db.add_all(created_terms)

    print("Committing all new terms to the database...")
    db.commit()
    db.close()
    print("Data ingestion complete!")


if __name__ == "__main__":
    main()
