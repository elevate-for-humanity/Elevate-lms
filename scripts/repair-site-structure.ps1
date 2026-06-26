# Elevate Site Repair Script
# Purpose: Flatten duplicated folders and sync Monorepo/Standard app conflicts.

$baseDir = "C:\Users\eliza\AccioWork\2026-06-20-20-46-31\Elevate-lms"
$appDir = "$baseDir\app"

function Merge-Folders($src, $dest) {
    if (Test-Path $src) {
        Write-Host "Merging $src into $dest..." -ForegroundColor Cyan
        if (!(Test-Path $dest)) { New-Item -ItemType Directory -Path $dest -Force }
        Get-ChildItem -Path $src -Recurse | ForEach-Object {
            $destPath = $_.FullName.Replace($src, $dest)
            if ($_.PSIsContainer) {
                if (!(Test-Path $destPath)) { New-Item -ItemType Directory -Path $destPath -Force }
            } else {
                Copy-Item -Path $_.FullName -Destination $destPath -Force
            }
        }
        Remove-Item -Path $src -Recurse -Force
        Write-Host "Successfully merged and cleaned $src" -ForegroundColor Green
    }
}

# 1. Flatten Nested Duplicates
Merge-Folders "$appDir\help\help" "$appDir\help"
Merge-Folders "$appDir\platform\platform" "$appDir\platform"
Merge-Folders "$appDir\legal\legal" "$appDir\legal"
Merge-Folders "$appDir\policies\policies" "$appDir\policies"
Merge-Folders "$appDir\ferpa\ferpa" "$appDir\ferpa"
Merge-Folders "$appDir\franchise\franchise" "$appDir\franchise"

# 2. Sync 'apps/app' (Monorepo) into Root 'app' (Standard)
# This ensures work done in the sub-app folder actually appears in the main build.
Merge-Folders "$baseDir\apps\app\curriculum" "$appDir\curriculum"

Write-Host "Site structure repair complete. Please restart your dev server." -ForegroundColor Yellow
