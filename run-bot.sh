#!/data/data/com.termux/files/usr/bin/sh

while true; do
    echo "🟢 Starting bot..."
    node index.js
    echo "🔴 Bot crashed or exited. Restarting in 5 seconds..."
    sleep 5
done
