@echo off
setlocal EnableDelayedExpansion

REM Alfanumrik Development Environment Setup Script for Windows
REM This script automates the setup process for the Alfanumrik project

echo.
echo 🚀 Setting up Alfanumrik Development Environment...
echo =================================================
echo.

REM Function to check Node.js installation
:check_node
echo [INFO] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=1 delims=v" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=1 delims=." %%i in ("%NODE_VERSION:~1%") do set MAJOR_VERSION=%%i

if %MAJOR_VERSION% lss 18 (
    echo [ERROR] Node.js version %MAJOR_VERSION% is not supported. Please upgrade to Node.js 18+
    pause
    exit /b 1
)

echo [SUCCESS] Node.js %NODE_VERSION% is installed
goto check_npm

REM Function to check npm installation
:check_npm
echo [INFO] Checking npm installation...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed. Please install npm.
    pause
    exit /b 1
)

for /f %%i in ('npm --version') do set NPM_VERSION=%%i
echo [SUCCESS] npm %NPM_VERSION% is installed
goto install_dependencies

REM Function to install dependencies
:install_dependencies
echo [INFO] Installing project dependencies...
npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [SUCCESS] Dependencies installed successfully
goto setup_env_file

REM Function to setup environment file
:setup_env_file
echo [INFO] Setting up environment variables...

if exist ".env.local" (
    echo [WARNING] .env.local already exists. Skipping environment setup.
    goto verify_setup
)

if exist ".env.example" (
    copy ".env.example" ".env.local" >nul
    echo [SUCCESS] Created .env.local from template
    echo [WARNING] Please edit .env.local and add your Gemini API key
) else (
    echo [ERROR] .env.example not found. Creating basic .env.local
    (
        echo # Alfanumrik Environment Variables
        echo GEMINI_API_KEY=your_gemini_api_key_here
        echo NODE_ENV=development
        echo VITE_APP_NAME=Alfanumrik
        echo VITE_APP_VERSION=0.0.0
    ) > ".env.local"
    echo [SUCCESS] Created basic .env.local file
)
goto verify_setup

REM Function to verify setup
:verify_setup
echo [INFO] Verifying setup...

if not exist ".env.local" (
    echo [ERROR] .env.local file not found
    goto setup_failed
)

if not exist "node_modules" (
    echo [ERROR] node_modules directory not found. Dependencies may not be installed.
    goto setup_failed
)

echo [SUCCESS] Setup verification completed
goto setup_success

:setup_failed
echo.
echo [ERROR] Setup verification failed
pause
exit /b 1

:setup_success
echo.
echo =================================================
echo [SUCCESS] Setup completed successfully! 🎉
echo.
echo Next steps:
echo 1. Edit .env.local and add your Gemini API key
echo 2. Run 'npm run dev' to start the development server
echo 3. Open http://localhost:3000 in your browser
echo.
echo [WARNING] Don't forget to get your Gemini API key from https://ai.studio/
echo.
echo Press any key to continue...
pause >nul
exit /b 0