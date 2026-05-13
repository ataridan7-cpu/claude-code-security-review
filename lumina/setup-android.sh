#!/usr/bin/env bash
# setup-android.sh — Bootstrap the Lumina Android project from this source directory.
#
# Usage:
#   ./setup-android.sh [target-directory]
#
# Default target: ./lumina-build (created next to this script)
# Requires: Node 20+, npx, Android SDK, a USB-connected Android device.

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${1:-${REPO_DIR}/../lumina-build}"
TARGET_DIR="$(realpath -m "$TARGET_DIR")"
ANDROID_PKG_PATH="android/app/src/main/java/com/lumina/app"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║        Lumina Android Setup              ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Source : $REPO_DIR"
echo "Target : $TARGET_DIR"
echo ""

# ── Step 1: Scaffold Expo bare project ───────────────────────────────────────
if [ -d "$TARGET_DIR" ]; then
  echo "⚠  Target directory already exists — skipping scaffold."
  echo "   Delete $TARGET_DIR and re-run to start fresh."
else
  echo "📦  Scaffolding Expo bare project…"
  npx create-expo-app@latest "$TARGET_DIR" --template bare-minimum --no-install
fi

cd "$TARGET_DIR"

# ── Step 2: Copy source files ─────────────────────────────────────────────────
echo ""
echo "📂  Copying source files…"
cp -r "$REPO_DIR/app"        ./app
cp -r "$REPO_DIR/src"        ./src
cp -r "$REPO_DIR/__tests__"  ./__tests__
cp    "$REPO_DIR/app.config.ts"    ./app.config.ts
cp    "$REPO_DIR/babel.config.js"  ./babel.config.js
cp    "$REPO_DIR/metro.config.js"  ./metro.config.js
cp    "$REPO_DIR/tsconfig.json"    ./tsconfig.json
cp    "$REPO_DIR/package.json"     ./package.json

# ── Step 3: Placeholder assets (required by Expo at build time) ───────────────
echo ""
echo "🖼   Creating placeholder assets…"
mkdir -p assets
# 1×1 purple PNG encoded as base64
PURPLE_PNG="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
for asset in icon.png splash.png adaptive-icon.png; do
  if [ ! -f "assets/$asset" ]; then
    echo "$PURPLE_PNG" | base64 --decode > "assets/$asset"
  fi
done

# ── Step 4: Install JS dependencies ───────────────────────────────────────────
echo ""
echo "📥  Installing JS dependencies…"
npm install

# ── Step 5: Copy Kotlin native modules into Android project ───────────────────
echo ""
echo "🤖  Installing Kotlin native modules…"
mkdir -p "$ANDROID_PKG_PATH"
cp "$REPO_DIR/src/native-modules/android/"*.kt "$ANDROID_PKG_PATH/"
echo "    Copied to $ANDROID_PKG_PATH/"

# ── Step 6: Install the AndroidManifest.xml ───────────────────────────────────
echo ""
echo "📋  Installing AndroidManifest.xml…"
cp "$REPO_DIR/android/AndroidManifest.xml" \
   "android/app/src/main/AndroidManifest.xml"

# ── Step 7: Run prebuild to generate native project from app.config.ts ────────
echo ""
echo "⚙   Running expo prebuild (generates android/ Gradle config)…"
npx expo prebuild --platform android --clean

# Re-apply Kotlin files and manifest after prebuild (prebuild regenerates android/)
echo ""
echo "🔁  Re-applying Kotlin files after prebuild…"
mkdir -p "$ANDROID_PKG_PATH"
cp "$REPO_DIR/src/native-modules/android/"*.kt "$ANDROID_PKG_PATH/"
cp "$REPO_DIR/android/AndroidManifest.xml" \
   "android/app/src/main/AndroidManifest.xml"

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "✅  Setup complete!"
echo ""
echo "Before running the app:"
echo ""
echo "  1. Connect an Android device with USB debugging enabled"
echo "     (adb devices should list it)"
echo ""
echo "  2. Grant Usage Access on the device:"
echo "     Settings → Apps → Special App Access → Usage Access → Lumina → Allow"
echo ""
echo "  3. Build and install:"
echo "     cd $TARGET_DIR && npx expo run:android"
echo ""
echo "  4. In the app, complete onboarding and enter your Anthropic API key."
echo "     Get one free at: console.anthropic.com → API Keys"
echo ""
echo "  5. Create a goal targeting any app with a short limit (e.g. 5 seconds),"
echo "     then open that app to verify the blocking overlay appears."
echo ""
