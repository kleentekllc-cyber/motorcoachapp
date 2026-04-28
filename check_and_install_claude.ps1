# Check and Install Claude CLI Script

Write-Host "=== Checking Node.js and npm installation ===" -ForegroundColor Cyan

# Check Node.js
try {
    $nodeVersion = node --version 2>$null
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js is NOT installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version 2>$null
    Write-Host "npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "npm is NOT installed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Installing Claude CLI (@anthropic-ai/claude-code) ===" -ForegroundColor Cyan
npm install -g @anthropic-ai/claude-code

Write-Host "`n=== Checking global npm packages ===" -ForegroundColor Cyan
npm list -g --depth=0 | Select-String "claude"

Write-Host "`n=== Checking if claude command is available ===" -ForegroundColor Cyan
try {
    $claudeVersion = claude --version 2>$null
    Write-Host "Claude CLI installed successfully!" -ForegroundColor Green
    Write-Host "Version: $claudeVersion" -ForegroundColor Green
} catch {
    Write-Host "Claude command not found. Checking npm global bin path..." -ForegroundColor Yellow
    $npmBin = npm bin -g 2>$null
    Write-Host "Global npm bin path: $npmBin" -ForegroundColor Yellow
    Write-Host "Adding npm global bin path to user PATH environment variable..." -ForegroundColor Yellow
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -notlike "*$npmBin*") {
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$npmBin", "User")
        Write-Host "Added $npmBin to PATH. You may need to restart your terminal for changes to take effect." -ForegroundColor Green
    } else {
        Write-Host "PATH already contains the npm bin path." -ForegroundColor Green
    }
}

Write-Host "`n=== Installation Complete ===" -ForegroundColor Cyan
Write-Host "Try running: claude --help" -ForegroundColor Yellow
