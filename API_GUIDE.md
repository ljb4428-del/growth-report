# 인사이트 보고서 서버 API 가이드

## 📋 개요

이 서버는 인스타그램 인사이트 데이터를 받아서 자동으로 분석하고 보고서(PDF/PPT)를 생성하는 시스템입니다.

**중요**: 이 서버는 AI 이미지 변환을 하지 않습니다. JSON 데이터를 직접 받아서 처리합니다.

---

## 🚀 주요 기능

### ✅ 구현된 기능
1. **JSON 데이터 수신 및 저장** - 다른 서버에서 추출한 JSON 데이터를 받아 저장
2. **자동 분석** - 증감률, 추세, 추천사항 자동 생성
3. **PDF 보고서 생성** - 전문적인 PDF 형식 보고서
4. **PPT 보고서 생성** - 프레젠테이션용 PPTX 파일
5. **보고서 목록 조회** - 생성된 보고서 관리

### ❌ 제거된 기능
- AI 이미지 변환 (OpenAI/Gemini)
- 이미지 업로드
- AI 설정 관리

---

## 📡 API 엔드포인트

### 1. JSON 데이터 수신

외부 서버에서 GPT/GEMINI로 변환한 JSON 데이터를 받아 저장합니다.

**엔드포인트**: `POST /api/insights/import`

**요청 본문**:
```json
{
  "businessId": "biz-123456",
  "year": 2024,
  "month": 10,
  "period": "14days",
  "data": {
    "views": {
      "reachedAccounts": 5000,
      "totalViews": 12000
    },
    "contentTypes": {
      "posts": 5,
      "stories": 10,
      "reels": 3
    },
    "metrics": {
      "totalViews": 12000,
      "reactions": 850,
      "newFollowers": 120
    },
    "profileActivity": {
      "total": 300,
      "profileVisits": 250,
      "externalLinkTaps": 30,
      "businessAddressTaps": 20
    }
  }
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "id": "insight-1730284800000-abc123",
    "businessId": "biz-123456",
    "year": 2024,
    "month": 10,
    "period": "14days",
    "views": { ... },
    "contentTypes": { ... },
    "metrics": { ... },
    "profileActivity": { ... },
    "createdAt": "2024-10-30T10:00:00.000Z",
    "updatedAt": "2024-10-30T10:00:00.000Z"
  }
}
```

---

### 2. 보고서 생성 (PDF/PPT)

저장된 데이터를 기반으로 보고서를 생성합니다.

**엔드포인트**: `POST /api/reports/generate`

**요청 본문**:
```json
{
  "businessId": "biz-123456",
  "format": "pdf",  // 또는 "ppt"
  "year": 2024,
  "month": 10,
  "period": "14days"  // 옵션: 특정 기간만 선택
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "path": "/reports/report-biz-123456-1730284800000.pdf"
  }
}
```

생성된 보고서는 다음 URL로 다운로드 가능:
```
http://localhost:5000/reports/report-biz-123456-1730284800000.pdf
```

---

### 3. 보고서 분석 데이터 조회

보고서 생성 전에 분석 결과를 미리 확인합니다.

**엔드포인트**: `POST /api/reports/analyze`

**요청 본문**:
```json
{
  "businessId": "biz-123456",
  "year": 2024,
  "month": 10,
  "period": "14days"  // 옵션
}
```

**응답**:
```json
{
  "success": true,
  "data": {
    "insights": [ ... ],  // 원본 데이터
    "analysis": {
      "summary": {
        "totalViews": 12000,
        "reachedAccounts": 5000,
        "reactions": 850,
        "newFollowers": 120
      },
      "growth": {
        "totalViews": "15.50",  // %
        "reachedAccounts": "8.20",
        "reactions": "12.30",
        "newFollowers": "5.60"
      },
      "trends": [
        "조회수가 1,500회 증가했습니다.",
        "신규 팔로워가 10명 증가했습니다."
      ],
      "recommendations": [
        "조회수가 크게 증가했습니다! 현재 전략을 유지하며 더 많은 콘텐츠를 제작하세요.",
        "릴스 콘텐츠 비중을 늘려보세요."
      ]
    }
  }
}
```

