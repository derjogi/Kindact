#!/bin/bash

# Build script for Kindact DNA v1.0 (kindact_v1_0)
#
# The single Kindact DNA version. Bundles two zomes:
#   - agent_linking (Flowsta identity linking, from flowsta-agent-linking)
#   - issues (Kindact issue and comment zome)
#
# Prerequisites:
#   - hc CLI 0.6.x: cargo install holochain_cli --version 0.6.1
#   - Optional: flowsta-agent-linking repo at ../../../flowsta-agent-linking/
#     (existing workdir WASMs are reused when the checkout is absent)

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AGENT_LINKING_DIR="$SCRIPT_DIR/../../../flowsta-agent-linking"

echo "Building Kindact DNA v1.0 (kindact_v1_0)"

if ! command -v hc &> /dev/null; then
    echo "Error: Holochain CLI (hc) not found"
    echo "Install with: cargo install holochain_cli --version 0.6.1"
    exit 1
fi

mkdir -p workdir

if [ -d "$AGENT_LINKING_DIR" ]; then
    echo "Building agent_linking zomes from flowsta-agent-linking..."
    RUSTFLAGS='--cfg getrandom_backend="custom"' CARGO_TARGET_DIR="$AGENT_LINKING_DIR/target" \
        cargo build --release --target wasm32-unknown-unknown \
        --manifest-path "$AGENT_LINKING_DIR/Cargo.toml"

    cp "$AGENT_LINKING_DIR/target/wasm32-unknown-unknown/release/flowsta_agent_linking_integrity.wasm" \
        workdir/agent_linking_integrity.wasm
    cp "$AGENT_LINKING_DIR/target/wasm32-unknown-unknown/release/flowsta_agent_linking_coordinator.wasm" \
        workdir/agent_linking_coordinator.wasm
elif [ -f workdir/agent_linking_integrity.wasm ] && [ -f workdir/agent_linking_coordinator.wasm ]; then
    echo "Reusing prebuilt agent_linking WASMs from workdir..."
else
    echo "Error: agent_linking WASMs are unavailable"
    echo "Either clone flowsta-agent-linking at $AGENT_LINKING_DIR or provide both prebuilt WASMs in workdir/"
    exit 1
fi

echo "Building issues zomes..."
RUSTFLAGS='--cfg getrandom_backend="custom"' CARGO_TARGET_DIR=target \
    cargo build --release --target wasm32-unknown-unknown

echo "Copying WASM files..."
cp target/wasm32-unknown-unknown/release/issues_integrity.wasm workdir/
cp target/wasm32-unknown-unknown/release/issues_coordinator.wasm workdir/

echo "Packing DNA..."
hc dna pack workdir

echo "Packing hApp..."
hc app pack workdir

RESOURCES_DIR="$SCRIPT_DIR/../../src-tauri/resources"
if [ -d "$RESOURCES_DIR" ] || [ -d "$SCRIPT_DIR/../../src-tauri" ]; then
    mkdir -p "$RESOURCES_DIR"
    cp workdir/kindact_v1_0_happ.happ "$RESOURCES_DIR/"
    echo "Copied hApp to src-tauri/resources/"
fi

echo ""
echo "Build complete!"
echo ""
echo "Outputs:"
echo "  - DNA: workdir/kindact_v1_0.dna"
echo "  - hApp: workdir/kindact_v1_0_happ.happ"
