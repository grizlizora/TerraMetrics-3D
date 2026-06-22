@echo off
setlocal

echo ========================================
echo   TerraMetrics 3D - Windows Launcher
echo ========================================
echo.

:: Check if node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Node.js is not installed on your system.
    echo [INFO] Downloading a portable version of Node.js...
    if not exist ".node" mkdir ".node"
    
    if not exist ".node\node-v20.14.0-win-x64\node.exe" (
        echo [WAIT] Downloading Node.js 20.14.0 (this may take a minute)...
        powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v20.14.0/node-v20.14.0-win-x64.zip' -OutFile '.node\node.zip'"
        echo [WAIT] Extracting Node.js...
        powershell -Command "Expand-Archive -Path '.node\node.zip' -DestinationPath '.node\' -Force"
        del ".node\node.zip"
    )
    
    echo [INFO] Portable Node.js ready!
    :: Temporarily add portable node to PATH for this script session
    set "PATH=%CD%\.node\node-v20.14.0-win-x64;%PATH%"
) else (
    echo [INFO] Node.js is already installed.
)

echo.
echo [INFO] Installing project dependencies (if needed)...
call npm install --silent

echo [INFO] Starting the local server...
echo [INFO] Your browser should open automatically in a few seconds.
echo.

:: Open the browser
start http://localhost:5173

:: Run the Vite server
call npm run dev

pause