---

### 4. 생성된 보고서 목록 조회

**엔드포인트**: `GET /api/reports/list/:businessId`

**응답**:
```json
{
  "success": true,
  "data": [
    {
      "fileName": "report-biz-123456-1730284800000.pdf",
      "url": "/reports/report-biz-123456-1730284800000.pdf",
      "createdAt": "2024-10-30T10:00:00.000Z",
      "size": 45678,
      "format": "pdf"
    }
  ]
}
```

---

### 5. 기존 비즈니스 및 인사이트 API

기존 API들은 그대로 유지됩니다:

- `GET /api/businesses` - 비즈니스 목록
- `POST /api/businesses` - 비즈니스 생성
- `PUT /api/businesses/:id` - 비즈니스 수정
- `DELETE /api/businesses/:id` - 비즈니스 삭제
- `GET /api/insights/:businessId` - 인사이트 조회
- `POST /api/insights` - 인사이트 생성 (기존 방식)
- `PUT /api/insights/:id` - 인사이트 수정

---

## 🔄 워크플로우

### 전체 프로세스

```
1. [외부 서버] 사진 → GPT/GEMINI → JSON 데이터 추출
                    ↓
2. [이 서버] POST /api/insights/import ← JSON 데이터 수신
                    ↓
3. [이 서버] 데이터 저장 (data/{businessId}/{year}/{month}/{period}.json)
                    ↓
4. [이 서버] POST /api/reports/generate → PDF/PPT 생성
                    ↓
5. [사용자] 생성된 보고서 다운로드
```

### 사용 예시

**Step 1**: 비즈니스 생성 (최초 1회)
```bash
curl -X POST http://localhost:5000/api/businesses \
  -H "Content-Type: application/json" \
  -d '{
    "name": "내 인스타그램",
    "description": "개인 계정"
  }'

# 응답: { "success": true, "data": { "id": "biz-abc123", ... } }
```

**Step 2**: JSON 데이터 전송
```bash
curl -X POST http://localhost:5000/api/insights/import \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "biz-abc123",
    "year": 2024,
    "month": 10,
    "period": "14days",
    "data": {
      "views": { "reachedAccounts": 5000, "totalViews": 12000 },
      "contentTypes": { "posts": 5, "stories": 10, "reels": 3 },
      "metrics": { "totalViews": 12000, "reactions": 850, "newFollowers": 120 },
      "profileActivity": { "total": 300, "profileVisits": 250, "externalLinkTaps": 30, "businessAddressTaps": 20 }
    }
  }'
```

**Step 3**: 분석 데이터 확인 (옵션)
```bash
curl -X POST http://localhost:5000/api/reports/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "biz-abc123",
    "year": 2024,
    "month": 10
  }'
```

**Step 4**: PDF 보고서 생성
```bash
curl -X POST http://localhost:5000/api/reports/generate \
  -H "Content-Type: application/json" \
  -d '{
    "businessId": "biz-abc123",
    "format": "pdf",
    "year": 2024,
    "month": 10
  }'

# 응답: { "success": true, "data": { "path": "/reports/report-biz-abc123-1730284800000.pdf" } }
```

**Step 5**: 보고서 다운로드
```
http://localhost:5000/reports/report-biz-abc123-1730284800000.pdf
```

---

## 📊 보고서 내용

### PDF 보고서 포함 내용
1. **표지** - 제목, 기간, 생성일
2. **주요 지표** - 조회수, 도달 계정, 반응, 팔로워
3. **증감률** - 전기 대비 % 변화 (색상 표시)
4. **콘텐츠 유형 분포** - 게시물/스토리/릴스 개수
5. **추세 분석** - 데이터 기반 인사이트
6. **추천사항** - 개선 제안

