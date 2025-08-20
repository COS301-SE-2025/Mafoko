#!/bin/sh
# run_tests.sh - A script to run tests for all microservices.

set -e

echo "--- Running tests for Auth Service ---"
docker-compose exec auth-service sh -c "PYTHONPATH=. pytest"

echo ""
echo "--- Running tests for Search Service ---"
docker-compose exec search-service sh -c "PYTHONPATH=. pytest"

echo ""
echo "--- Running tests for Glossary Service ---"
echo "  Running Unit Tests (Direct Function Testing)..."
docker-compose exec glossary-service sh -c "PYTHONPATH=. pytest app/tests/test_unit_functions.py -v"

echo "  Running Integration Tests (API Workflow Testing)..."
docker-compose exec glossary-service sh -c "PYTHONPATH=. pytest app/tests/test_glossary.py -v"

echo ""
echo "--- Running tests for Workspace Service ---"
docker-compose exec workspace-service sh -c "PYTHONPATH=. pytest"

echo ""
echo "--- Running tests for Feedback Service ---"
docker-compose exec feedback-service sh -c "PYTHONPATH=. pytest"

echo ""
echo "--- Running tests for Voting Service ---"
docker-compose exec vote-service sh -c "PYTHONPATH=. pytest"

echo ""
echo "✅ All tests passed successfully!"
