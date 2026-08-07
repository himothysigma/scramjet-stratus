#!/usr/bin/env bash
# Turso setup script — creates a cloud SQLite database for persistent storage
# Run this on your local machine (NOT in the container)
set -e

echo "=== Turso Setup for Synnical ==="
echo ""
echo "This script will:"
echo "1. Install the Turso CLI (if not installed)"
echo "2. Log you into Turso"
echo "3. Create a database called 'synnical'"
echo "4. Generate the connection URL + auth token"
echo "5. Show you the env vars to set on your hosting platform"
echo ""

# Check if turso is installed
if ! command -v turso &> /dev/null; then
    echo "Installing Turso CLI..."
    curl -sSfL https://get.tur.so/install.sh | bash
    export PATH="$HOME/.turso/bin:$PATH"
    echo "Turso CLI installed. You may need to restart your terminal."
    echo "Run this script again after restarting."
    exit 0
fi

# Login
echo "=== Step 1: Login to Turso ==="
turso auth login
echo ""

# Create database
echo "=== Step 2: Create database ==="
turso db create synnical --group default
echo ""

# Get URL
DB_URL=$(turso db show synnical --url)
echo "Database URL: $DB_URL"
echo ""

# Create auth token
echo "=== Step 3: Create auth token ==="
DB_TOKEN=$(turso db tokens create synnical)
echo "Auth token created."
echo ""

# Apply schema
echo "=== Step 4: Apply database schema ==="
echo "Generating SQL from Prisma schema..."
cd "$(dirname "$0")"
bunx prisma generate 2>/dev/null || true
SQL=$(bunx prisma migrate diff --from-empty --to-schema-datamodel ./prisma/schema.prisma --script 2>/dev/null)
if [ -n "$SQL" ]; then
    echo "Applying schema to Turso..."
    echo "$SQL" | turso db shell synnical
    echo "Schema applied successfully."
else
    echo "WARNING: Could not auto-apply schema."
    echo "Run 'bunx prisma db push' with the Turso URL after setting env vars."
fi
echo ""

# Show env vars
echo "════════════════════════════════════════════════════════════"
echo "  SETUP COMPLETE! Set these env vars on your hosting platform:"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "  DATABASE_URL=$DB_URL"
echo "  DATABASE_AUTH_TOKEN=$DB_TOKEN"
echo ""
echo "  On Hugging Face: Settings > Repository secrets"
echo "  On Koyeb: Settings > Environment Variables"
echo "  On Railway: Settings > Variables"
echo "  On Replit: Secrets tab"
echo "════════════════════════════════════════════════════════════"
