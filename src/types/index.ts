// 인스타그램 인사이트 데이터 타입
export interface InsightData {
  id: string;
  businessId: string;
  year: number;
  month: number;
  period: '14days' | '30days';
  createdAt: string;
  updatedAt: string;
  
  // 인스타그램 계정 정보
  businessName?: string; // 업체명
  instagramId?: string; // 인스타그램 계정 ID
  
  // 조회 관련
  views: {
    reachedAccounts: number;
    totalViews: number;
  };
  
  // 콘텐츠 유형별
  contentTypes: {
    posts: number;
    stories: number;
    reels: number;
  };
  
  // 기타 지표
  metrics: {
    totalViews: number;
    reactions: number;
    newFollowers: number;
  };
  
  // 프로필 활동 (가장 중요)
  profileActivity: {
    total: number;
    profileVisits: number;
    externalLinkTaps: number;
    businessAddressTaps: number;
  };
  
  // 원본 인사이트 스크린샷
  originalImages?: string[];
  
  // 사용자 추가 이미지
  customImages?: CustomImage[];
  
  // 사용자 메모/설명
  notes?: string;
}

export interface CustomImage {
  id: string;
  url: string;
  caption?: string;
  section: string; // 어느 섹션에 추가되었는지
}

// 비즈니스(상호명) 타입
export interface Business {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
}

// AI 설정 타입
export interface AISettings {
  provider: 'openai' | 'gemini' | 'ocrspace';
  apiKey: string;
}

// 보고서 설정 타입
export interface ReportSettings {
  businessId: string;
  selectedMonths: string[]; // 'YYYY-MM' 형식
  selectedPeriods: ('14days' | '30days')[];
  includeGraphs: {
    lineChart: boolean;
    barChart: boolean;
  };
  includeSections: {
    views: boolean;
    contentTypes: boolean;
    metrics: boolean;
    profileActivity: boolean;
  };
  customTitle?: string;
  customNotes?: string;
}

// 로그 타입
export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  action: string;
  details?: any;
  error?: string;
  stackTrace?: string;
}

// API 응답 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 비교 데이터 타입
export interface ComparisonData {
  current: InsightData;
  previous?: InsightData;
  changes: {
    [key: string]: {
      value: number;
      percentage: number;
      trend: 'up' | 'down' | 'stable';
    };
  };
}

// 차트 데이터 타입
export interface ChartData {
  month: string;
  period: string;
  [key: string]: number | string;
}

