from faker import Faker
import psycopg2
import random
from datetime import datetime, timedelta  # noqa: F401

fake = Faker()
Faker.seed(0)

# Connect to PostgreSQL
conn = psycopg2.connect(
    dbname="your_db", user="your_user", password="your_password", host="localhost"
)
cur = conn.cursor()

# Language codes and names
language_samples = [
    ("eng", "English", "English"),
    ("zul", "Zulu", "isiZulu"),
    ("xho", "Xhosa", "isiXhosa"),
    ("afr", "Afrikaans", "Afrikaans"),
    ("swa", "Swahili", "Kiswahili"),
]

# Insert languages
for code, name, native in language_samples:
    cur.execute(
        "INSERT INTO languages (code, name, native_name) VALUES (%s, %s, %s) ON CONFLICT DO NOTHING",
        (code, name, native),
    )

# Generate users
user_ids = []
roles = ["linguist", "researcher", "contributor"]

for _ in range(20):  # create 20 users
    first = fake.first_name()
    last = fake.last_name()
    email = fake.unique.email()
    password_hash = fake.sha256()
    role = random.choice(roles)
    created = fake.date_time_this_year(tzinfo=None)
    last_login = created + timedelta(days=random.randint(0, 60))
    pic_url = fake.image_url()
    verified = random.choice([True, False])
    locked = random.choice([False, False, False, True])  # mostly false
    failed_logins = random.randint(0, 5)

    cur.execute(
        """INSERT INTO users (first_name, last_name, email, password_hash, role, created_at,
                              last_login, is_verified, profile_pic_url, account_locked, failed_login_attempts)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
        (
            first,
            last,
            email,
            password_hash,
            role,
            created,
            last_login,
            verified,
            pic_url,
            locked,
            failed_logins,
        ),
    )
    row = cur.fetchone()
    if row:  # Check if a row was actually returned
        user_ids.append(row[0])

# Preferences and languages
for user_id in user_ids:
    lang_code = random.choice(language_samples)[0]
    cur.execute(
        "INSERT INTO user_preferences (user_id, ui_language) VALUES (%s, %s)",
        (user_id, lang_code),
    )

    # Insert 1-3 languages per user
    for lang in random.sample(language_samples, random.randint(1, 3)):
        cur.execute(
            """INSERT INTO user_languages (user_id, language_code, proficiency_level, is_primary)
               VALUES (%s, %s, %s, %s) ON CONFLICT DO NOTHING""",
            (user_id, lang[0], random.randint(1, 5), random.choice([True, False])),
        )

    # Insert 3-7 search history records per user
    for _ in range(random.randint(3, 7)):
        query = fake.sentence()
        timestamp = fake.date_time_this_year()
        lang_code = random.choice(language_samples)[0]
        result_count = random.randint(0, 100)

        cur.execute(
            """INSERT INTO user_search_history (user_id, query, timestamp, language_code, result_count)
               VALUES (%s, %s, %s, %s, %s)""",
            (user_id, query, timestamp, lang_code, result_count),
        )

conn.commit()
cur.close()
conn.close()
print("Data inserted successfully.")
