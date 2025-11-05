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

// 연속된 월인지 확인
export function isConsecutiveMonths(insights: InsightData[]): boolean {
  if (insights.length <= 1) return true;
  
  const sorted = [...insights].sort((a, b) => {
    const aDate = new Date(a.year, a.month - 1);
    const bDate = new Date(b.year, b.month - 1);
    return aDate.getTime() - bDate.getTime();
  });

  for (let i = 0; i < sorted.length - 1; i++) {
    const currentMonth = sorted[i].month;
    const currentYear = sorted[i].year;
    const nextMonth = sorted[i + 1].month;
    const nextYear = sorted[i + 1].year;
    
    // 다음 월이 현재 월 + 1인지 확인
    let expectedNextMonth = currentMonth + 1;
    let expectedNextYear = currentYear;
    
    if (expectedNextMonth > 12) {
      expectedNextMonth = 1;
      expectedNextYear += 1;
    }
    
    if (nextMonth !== expectedNextMonth || nextYear !== expectedNextYear) {
      return false;
    }
  }
  
  return true;
}

// 월 범위 문자열 생성 (예: "7월~10월")
export function getMonthRangeString(insights: InsightData[]): string {
  if (insights.length === 0) return '';
  
  const sorted = [...insights].sort((a, b) => {
    const aDate = new Date(a.year, a.month - 1);
    const bDate = new Date(b.year, b.month - 1);
    return aDate.getTime() - bDate.getTime();
  });

  const firstMonth = sorted[0].month;
  const lastMonth = sorted[sorted.length - 1].month;
  
  if (firstMonth === lastMonth) return `${firstMonth}월`;
  return `${firstMonth}월~${lastMonth}월`;
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
export function generateInsightText(
  comparison: ComparisonData,
  allInsights?: InsightData[],
  monthRangePrefix?: string
): string {
  const { current, previous, changes } = comparison;
  
  if (!previous) {
    return `${current.year}년 ${current.month}월 데이터가 기록되었습니다. 이전 데이터가 없어 비교 분석을 수행할 수 없습니다.`;
  }

  const insights: string[] = [];
  const prefix = monthRangePrefix ? `${monthRangePrefix} 대비 ` : '전월 대비 ';

  // 연속된 월이고 3개 이상인 경우: 월별 상세 분석
  if (allInsights && allInsights.length >= 3 && monthRangePrefix && !monthRangePrefix.includes('~')) {
    // 순서대로 정렬
    const sorted = [...allInsights].sort((a, b) => {
      const aDate = new Date(a.year, a.month - 1);
      const bDate = new Date(b.year, b.month - 1);
      return aDate.getTime() - bDate.getTime();
    });

    // 인접한 월들의 비교 분석
    for (let i = 1; i < sorted.length; i++) {
      const prevMonth = sorted[i - 1];
      const currMonth = sorted[i];
      const monthChange = calculateChange(currMonth.profileActivity.total, prevMonth.profileActivity.total);
      
      insights.push(
        `${prevMonth.month}월 대비 ${currMonth.month}월 프로필 활동이 ${formatPercent(monthChange.percentage)} ${
          monthChange.trend === 'up' ? '증가' : monthChange.trend === 'down' ? '감소' : '유지'
        }했습니다.`
      );
    }

    // 전체 기간 비교
    const firstMonth = sorted[0];
    const lastMonth = sorted[sorted.length - 1];
    const totalChange = calculateChange(lastMonth.profileActivity.total, firstMonth.profileActivity.total);
    
    insights.push(
      `전체적으로 ${firstMonth.month}월 대비 ${lastMonth.month}월에 프로필 활동이 ${formatPercent(totalChange.percentage)} ${
        totalChange.trend === 'up' ? '증가' : totalChange.trend === 'down' ? '감소' : '유지'
      }했습니다.`
    );

    return insights.join(' ');
  }

  // 기본 분석 (2개월 비교 또는 비연속 월)
  // 프로필 활동 분석 (가장 중요)
  const profileChange = changes.profileTotal;
  if (profileChange) {
    insights.push(
      `프로필 활동이 ${prefix}${formatPercent(profileChange.percentage)} ${
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

