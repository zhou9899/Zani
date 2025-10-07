#!/bin/bash

echo "🔧 Applying minimal fixes..."

# Fix 1: Always send stickers in AI
sed -i 's/const shouldSendSticker = Math.random() < 0.25;/const shouldSendSticker = true; \/\/ Always send stickers/' helpers/ai.js

# Fix 2: Fix offline responses
sed -i 's/sticker: { sendSticker: false }/sticker: { mood: detectMoodFromText(text), sendSticker: true }/' helpers/ai.js

# Fix 3: Remove any duplicate mentions declarations in handler
sed -i '/const mentions = new Set(/d' handlers/messageHandler.js

# Fix 4: Add mentions declaration in the right place (before sendMessage)
sed -i '/await sock.sendMessage(/i\    const mentions = new Set([sender, ...(context?.mentionedJid || [])]);' handlers/messageHandler.js

echo "✅ Minimal fixes applied"
