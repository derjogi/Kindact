#!/bin/bash

# Build script for Kindact DNA v1.0 (kindact_v1_0)
#
# The single Kindact DNA version. Bundles two zomes:
#   - agent_linking (Flowsta identity linking, from flowsta-agent-linking)
#   - polls (Kindact app zome — becomes `issues` in a later phase)
#
# Prerequisites:
#   - hc CLI 0.6.x: cargo install holochain_cli --version 0.6.1
#   - flowsta-agent-linking repo cloned at ../../../flowsta-agent-linking/

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

echo "Building agent_linking zomes from flowsta-agent-linking..."
if [ ! -d "$AGENT_LINKING_DIR" ]; then
    echo "Error: flowsta-agent-linking not found at $AGENT_LINKING_DIR"
    echo "Clone it from: https://github.com/WeAreFlowsta/flowsta-agent-linking"
    exit 1
fi
RUSTFLAGS='--cfg getrandom_backend="custom"' CARGO_TARGET_DIR="$AGENT_LINKING_DIR/target" \
    cargo build --release --target wasm32-unknown-unknown \
    --manifest-path "$AGENT_LINKING_DIR/Cargo.toml"

echo "Building polls zomes..."
RUSTFLAGS='--cfg getrandom_backend="custom"' CARGO_TARGET_DIR=target \
    cargo build --release --target wasm32-unknown-unknown

echo "Copying WASM files..."
cp "$AGENT_LINKING_DIR/target/wasm32-unknown-unknown/release/flowsta_agent_linking_integrity.wasm" \
    workdir/agent_linking_integrity.wasm
cp "$AGENT_LINKING_DIR/target/wasm32-unknown-unknown/release/flowsta_agent_linking_coordinator.wasm" \
    workdir/agent_linking_coordinator.wasm
cp target/wasm32-unknown-unknown/release/polls_integrity.wasm workdir/
cp target/wasm32-unknown-unknown/release/polls_coordinator.wasm workdir/

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
