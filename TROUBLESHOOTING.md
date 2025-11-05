# 문제 해결 가이드

## 🔧 주요 오류 해결

### 1. "Cannot find module" 오류

**증상**: 모듈을 찾을 수 없다는 오류 메시지

**해결방법**:
```bash
# 모든 의존성 다시 설치
rm -rf node_modules package-lock.json
npm install
```

### 2. 포트 충돌 오류

**증상**: `EADDRINUSE` 또는 "포트가 이미 사용 중" 오류

**해결방법**:

**Windows PowerShell**:
```powershell
# 3000번 포트 사용 중인 프로세스 찾기
Get-NetTCPConnection -LocalPort 3000 | Select-Object -Property LocalAddress, LocalPort, State, OwningProcess

# 프로세스 종료 (PID는 위에서 확인한 번호)
Stop-Process -Id [PID]

# 5000번 포트도 동일하게
Get-NetTCPConnection -LocalPort 5000 | Select-Object -Property LocalAddress, LocalPort, State, OwningProcess
Stop-Process -Id [PID]
```

또는 포트 변경:
- `vite.config.ts`에서 프론트엔드 포트 변경
- `server/index.js`에서 백엔드 포트 변경

### 3. TypeScript 컴파일 오류

**증상**: 타입 관련 오류 메시지

**해결방법**:
```bash
# TypeScript 캐시 삭제
rm -rf node_modules/.vite
npm run dev
```

### 4. AI API 호출 실패

**증상**: 이미지 업로드 후 "AI 변환 실패" 메시지

**원인 및 해결**:

#### OpenAI API
- API 키가 올바른지 확인
- [OpenAI 사용량 확인](https://platform.openai.com/usage)
- GPT-4 Vision 모델 접근 권한 확인
- API 크레딧 잔액 확인

#### Gemini API
- 현재 기본 구현만 되어 있음 (실제 API 호출 미구현)
- OpenAI 사용 권장

### 5. 데이터가 표시되지 않음

**증상**: 업로드한 데이터가 목록에 나타나지 않음

**해결방법**:
1. 브라우저 콘솔(F12) 확인
2. 백엔드 서버가 실행 중인지 확인
3. `data/` 폴더 권한 확인
4. 로그 뷰어(우측 하단) 확인

### 6. 그래프가 표시되지 않음

**증상**: 보고서에 그래프가 나타나지 않음

**원인 및 해결**:
- 최소 2개 이상의 데이터가 있어야 선 그래프 표시됨
- 보고서 설정에서 "그래프 포함" 옵션 확인
- 브라우저 콘솔에서 recharts 관련 오류 확인

### 7. PDF/PPT 내보내기 실패

**증상**: "보고서를 내보내는 중" 후 오류 발생

**해결방법**:
- 팝업 차단 해제
- 브라우저 캐시 삭제
- 다른 브라우저에서 시도
- 보고서 내용이 너무 길지 않은지 확인

## 🐛 디버깅 방법

### 1. 로그 확인
우측 하단의 터미널 아이콘 버튼을 클릭하여 상세 로그 확인

### 2. 브라우저 개발자 도구
- F12 키로 개발자 도구 열기
- Console 탭에서 에러 메시지 확인
- Network 탭에서 API 요청 실패 확인

### 3. 서버 로그
백엔드 서버를 실행한 터미널에서 로그 확인

### 4. 데이터 파일 직접 확인
```bash
# 비즈니스 목록
cat data/businesses.json

# 특정 비즈니스의 데이터
cat data/[business-id]/[year]/[month]/30days.json
```

## 💾 데이터 백업 및 복구

### 백업
```bash
# data 폴더 전체 백업
cp -r data data_backup_$(date +%Y%m%d)

# Windows
xcopy data data_backup /E /I
```

### 복구
```bash
# 백업에서 복구
rm -rf data
cp -r data_backup_20240101 data

# Windows
rmdir /S data
xcopy data_backup data /E /I
```

## 🔄 완전 재설치

모든 방법이 실패할 경우:

```bash
# 1. 모든 의존성 삭제
rm -rf node_modules package-lock.json

# 2. 캐시 삭제
rm -rf node_modules/.vite
rm -rf .vite

# 3. 의존성 재설치
npm install

# 4. 서버 재시작
npm run dev  # 터미널 1
npm run server  # 터미널 2
```

## 📞 추가 도움이 필요한 경우

1. 로그 뷰어(우측 하단)에서 로그 복사
2. 브라우저 콘솔 스크린샷
3. 서버 터미널 로그
4. 발생한 오류의 정확한 상황 설명

이 정보들을 개발자에게 전달해주세요.

## ✅ 체크리스트

프로젝트가 제대로 작동하지 않을 때 확인할 사항:

- [ ] Node.js 18 이상 설치 확인 (`node --version`)
- [ ] npm 설치 확인 (`npm --version`)
- [ ] 의존성 설치 완료 (`npm install`)
- [ ] 두 개의 터미널에서 서버 실행
  - [ ] 프론트엔드: `npm run dev`
  - [ ] 백엔드: `npm run server`
- [ ] 브라우저에서 http://localhost:3000 접속
- [ ] AI API 키 설정 완료
- [ ] 방화벽/안티바이러스가 포트 차단하지 않는지 확인

