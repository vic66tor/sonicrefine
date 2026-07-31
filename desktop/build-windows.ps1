# SonicRefine Desktop - Windows Build Script
# Run this script in PowerShell as Administrator

Write-Host "================================" -ForegroundColor Cyan
Write-Host " SonicRefine Desktop Builder" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "[1/5] Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "ERROR: Node.js not found!" -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Gray
    exit 1
}
Write-Host "  Found Node.js $nodeVersion" -ForegroundColor Green

# Check npm
Write-Host "[2/5] Checking npm..." -ForegroundColor Yellow
$npmVersion = npm --version 2>$null
Write-Host "  Found npm v$npmVersion" -ForegroundColor Green

# Install dependencies
Write-Host "[3/5] Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  Dependencies installed" -ForegroundColor Green

# Build
Write-Host "[4/5] Building application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  Build complete" -ForegroundColor Green

# Package
Write-Host "[5/5] Creating Windows installer..." -ForegroundColor Yellow
npm run dist
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Packaging failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  Installer created" -ForegroundColor Green

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host " BUILD SUCCESSFUL!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Find your installer at:" -ForegroundColor White
Write-Host "  .\release\SonicRefine-Setup-1.0.0.exe" -ForegroundColor Yellow
Write-Host ""
Write-Host "Or portable version at:" -ForegroundColor White
Write-Host "  .\release\SonicRefine-Portable-1.0.0.exe" -ForegroundColor Yellow
Write-Host ""

# Open release folder
$openFolder = Read-Host "Open release folder? (y/n)"
if ($openFolder -eq "y") {
    explorer .\release
}
