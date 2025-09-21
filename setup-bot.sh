#!/bin/bash

echo "🚀 Setting up Zhou WhatsApp bot for Termux..."

# Step 1: Clean old installs
echo "🧹 Cleaning old node_modules and cache..."
rm -rf node_modules package-lock.json
npm cache clean --force

# Step 2: Install dependencies with safe peer resolution
echo "⬇️ Installing dependencies..."
npm install --legacy-peer-deps

# Step 3: Create temp folder if it doesn't exist
TEMP_DIR="/data/data/com.termux/files/home/bot/temp"
if [ ! -d "$TEMP_DIR" ]; then
  echo "📂 Creating temp folder..."
  mkdir -p "$TEMP_DIR"
fi

# Step 4: Done
echo "✅ Setup complete! Run your bot with: node index.js"