### PPT 보고서 포함 내용
1. **슬라이드 1** - 표지 (파란 배경)
2. **슬라이드 2** - 주요 지표 표
3. **슬라이드 3** - 증감률 표
4. **슬라이드 4** - 콘텐츠 유형 원형 차트
5. **슬라이드 5** - 추세 분석
6. **슬라이드 6** - 추천사항

---

## 🗂️ 데이터 저장 구조

```
project/
├── data/
│   ├── businesses.json              # 비즈니스 목록
│   └── {businessId}/
│       └── {year}/
│           └── {month}/
│               ├── 14days.json      # 14일 데이터
│               └── 30days.json      # 30일 데이터
│
└── reports/
    ├── report-biz-123-1730284800000.pdf
    └── report-biz-123-1730284800001.pptx
```

---

## 🛠️ 서버 실행

```bash
# 패키지 설치
npm install

# 서버 시작
npm run server

# 서버 주소: http://localhost:5000
```

---

## 🔧 환경 설정

- **포트**: 5000 (변경하려면 `server/index.js`의 `PORT` 수정)
- **데이터 폴더**: `data/`
- **보고서 폴더**: `reports/`

---

## 📝 JSON 데이터 형식

### 필수 필드
```typescript
{
  businessId: string,    // 비즈니스 ID
  year: number,          // 년도
  month: number,         // 월 (1-12)
  period: string,        // "14days" 또는 "30days"
  data: {                // 인사이트 데이터
    views?: {
      reachedAccounts: number,
      totalViews: number
    },
    contentTypes?: {
      posts: number,
      stories: number,
      reels: number
    },
    metrics?: {
      totalViews: number,
      reactions: number,
      newFollowers: number
    },
    profileActivity?: {
      total: number,
      profileVisits: number,
      externalLinkTaps: number,
      businessAddressTaps: number
    }
  }
}
```

### 권장 사항
- 숫자 필드는 모두 `number` 타입으로 전송
- 없는 데이터는 `0`으로 전송하거나 필드 자체를 생략
- `period`는 `"14days"` 또는 `"30days"` 권장

---

## ❓ FAQ

### Q1: 보고서 생성 시 "데이터가 없습니다" 오류가 발생해요
**A**: `/api/insights/import`로 데이터를 먼저 전송했는지 확인하세요.

### Q2: 증감률이 표시되지 않아요
**A**: 증감률은 이전 기간 데이터가 있어야 표시됩니다. 최소 2개 이상의 데이터를 저장하세요.

### Q3: PPT 파일이 열리지 않아요
**A**: MS PowerPoint 2016 이상 또는 호환 프로그램을 사용하세요.

### Q4: 보고서 내용을 수정하고 싶어요
**A**: 현재는 데이터를 수정한 후 보고서를 재생성하는 방식입니다.

### Q5: 한글이 깨져 보여요 (PDF)
**A**: PDFKit은 기본 폰트가 제한적입니다. 추후 한글 폰트를 추가할 예정입니다.

---

## 🔮 향후 개선 예정

- [ ] 한글 폰트 지원 (PDF)
- [ ] 그래프 이미지 삽입 (차트)
- [ ] 보고서 템플릿 커스터마이징
- [ ] 여러 기간 비교 (월별, 분기별)
- [ ] 이메일 전송 기능
- [ ] 보고서 편집 기능

---

## 📞 문의

문제가 발생하면 서버 로그를 확인하세요:
```
[2024-10-30T10:00:00.000Z] [INFO] JSON 데이터 수신 요청 { businessId: 'biz-123', year: 2024, month: 10, period: '14days' }
[2024-10-30T10:00:01.000Z] [SUCCESS] JSON 데이터 저장 완료
```

로그는 실시간으로 콘솔에 출력됩니다.


