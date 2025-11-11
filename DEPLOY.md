# 배포 가이드

이 프로젝트를 Render.com에 배포하는 방법을 안내합니다.

## 🚀 Render.com 배포 방법

### 1. GitHub 저장소 준비

1. GitHub에 코드를 푸시합니다:
```bash
git add .
git commit -m "배포 준비 완료"
git push origin main
```

### 2. Render.com에서 서비스 생성

1. [Render.com](https://render.com)에 가입/로그인
2. "New +" 버튼 클릭 → "Web Service" 선택
3. GitHub 저장소 연결
4. 다음 설정 입력:
   - **Name**: `insight-report` (원하는 이름)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start` (또는 `NODE_ENV=production node server/index.js`)
   - **Instance Type**: Free (또는 원하는 플랜)
   - **Auto-Deploy**: Yes (GitHub 푸시 시 자동 배포)

### 3. 환경 변수 설정

Render.com 대시보드에서 환경 변수 추가:
- `NODE_ENV`: `production` (자동 설정됨)
- `PORT`: Render가 자동으로 할당 (변경 불필요)

**중요**: Render.com은 자동으로 `PORT` 환경 변수를 설정하므로 별도 설정이 필요 없습니다.

### 4. 디스크 마운트 (선택사항)

데이터 영구 저장을 위해:
1. Settings → Disks 섹션
2. "Add Disk" 클릭
3. Mount Path: `/opt/render/project/src/data`
4. Size: 1GB (필요에 따라 조정)

업로드 이미지 저장을 위해:
1. "Add Disk" 클릭
2. Mount Path: `/opt/render/project/src/uploads`
3. Size: 1GB

### 5. 배포 완료

배포가 완료되면 Render.com에서 제공하는 URL로 접속할 수 있습니다.

예: `https://insight-report.onrender.com`

## 🔧 다른 플랫폼 배포

### Railway.app

1. [Railway.app](https://railway.app)에 가입
2. "New Project" → GitHub 저장소 연결
3. 자동으로 감지되지만, 필요시:
   - Build Command: `npm install && npm run build`
   - Start Command: `NODE_ENV=production node server/index.js`

### Heroku

1. [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) 설치
2. Heroku 앱 생성:
```bash
heroku create your-app-name
```
3. 환경 변수 설정:
```bash
heroku config:set NODE_ENV=production
```
4. 배포:
```bash
git push heroku main
```

## 📝 주의사항

1. **데이터 영구 저장**: 무료 플랫폼은 일정 시간 비활성 시 데이터가 삭제될 수 있습니다. 중요한 데이터는 정기적으로 백업하세요.

2. **파일 업로드 제한**: 무료 플랫폼은 파일 크기 제한이 있을 수 있습니다.

3. **환경 변수**: API 키 등 민감한 정보는 환경 변수로 관리하세요.

4. **CORS 설정**: 필요시 서버의 CORS 설정을 조정하세요.

## 🐛 문제 해결

### 빌드 실패
- Node.js 버전 확인 (18 이상 필요)
- `package.json`의 의존성 확인
- 빌드 로그에서 구체적인 오류 메시지 확인

### 서버가 시작되지 않음
- **포트 바인딩 오류**: 서버가 `0.0.0.0`으로 바인딩되는지 확인 (수정 완료)
- **Start Command 확인**: `npm start` 또는 `NODE_ENV=production node server/index.js` 사용
- 서버 로그에서 오류 메시지 확인

### 이미지가 표시되지 않음
- `/uploads` 경로가 올바르게 서빙되는지 확인
- 파일 권한 확인
- 업로드 디렉토리가 존재하는지 확인

### API 요청 실패
- CORS 설정 확인
- 환경 변수 확인
- API 경로가 `/api`로 시작하는지 확인

### 정적 파일이 로드되지 않음
- `dist` 폴더가 빌드되었는지 확인
- `FRONTEND_BUILD_PATH` 환경 변수 확인 (기본값: `../dist`)
- 서버 로그에서 경로 오류 확인

### Render.com 특정 오류
- **"Service failed to start"**: Start Command가 올바른지 확인
- **"Build failed"**: Build Command 실행 확인, Node.js 버전 확인
- **"Port already in use"**: Render가 자동으로 PORT를 할당하므로 문제 없어야 함

