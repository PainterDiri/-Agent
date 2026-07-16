$ErrorActionPreference = "Stop"

Set-Location -LiteralPath $PSScriptRoot
$envPath = Join-Path $PSScriptRoot ".env"
$examplePath = Join-Path $PSScriptRoot ".env.example"

if (-not (Test-Path -LiteralPath $envPath)) {
    Copy-Item -LiteralPath $examplePath -Destination $envPath
}

Write-Host ""
Write-Host "Xixi Fortune Agent - Volcengine Speech Setup" -ForegroundColor Cyan
Write-Host "Prepare the App ID and Speech API Key shown by the Volcengine speech application."
Write-Host "The API Key is hidden while typing. It stays in local .env only." -ForegroundColor Yellow
Write-Host ""

$appId = Read-Host "Volcengine App ID"
if ([string]::IsNullOrWhiteSpace($appId)) {
    throw "App ID is required."
}

$secureApiKey = Read-Host "Volcengine Speech API Key (hidden)" -AsSecureString
$credential = New-Object System.Management.Automation.PSCredential("volcengine", $secureApiKey)
$apiKey = $credential.GetNetworkCredential().Password
if ([string]::IsNullOrWhiteSpace($apiKey)) {
    throw "API Key is required."
}

$values = [ordered]@{
    "STT_PROVIDER" = "volcengine-recording-v1"
    "TTS_PROVIDER" = "volcengine-tts-v2"
    "VOLCENGINE_APP_ID" = $appId.Trim()
    "VOLCENGINE_API_KEY" = $apiKey.Trim()
    "VOLCENGINE_ASR_SUBMIT_ENDPOINT" = "https://openspeech.bytedance.com/api/v1/vc/submit"
    "VOLCENGINE_ASR_QUERY_ENDPOINT" = "https://openspeech.bytedance.com/api/v1/vc/query"
    "VOLCENGINE_ASR_POLL_MS" = "1200"
    "VOLCENGINE_TTS_ENDPOINT" = "https://openspeech.bytedance.com/api/v3/tts/unidirectional"
    "VOLCENGINE_TTS_RESOURCE_ID" = "seed-tts-2.0"
    "VOLCENGINE_TTS_VOICE_TYPE" = "zh_male_zhuangzhou_uranus_bigtts"
    "VOLCENGINE_TTS_SPEECH_RATE" = "-8"
    "VOLCENGINE_TTS_LOUDNESS_RATE" = "0"
}

$lines = [System.Collections.Generic.List[string]](Get-Content -LiteralPath $envPath -Encoding UTF8)
foreach ($entry in $values.GetEnumerator()) {
    $key = $entry.Key
    $value = $entry.Value
    $pattern = "^\s*" + [regex]::Escape($key) + "\s*="
    $found = $false
    for ($index = 0; $index -lt $lines.Count; $index++) {
        if ($lines[$index] -match $pattern) {
            $lines[$index] = "$key=$value"
            $found = $true
            break
        }
    }
    if (-not $found) {
        $lines.Add("$key=$value")
    }
}

[System.IO.File]::WriteAllLines($envPath, $lines, (New-Object System.Text.UTF8Encoding($false)))
$apiKey = $null
$credential = $null
$secureApiKey = $null

Write-Host ""
Write-Host "Saved to local .env:" -ForegroundColor Green
Write-Host "  ASR: Recording File Recognition 1.0"
Write-Host "  TTS: Speech Synthesis 2.0"
Write-Host "  Voice: Zhuangzhou 2.0 (zh_male_zhuangzhou_uranus_bigtts)"
Write-Host "  Note: existing ASR-specific API Key or Access Token was preserved."
Write-Host ""
Write-Host "Next: double-click the speech test CMD file." -ForegroundColor Cyan
Pause
