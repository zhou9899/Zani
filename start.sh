#!/data/data/com.termux/files/usr/bin/bash
cd ~/bot
nohup node index.js > bot.log 2>&1 &
echo "✅ Bot started in background!"

