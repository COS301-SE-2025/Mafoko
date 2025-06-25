#!/bin/sh
# run_tests.sh - A script to run tests for all microservices.

# This line ensures that the script will exit immediately if a command fails.
set -e

echo "--- Running tests for Auth Service ---"
# Set PYTHONPATH=. to add the current directory (/app) to Python's import path
docker-compose exec auth-service sh -c "PYTHONPATH=. pytest"

echo ""
echo "--- Running tests for Search Service ---"
docker-compose exec search-service sh -c "PYTHONPATH=. pytest"

echo ""
echo "--- Running tests for Analytics Service ---"
docker-compose exec analytics-service sh -c "PYTHONPATH=. pytest"


echo ""
echo "--- Running tests for Glossary Service ---"
docker-compose exec glossary-service sh -c "PYTHONPATH=. pytest"

echo ""
echo "✅ All tests passed successfully!"