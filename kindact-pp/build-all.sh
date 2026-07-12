#!/bin/bash

# Build the Kindact DNA.
#
# Kindact ships a single DNA version (kindact_v1_0). The resulting hApp
# bundle must be present in src-tauri/resources/ before `cargo tauri dev`
# or `cargo tauri build`.
#
# The migration machinery in src-tauri/src/migration.rs is kept dormant
# for now; it activates the first time a second DNA version ships.

set -e

echo "=== Building Kindact DNA v1.0 (kindact_v1_0) ==="
(cd dna/v1.0 && bash build.sh)

echo ""
echo "=== Build complete ==="
echo ""
echo "Resources:"
ls -lh src-tauri/resources/*.happ
