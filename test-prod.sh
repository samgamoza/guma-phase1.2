#!/bin/bash
export CRAWLER_API_URL="https://guma-phase1-crawler-production.up.railway.app"
export GENERATOR_API_URL="https://guma-phase1-generator-production.up.railway.app"
export ADMIN_API_SECRET="test_secret_123"
node test-flow.js
