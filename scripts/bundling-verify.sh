#!/bin/bash
# bundling-verify.sh - Verify that bundles don't contain unwanted code

set -e

echo "========================================="
echo "  Micro-Mongo Bundling Verification"
echo "========================================="
echo ""

BUILD_DIR="./build"

if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Build directory not found. Run 'npm run build' first."
    exit 1
fi

echo "🔍 Checking main bundle (client code)..."
MAIN_BUNDLE="$BUILD_DIR/micro-mongo-client.js"
if [ ! -f "$MAIN_BUNDLE" ]; then
    echo "❌ Main bundle not found: $MAIN_BUNDLE"
    exit 1
fi
echo "   Bundle: $MAIN_BUNDLE"
echo "   Size: $(du -h $MAIN_BUNDLE | cut -f1)"

# Main bundle should contain client code
echo "   ✓ Checking for client code..."
if grep -q "class MongoClient" "$MAIN_BUNDLE"; then
    echo "     ✓ MongoClient found"
else
    echo "     ❌ MongoClient NOT found"
    exit 1
fi

if grep -q "class ProxyDB" "$MAIN_BUNDLE"; then
    echo "     ✓ ProxyDB found"
else
    echo "     ❌ ProxyDB NOT found"
    exit 1
fi

# Main bundle should NOT contain server code
echo "   ✓ Checking for absence of server code..."
if grep -q "class Server" "$MAIN_BUNDLE" | grep -v "MongoServer" | grep -v "ServerWorker" 2>/dev/null; then
    echo "     ⚠️  WARNING: Server class found in main bundle (may be intentional)"
else
    echo "     ✓ Server class not found (good)"
fi

if grep -q "class Collection.*constructor.*{" "$MAIN_BUNDLE" 2>/dev/null; then
    echo "     ⚠️  WARNING: Collection class found in main bundle"
else
    echo "     ✓ Collection class not found (good)"
fi

echo ""
echo "🔍 Checking worker bundle..."
WORKER_BUNDLE="$BUILD_DIR/micro-mongo-server-worker.js"
if [ ! -f "$WORKER_BUNDLE" ]; then
    echo "❌ Worker bundle not found: $WORKER_BUNDLE"
    exit 1
fi
echo "   Bundle: $WORKER_BUNDLE"
echo "   Size: $(du -h $WORKER_BUNDLE | cut -f1)"

# Worker bundle should contain server code
echo "   ✓ Checking for server code..."
if grep -q "class Server" "$WORKER_BUNDLE"; then
    echo "     ✓ Server class found"
else
    echo "     ❌ Server class NOT found"
    exit 1
fi

if grep -q "class Collection" "$WORKER_BUNDLE"; then
    echo "     ✓ Collection class found"
else
    echo "     ❌ Collection class NOT found"
    exit 1
fi

if grep -q "QueryPlanner" "$WORKER_BUNDLE"; then
    echo "     ✓ QueryPlanner found"
else
    echo "     ❌ QueryPlanner NOT found"
    exit 1
fi

# Worker bundle should NOT contain client code
echo "   ✓ Checking for absence of client code..."
if grep -q "class ProxyDB" "$WORKER_BUNDLE"; then
    echo "     ⚠️  WARNING: ProxyDB found in worker bundle (may be imported unintentionally)"
else
    echo "     ✓ ProxyDB not found (good)"
fi

echo ""
echo "📊 Bundle Statistics:"
MAIN_SIZE=$(du -b "$MAIN_BUNDLE" | cut -f1)
WORKER_SIZE=$(du -b "$WORKER_BUNDLE" | cut -f1)
TOTAL_SIZE=$((MAIN_SIZE + WORKER_SIZE))

printf "   Main:   %10d bytes\n" "$MAIN_SIZE"
printf "   Worker: %10d bytes\n" "$WORKER_SIZE"
printf "   Total:  %10d bytes\n" "$TOTAL_SIZE"
echo ""

echo "✅ Bundle verification passed!"
echo ""
echo "Next steps:"
echo "  1. Check bundle sizes are reasonable"
echo "  2. Test in browser: npm run test:browser"
echo "  3. Test in Node: npm test"
