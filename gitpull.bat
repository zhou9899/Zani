@echo off
echo === Pulling latest changes from GitHub ===
git reset --hard
git clean -fd
git pull origin main
echo === Update complete! ===
pause
