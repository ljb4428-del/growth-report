@echo off
chcp 65001 > nul
title Insight Report - 실행 스크립트

echo ==================================
echo   Insight Report 시작 중...
echo ==================================
echo.

REM 프로젝트 디렉토리 확인
if not exist "package.json" (
    echo ❌ 오류: package.json을 찾을 수 없습니다.
    echo 프로젝트 폴더에서 실행해주세요.
    pause
    exit /b 1
)

REM Node 모듈 확인
if not exist "node_modules" (
    echo 📦 의존성 설치 중...
    call npm install
    if errorlevel 1 (
        echo ❌ 의존성 설치 실패
        pause
        exit /b 1
    )
)

REM 데이터 폴더 생성
if not exist "data" (
    mkdir data
    echo ✅ data 폴더 생성됨
)

if not exist "uploads" (
    mkdir uploads
    echo ✅ uploads 폴더 생성됨
)

echo.
echo 🚀 서버를 시작합니다...
echo.
echo 다음 두 개의 창이 열립니다:
echo   1️⃣  백엔드 (Express) - 포트 5000
echo   2️⃣  프론트엔드 (Vite) - 포트 3000
echo.
echo ⚠️  서버를 종료하려면 두 터미널에서 Ctrl+C를 누르세요
echo.

REM 백엔드 서버 실행
start "Insight Report - 백엔드" cmd /k "echo 🔧 백엔드 서버 시작 중... && npm run server"

REM 잠시 대기
timeout /t 2 /nobreak > nul

REM 프론트엔드 서버 실행
start "Insight Report - 프론트엔드" cmd /k "echo ⚛️  프론트엔드 서버 시작 중... && npm run dev"

REM 서버 시작 대기
timeout /t 5 /nobreak > nul

REM 브라우저 열기
echo 🌐 브라우저를 여는 중...
start http://localhost:3000

echo.
echo ==================================
echo   ✅ 서버가 실행되었습니다!
echo ==================================
echo.
echo 📝 사용 방법:
echo   1. 비즈니스(상호명) 생성
echo   2. AI 설정에서 API 키 입력
echo   3. 데이터 업로드 탭에서 이미지 업로드
echo   4. 보고서 생성 탭에서 보고서 확인
echo.
echo ❓ 문제가 발생하면 TROUBLESHOOTING.md를 참고하세요
echo.
echo 서버를 종료하려면 열린 두 개의 터미널 창을 닫으세요.
echo.
pause

