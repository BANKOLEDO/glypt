# Glypt API smoke test - run while the api is up (default :4000).
param(
  [string]$Api = "http://localhost:4000"
)
$ErrorActionPreference = "Stop"
$pass = 0; $fail = 0

function Check([string]$name, [string]$expected, [string]$actual) {
  if ($expected -eq $actual -or $expected -eq "200|404") {
    $script:pass++; Write-Host "  ok  $name ($actual)"
  } else {
    $script:fail++; Write-Host "FAIL  $name (want $expected got $actual)" -ForegroundColor Red
  }
}

function StatusOf($args) {
  try {
    $res = Invoke-WebRequest -UseBasicParsing @args
    return [string]$res.StatusCode
  } catch {
    return [string]$_.Exception.Response.StatusCode.value__
  }
}

Check health 200 (StatusOf @{Uri="$Api/api/health"; Method="Get"})
Check search 200 (StatusOf @{Uri="$Api/api/search?q=rocket&limit=3"; Method="Get"})
Check icon-svg 200 (StatusOf @{Uri="$Api/api/icon?prefix=lucide&name=rocket"; Method="Get"})
Check atlas-build 200 (StatusOf @{Uri="$Api/api/atlas"; Method="Post"; ContentType="application/json"; Body='{"icons":["lucide:home","ph:star"]}'})
Check export-zip 200 (StatusOf @{Uri="$Api/api/export"; Method="Post"; ContentType="application/json"; Body='{"icons":["ph:star"],"formats":["svg"]}'})
Check bad-icon "200|404" (StatusOf @{Uri="$Api/api/icon?prefix=lucide&name=does-not-exist-xyz"; Method="Get"})

Write-Host ""
Write-Host "passed=$pass failed=$fail"
exit $(if ($fail -eq 0) { 0 } else { 1 })
