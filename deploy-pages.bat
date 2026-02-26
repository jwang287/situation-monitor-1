@echo off
echo ==========================================
echo Cloudflare Pages Deploy Script
echo ==========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

echo.
echo Building project...
npm run build

echo.
echo Please enter your Cloudflare API Token:
echo (Get it from: https://dash.cloudflare.com/profile/api-tokens)
echo Required permissions: Account:Cloudflare Pages:Edit, Zone:Read
echo.
set /p CF_TOKEN="API Token: "

echo.
echo Deploying to Cloudflare Pages...
set CLOUDFLARE_API_TOKEN=%CF_TOKEN%
npx wrangler pages deploy build --project-name=situation-monitor

echo.
echo ==========================================
echo Deployment complete!
echo ==========================================
pause
