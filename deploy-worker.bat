@echo off
echo ==========================================
echo Cloudflare Worker Deploy Script
echo ==========================================
echo.

REM Check if wrangler is installed
where wrangler >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing wrangler...
    npm install -g wrangler
)

echo.
echo Please enter your Cloudflare API Token:
echo (Get it from: https://dash.cloudflare.com/profile/api-tokens)
set /p CF_TOKEN="API Token: "

echo.
echo Deploying Worker...
set CLOUDFLARE_API_TOKEN=%CF_TOKEN%
wrangler deploy proxy-worker.js --name situation-03

echo.
echo ==========================================
echo Deployment complete!
echo ==========================================
pause
