#!/usr/bin/env bash
# setup-ios.sh — Bootstrap the Lumina iOS project from this source directory.
#
# Usage:
#   ./setup-ios.sh [target-directory]
#
# Default target: ./lumina-build (created next to this script)
# Requires: Node 20+, npx, Xcode 15+, CocoaPods, a physical iOS device.
#
# NOTE: The FamilyControls entitlement requires Apple approval before the
# app will work on a real device. Request it at:
#   https://developer.apple.com/contact/request/family-controls-distribution

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${1:-${REPO_DIR}/../lumina-build}"
TARGET_DIR="$(realpath -m "$TARGET_DIR")"
IOS_APP_DIR="ios/Lumina"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║          Lumina iOS Setup                ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Source : $REPO_DIR"
echo "Target : $TARGET_DIR"
echo ""

# ── Step 1: Scaffold Expo bare project ───────────────────────────────────────
if [ -d "$TARGET_DIR" ]; then
  echo "⚠  Target directory already exists — skipping scaffold."
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

# ── Step 3: Placeholder assets ────────────────────────────────────────────────
echo ""
echo "🖼   Creating placeholder assets…"
mkdir -p assets
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

# ── Step 5: Run expo prebuild for iOS ─────────────────────────────────────────
echo ""
echo "⚙   Running expo prebuild (generates ios/ Xcode project)…"
npx expo prebuild --platform ios --clean

# ── Step 6: Copy Swift native modules ─────────────────────────────────────────
echo ""
echo "🍎  Copying Swift native modules…"
mkdir -p "$IOS_APP_DIR"
cp "$REPO_DIR/src/native-modules/ios/LuminaScreenTime.swift"          "$IOS_APP_DIR/"
cp "$REPO_DIR/src/native-modules/ios/LuminaScreenTimeModule.m"        "$IOS_APP_DIR/"
cp "$REPO_DIR/src/native-modules/ios/LuminaBlocking.swift"            "$IOS_APP_DIR/"
cp "$REPO_DIR/src/native-modules/ios/LuminaBlockingModule.m"          "$IOS_APP_DIR/"
cp "$REPO_DIR/src/native-modules/ios/LuminaAppPickerViewController.swift" "$IOS_APP_DIR/"

mkdir -p "$IOS_APP_DIR/DeviceActivityExtension"
cp "$REPO_DIR/src/native-modules/ios/DeviceActivityExtension/DeviceActivityMonitor.swift" \
   "$IOS_APP_DIR/DeviceActivityExtension/"

echo "    Copied to $IOS_APP_DIR/"

# ── Step 7: CocoaPods ─────────────────────────────────────────────────────────
echo ""
echo "🦾  Installing CocoaPods…"
cd ios && pod install && cd ..

# ── Done: manual Xcode steps ──────────────────────────────────────────────────
echo ""
echo "✅  Automated setup complete!"
echo ""
echo "════════════════════════════════════════════════════════════"
echo "  MANUAL STEPS REQUIRED IN XCODE"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Open the project:"
echo "  open ios/Lumina.xcworkspace"
echo ""
echo "1. ADD SWIFT FILES TO XCODE PROJECT"
echo "   Drag all files from ios/Lumina/ into the Lumina target in the"
echo "   Xcode project navigator. Check 'Copy items if needed' and"
echo "   'Add to target: Lumina'."
echo ""
echo "2. ADD DeviceActivity EXTENSION TARGET"
echo "   File → New → Target → DeviceActivity Monitor Extension"
echo "   Name: DeviceActivityExtension"
echo "   Bundle ID: com.lumina.app.DeviceActivityExtension"
echo "   Replace the generated monitor file with:"
echo "   ios/Lumina/DeviceActivityExtension/DeviceActivityMonitor.swift"
echo ""
echo "3. CONFIGURE APP GROUP"
echo "   Select the Lumina target → Signing & Capabilities → + Capability"
echo "   → App Groups → add: group.com.lumina.app"
echo "   Repeat for the DeviceActivityExtension target."
echo ""
echo "4. ENABLE FamilyControls CAPABILITY"
echo "   Select the Lumina target → Signing & Capabilities → + Capability"
echo "   → Family Controls"
echo "   ⚠  This requires Apple approval. Request at:"
echo "      https://developer.apple.com/contact/request/family-controls-distribution"
echo ""
echo "5. ADD ManagedSettings + DeviceActivity FRAMEWORKS"
echo "   Select the Lumina target → General → Frameworks, Libraries…"
echo "   → + → ManagedSettings.framework"
echo "   → + → DeviceActivity.framework"
echo "   → + → FamilyControls.framework"
echo ""
echo "6. BUILD AND RUN ON DEVICE"
echo "   Select your physical device (Simulator does not support Screen Time)"
echo "   Product → Run  (⌘R)"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""
