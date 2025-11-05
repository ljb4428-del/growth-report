# Growth Report (Instagram Insights Monthly Comparison)

인스타그램 인사이트 데이터를 자동으로 분석하고 월별 비교 보고서를 생성하는 웹 애플리케이션입니다.

## 주요 기능

- 📸 **이미지 업로드**: 인스타그램 인사이트 스크린샷을 드래그 앤 드롭으로 업로드
- 🤖 **AI 자동 변환**: GPT 또는 Gemini를 이용한 이미지→JSON 자동 변환
- ✏️ **수동 데이터 입력**: 데이터를 직접 입력하여 보고서 생성
- 💼 **다중 비즈니스 관리**: 여러 상호명(비즈니스)을 독립적으로 관리
- 📊 **자동 보고서 생성**: 월별 데이터를 기반으로 그래프와 인사이트 제공
- 📈 **14일/30일 비교**: 기간별 데이터 비교 분석
- ✏️ **커스터마이징**: 데이터, 텍스트, 이미지 수정 가능
- 📤 **PDF 내보내기**: PDF 형식으로 보고서 출력
- 🔍 **상세 로그**: 모든 작업 내역 및 에러 추적

## 기술 스택

- **프론트엔드**: React 18 + TypeScript + Tailwind CSS + Vite
- **백엔드**: Node.js + Express
- **차트**: Recharts
- **AI**: OpenAI GPT API / Google Gemini API
- **내보내기**: jsPDF
- **아이콘**: Lucide React

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행 (웹만)
```bash
npm run dev
# 또는
npm run 실행해
# 또는
npm start
```

### 3. 웹 + 서버 동시 실행
```bash
npm run start:both
```

### 4. 브라우저에서 열기
```
http://localhost:5173
```

## 배치 파일 실행 (Windows)

### 웹만 실행 (콘솔 창 표시)
```
START-WEB.bat
```

### 웹 + 서버 실행 (콘솔 창 숨김)
```
START-HIDDEN.bat
```

## 데이터 구조

데이터는 로컬 파일 시스템의 `data/` 폴더에 JSON 형식으로 저장됩니다:

```
data/
├── businesses.json          # 비즈니스 목록
├── settings.json            # AI API 설정
└── [business-id]/          # 각 비즈니스별 폴더
    └── [year]/             # 연도별 폴더
        └── [month]/        # 월별 폴더
            ├── 14days.json # 14일 데이터
            └── 30days.json # 30일 데이터
```

## 라이선스

MIT License
