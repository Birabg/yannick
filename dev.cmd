@echo off
rem Runs the dev server on a temporary Node 22 (better-sqlite3 12.4.1 has no Node 26 build).
cd /d "%~dp0"
npx -y -p node@22 -- npm run dev
