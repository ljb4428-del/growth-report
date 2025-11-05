# Insight Report 실행 스크립트
# PowerShell에서 실행: .\start.ps1

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Insight Report 시작 중..." -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# 프로젝트 디렉토리 확인
if (-not (Test-Path "package.json")) {
    Write-Host "❌ 오류: package.json을 찾을 수 없습니다." -ForegroundColor Red
    Write-Host "프로젝트 폴더에서 실행해주세요." -ForegroundColor Red
    exit 1
}

# Node 모듈 확인
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 의존성 설치 중..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 의존성 설치 실패" -ForegroundColor Red
        exit 1
    }
}

# 데이터 폴더 생성
if (-not (Test-Path "data")) {
    New-Item -ItemType Directory -Path "data" | Out-Null
    Write-Host "✅ data 폴더 생성됨" -ForegroundColor Green
}

if (-not (Test-Path "uploads")) {
    New-Item -ItemType Directory -Path "uploads" | Out-Null
    Write-Host "✅ uploads 폴더 생성됨" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 서버를 시작합니다..." -ForegroundColor Green
Write-Host ""
Write-Host "다음 두 개의 창이 열립니다:" -ForegroundColor Yellow
Write-Host "  1️⃣  프론트엔드 (Vite) - 포트 3000" -ForegroundColor Cyan
Write-Host "  2️⃣  백엔드 (Express) - 포트 5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  서버를 종료하려면 두 터미널에서 Ctrl+C를 누르세요" -ForegroundColor Yellow
Write-Host ""
Write-Host "🌐 브라우저가 자동으로 열립니다..." -ForegroundColor Green
Write-Host ""

# 백엔드 서버를 새 PowerShell 창에서 실행
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host '🔧 백엔드 서버 시작 중...' -ForegroundColor Cyan; npm run server"

# 잠시 대기 (백엔드가 먼저 시작되도록)
Start-Sleep -Seconds 2

# 프론트엔드 서버를 새 PowerShell 창에서 실행
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; Write-Host '⚛️  프론트엔드 서버 시작 중...' -ForegroundColor Cyan; npm run dev"

# 서버 시작 대기
Start-Sleep -Seconds 5

# 브라우저 열기
Write-Host "🌐 브라우저를 여는 중..." -ForegroundColor Green
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  ✅ 서버가 실행되었습니다!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 사용 방법:" -ForegroundColor Yellow
Write-Host "  1. 비즈니스(상호명) 생성" -ForegroundColor White
Write-Host "  2. AI 설정에서 API 키 입력" -ForegroundColor White
Write-Host "  3. 데이터 업로드 탭에서 이미지 업로드" -ForegroundColor White
Write-Host "  4. 보고서 생성 탭에서 보고서 확인" -ForegroundColor White
Write-Host ""
Write-Host "❓ 문제가 발생하면 TROUBLESHOOTING.md를 참고하세요" -ForegroundColor Cyan
Write-Host ""

# 이 창은 닫지 않고 유지
Write-Host "이 창을 닫지 마세요. 서버 상태를 모니터링합니다..." -ForegroundColor Yellow
Write-Host "서버를 종료하려면 열린 두 개의 터미널 창을 닫으세요." -ForegroundColor Yellow

# 무한 대기 (창 유지)
while ($true) {
    Start-Sleep -Seconds 1
}

