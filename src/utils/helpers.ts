import { InsightData, ComparisonData } from '../types';
import { format } from 'date-fns';

// 날짜 포맷팅
export function formatDate(date: string | Date, formatStr: string = 'yyyy년 MM월'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, formatStr);
}

// 숫자 포맷팅
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(num);
}

// 퍼센트 포맷팅
export function formatPercent(num: number, decimals: number = 1): string {
  return `${num >= 0 ? '+' : ''}${num.toFixed(decimals)}%`;
}

// 월 문자열 생성 (YYYY-MM)
export function getMonthString(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

// 월 문자열 파싱
export function parseMonthString(monthStr: string): { year: number; month: number } {
  const [year, month] = monthStr.split('-').map(Number);
  return { year, month };
}

// 증감률 계산
export function calculateChange(current: number, previous: number): {
  value: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
} {
  const value = current - previous;
  const percentage = previous === 0 ? 0 : (value / previous) * 100;
  
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (percentage > 0.5) trend = 'up';
  else if (percentage < -0.5) trend = 'down';
  
  return { value, percentage, trend };
}

// 비교 데이터 생성
export function createComparisonData(
  current: InsightData,
  previous?: InsightData
): ComparisonData {
  const changes: ComparisonData['changes'] = {};

  if (previous) {
    // 조회 관련
    changes.reachedAccounts = calculateChange(
      current.views.reachedAccounts,
      previous.views.reachedAccounts
    );
    changes.totalViews = calculateChange(
      current.views.totalViews,
      previous.views.totalViews
    );

    // 콘텐츠 유형
    changes.posts = calculateChange(
      current.contentTypes.posts,
      previous.contentTypes.posts
    );
    changes.stories = calculateChange(
      current.contentTypes.stories,
      previous.contentTypes.stories
    );
    changes.reels = calculateChange(
      current.contentTypes.reels,
      previous.contentTypes.reels
    );

    // 기타 지표
    changes.metricsViews = calculateChange(
      current.metrics.totalViews,
      previous.metrics.totalViews
    );
    changes.reactions = calculateChange(
      current.metrics.reactions,
      previous.metrics.reactions
    );
    changes.newFollowers = calculateChange(
      current.metrics.newFollowers,
      previous.metrics.newFollowers
    );

    // 프로필 활동
    changes.profileTotal = calculateChange(
      current.profileActivity.total,
      previous.profileActivity.total
    );
    changes.profileVisits = calculateChange(
      current.profileActivity.profileVisits,
      previous.profileActivity.profileVisits
    );
    changes.externalLinkTaps = calculateChange(
      current.profileActivity.externalLinkTaps,
      previous.profileActivity.externalLinkTaps
    );
    changes.businessAddressTaps = calculateChange(
      current.profileActivity.businessAddressTaps,
      previous.profileActivity.businessAddressTaps
    );
  }

  return { current, previous, changes };
}

// 트렌드 아이콘 가져오기
export function getTrendIcon(trend: 'up' | 'down' | 'stable'): string {
  switch (trend) {
    case 'up':
      return '📈';
    case 'down':
      return '📉';
    default:
      return '➡️';
  }
}

// 트렌드 색상 가져오기
export function getTrendColor(trend: 'up' | 'down' | 'stable'): string {
  switch (trend) {
    case 'up':
      return 'text-green-600';
    case 'down':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}

// 인사이트 분석 텍스트 생성
export function generateInsightText(comparison: ComparisonData): string {
  const { current, previous, changes } = comparison;
  
  if (!previous) {
    return `${current.year}년 ${current.month}월 데이터가 기록되었습니다. 이전 데이터가 없어 비교 분석을 수행할 수 없습니다.`;
  }

  const insights: string[] = [];

  // 프로필 활동 분석 (가장 중요)
  const profileChange = changes.profileTotal;
  if (profileChange) {
    insights.push(
      `프로필 활동이 전월 대비 ${formatPercent(profileChange.percentage)} ${
        profileChange.trend === 'up' ? '증가' : profileChange.trend === 'down' ? '감소' : '유지'
      }했습니다 (${formatNumber(profileChange.value)}).`
    );
  }

  // 새 팔로워 분석
  const followerChange = changes.newFollowers;
  if (followerChange) {
    insights.push(
      `새 팔로워가 ${formatNumber(current.metrics.newFollowers)}명으로 ${
        followerChange.trend === 'up' ? '증가' : followerChange.trend === 'down' ? '감소' : '유지'
      }했습니다 (${formatPercent(followerChange.percentage)}).`
    );
  }

  // 조회수 분석
  const viewChange = changes.totalViews;
  if (viewChange) {
    insights.push(
      `도달한 계정이 ${formatNumber(current.views.reachedAccounts)}개로 ${
        viewChange.trend === 'up' ? '증가세' : viewChange.trend === 'down' ? '감소세' : '안정세'
      }를 보였습니다.`
    );
  }

  // 콘텐츠 유형별 분석
  const reelsChange = changes.reels;
  if (reelsChange && reelsChange.percentage > 10) {
    insights.push(
      `릴스 조회수가 ${formatPercent(reelsChange.percentage)} 증가하며 가장 좋은 성과를 보였습니다.`
    );
  }

  return insights.join(' ');
}

// 파일 크기 포맷팅
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

// 데이터 검증
export function validateInsightData(data: Partial<InsightData>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.businessId) errors.push('비즈니스 ID가 필요합니다.');
  if (!data.year || data.year < 2000) errors.push('올바른 년도가 필요합니다.');
  if (!data.month || data.month < 1 || data.month > 12) errors.push('올바른 월이 필요합니다.');
  if (!data.period || !['14days', '30days'].includes(data.period)) {
    errors.push('기간은 14days 또는 30days여야 합니다.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

