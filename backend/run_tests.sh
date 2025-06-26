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
echo "  Running Unit Tests..."
docker-compose exec analytics-service sh -c "PYTHONPATH=. pytest app/tests/test_term_analytics.py -v"

echo "  Running Integration Tests..."
docker-compose exec analytics-service sh -c "PYTHONPATH=. pytest app/tests/test_analytics_integration.py -v"

echo "  Running Coverage Completion Tests..."
docker-compose exec analytics-service sh -c "PYTHONPATH=. pytest app/tests/test_analytics_coverage.py -v"

echo ""
echo "--- Running tests for Glossary Service ---"
echo "  Running Unit Tests (Direct Function Testing)..."
docker-compose exec glossary-service sh -c "PYTHONPATH=. pytest app/tests/test_unit_functions.py -v"

echo "  Running Integration Tests (API Workflow Testing)..."
docker-compose exec glossary-service sh -c "PYTHONPATH=. pytest app/tests/test_glossary.py -v"

echo ""
echo "--- Running tests for Voting Service ---"
docker-compose exec vote-service sh -c "PYTHONPATH=. pytest"

echo ""
echo "✅ All tests passed successfully!"