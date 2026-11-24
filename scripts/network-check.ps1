# Verify TCP + UDP ports required by UNO ULTRA
$tcpPorts = @(80, 443, 3000, 5173, 5432, 6379)
$udpPorts = @(3478, 5349, 19302, 19312, 49160, 49200)

Write-Host "=== TCP Ports ===" -ForegroundColor Cyan
foreach ($p in $tcpPorts) {
    $conn = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue
    if ($conn) { Write-Host "TCP $p : IN USE" -ForegroundColor Yellow }
    else       { Write-Host "TCP $p : free"   -ForegroundColor Green }
}

Write-Host "`n=== UDP Ports ===" -ForegroundColor Cyan
foreach ($p in $udpPorts) {
    $conn = Get-NetUDPEndpoint -LocalPort $p -ErrorAction SilentlyContinue
    if ($conn) { Write-Host "UDP $p : IN USE" -ForegroundColor Yellow }
    else       { Write-Host "UDP $p : free"   -ForegroundColor Green }
}