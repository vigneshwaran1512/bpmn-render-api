#!/usr/bin/env bash
echo "Installing Chromium for Puppeteer"
npm install
npx puppeteer browsers install chrome
