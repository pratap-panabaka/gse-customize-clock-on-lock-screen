#!/usr/bin/env bash
set -euo pipefail

UUID=CustomizeClockOnLockScreen@pratap.fastmail.fm
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
SOURCE_DIR="$SCRIPT_DIR/src/v-45-46-47-48-49-50"
SHELL_VERSION=$(gnome-shell --version)
if [[ ! $SHELL_VERSION =~ ([0-9]+)\.[0-9]+ ]]; then
    echo "Cannot determine GNOME Shell version: $SHELL_VERSION" >&2
    exit 1
fi
SHELL_MAJOR=${BASH_REMATCH[1]}
if (( SHELL_MAJOR < 45 || SHELL_MAJOR > 51 )); then
    echo "Supported GNOME Shell versions: 45–51 (detected $SHELL_MAJOR)." >&2
    exit 1
fi

# Build outside the source tree; always clean up, including on failure.
BUILD_DIR=$(mktemp -d)
trap 'rm -rf -- "$BUILD_DIR"' EXIT
cp -R -- "$SOURCE_DIR/." "$BUILD_DIR/"
glib-compile-schemas --strict "$BUILD_DIR/schemas"
(cd -- "$BUILD_DIR" && zip -qr "$UUID.zip" . -x '*.zip')
gnome-extensions install --force "$BUILD_DIR/$UUID.zip"
echo "Installed $UUID for GNOME $SHELL_MAJOR."
echo "Enable it with: gnome-extensions enable $UUID"
echo "If updating an already loaded extension, log out and log in to load the new code."
