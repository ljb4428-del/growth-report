# 설치 및 실행 가이드

## 📋 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn

## 🚀 설치 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 설정 (선택사항)

`.env.example` 파일을 참고하여 `.env` 파일을 생성할 수 있습니다. 
하지만 AI API 키는 앱 내에서 직접 설정할 수 있으므로 필수는 아닙니다.

## 💻 실행 방법

### 개발 모드

**터미널 1 - 프론트엔드 (React + Vite):**
```bash
npm run dev
```

**터미널 2 - 백엔드 (Express):**
```bash
npm run server
```

그 다음 브라우저에서 `http://localhost:3000`을 열어주세요.

## 🔑 AI API 키 설정

### OpenAI (GPT-4 Vision)

1. [OpenAI Platform](https://platform.openai.com/)에 접속
2. API Keys 메뉴에서 새 API 키 생성
3. 앱의 "AI 설정" 버튼을 클릭하여 API 키 입력

### Google Gemini

1. [Google AI Studio](https://makersuite.google.com/app/apikey)에 접속
2. API 키 생성
3. 앱의 "AI 설정" 버튼을 클릭하여 API 키 입력

## 📁 데이터 저장 위치

- 비즈니스 데이터: `data/businesses.json`
- 인사이트 데이터: `data/[business-id]/[year]/[month]/[14days|30days].json`
- 설정 데이터: `data/settings.json`
- 업로드된 이미지: `uploads/`

## ⚠️ 주의사항

1. **API 키 보안**: API 키는 로컬에 저장되므로 공개 저장소에 업로드하지 마세요.
2. **데이터 백업**: `data/` 폴더를 정기적으로 백업하세요.
3. **브라우저 호환성**: 최신 버전의 Chrome, Firefox, Edge를 사용하세요.

## 🐛 문제 해결

### 포트가 이미 사용 중인 경우

**프론트엔드 (3000번 포트):**
`vite.config.ts`에서 포트 변경:
```typescript
export default defineConfig({
  server: {
    port: 3001, // 원하는 포트로 변경
  }
})
```

**백엔드 (5000번 포트):**
`server/index.js`에서 포트 변경:
```javascript
const PORT = 5001; // 원하는 포트로 변경
```

### AI 변환이 작동하지 않는 경우

1. API 키가 올바르게 입력되었는지 확인
2. API 키에 충분한 크레딧이 있는지 확인
3. 로그 뷰어(우측 하단 버튼)를 열어 에러 메시지 확인

### 데이터가 표시되지 않는 경우

1. 백엔드 서버가 실행 중인지 확인 (`http://localhost:5000`)
2. 브라우저 콘솔(F12)에서 에러 확인
3. `data/` 폴더의 권한 확인

## 📞 지원

문제가 발생하면 로그 뷰어(우측 하단)의 내용을 복사하여 개발자에게 전달해주세요.

