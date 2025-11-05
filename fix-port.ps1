# 포트 3000, 5000 점유 프로세스 종료 스크립트

Write-Host "포트 3000, 5000 점유 확인 중..." -ForegroundColor Yellow

$ports = @(3000, 5000)

foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    
    if ($connection) {
        Write-Host "포트 $port 사용 중: PID $($connection.OwningProcess)" -ForegroundColor Red
        Stop-Process -Id $connection.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "✅ 포트 $port 해제됨" -ForegroundColor Green
    } else {
        Write-Host "✅ 포트 $port 사용 가능" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "완료! 이제 start.ps1 또는 서버를 다시 시작하세요." -ForegroundColor Cyan

