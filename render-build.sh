#!/bin/bash

# Fail the build if anything fails
set -e

echo ">>> Installing Chromium manually..."

# Create directory to hold Chromium
mkdir -p .local-chromium

# Download and extract Chromium (version compatible with Puppeteer)
wget https://storage.googleapis.com/chromium-browser-snapshots/Linux_x64/1095492/chrome-linux.zip
unzip chrome-linux.zip -d .local-chromium
rm chrome-linux.zip

echo ">>> Chromium installed successfully!"
