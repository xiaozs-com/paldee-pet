# Regenerate application icons and monochrome tray templates from the Type poster.
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)

function Invoke-Checked([string]$Program, [string[]]$Arguments) {
    & $Program @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Program failed ($LASTEXITCODE)" }
}

# Crop to the visible character, then leave approximately 3% padding per edge.
Invoke-Checked ffmpeg @('-hide_banner', '-loglevel', 'error', '-y', '-i', 'public/mascots/type.png',
    '-vf', 'crop=675:680:94:53,pad=708:708:(ow-iw)/2:(oh-ih)/2:color=black@0,scale=1024:1024:flags=lanczos,format=rgba',
    '-frames:v', '1', '-update', '1', 'assets/octop-app-icon.png')

Invoke-Checked node @('node_modules/@tauri-apps/cli/tauri.js', 'icon', 'assets/octop-app-icon.png', '--output', '.cache/taiji-app-icons')
$generatedRoot = (Resolve-Path '.cache/taiji-app-icons').Path
Get-ChildItem -LiteralPath $generatedRoot -File -Recurse | ForEach-Object {
    $relative = [System.IO.Path]::GetRelativePath($generatedRoot, $_.FullName)
    $destination = Join-Path 'src-tauri/icons' $relative
    New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
    Copy-Item -LiteralPath $_.FullName -Destination $destination
}

foreach ($entry in @(@(32, 'tray-template.png'), @(64, 'tray-template@2x.png'))) {
    $size = $entry[0]
    $filter = "format=rgba,lut=a='if(gte(val,32),255,0)',colorchannelmixer=rr=0:gg=0:bb=0,scale=${size}:${size}:flags=lanczos"
    Invoke-Checked ffmpeg @('-hide_banner', '-loglevel', 'error', '-y', '-i', 'assets/octop-app-icon.png',
        '-vf', $filter, '-frames:v', '1', '-update', '1', (Join-Path 'src-tauri/icons' $entry[1]))
}
