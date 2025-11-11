import { Business, InsightData, ReportSettings } from '../types';
import { formatDate, formatNumber, createComparisonData, generateInsightText, isConsecutiveMonths, getMonthRangeString, mergeInsights } from '../utils/helpers';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import LineChartComponent from './charts/LineChartComponent';
import BarChartComponent from './charts/BarChartComponent';
import PhoneFrame from './PhoneFrame';

interface Props {
  business: Business;
  insights: InsightData[];
  settings: ReportSettings;
}

export default function ReportContent({ business, insights, settings }: Props) {
  if (insights.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-600">선택된 데이터가 없습니다.</p>
      </div>
    );
  }

  // 최신 데이터와 이전 데이터
  const sortedInsights = [...insights].sort((a, b) => {
    const aDate = new Date(a.year, a.month - 1);
    const bDate = new Date(b.year, b.month - 1);
    return bDate.getTime() - aDate.getTime();
  });

  const latestInsight = sortedInsights[0];
  
  // 연속된 월인지 확인
  const isConsecutive = isConsecutiveMonths(insights);
  
  // 두 월이 연속인지 확인하는 함수
  function areConsecutiveMonths(insight1: InsightData, insight2: InsightData): boolean {
    const date1 = new Date(insight1.year, insight1.month - 1);
    const date2 = new Date(insight2.year, insight2.month - 1);
    
    // date1이 date2보다 1개월 뒤인지 확인
    const expectedPrevMonth = new Date(date1);
    expectedPrevMonth.setMonth(expectedPrevMonth.getMonth() - 1);
    
    return expectedPrevMonth.getFullYear() === date2.getFullYear() &&
           expectedPrevMonth.getMonth() === date2.getMonth();
  }
  
  // 비연속된 월의 경우: 첫 번째 월과 마지막 월 비교
  let previousInsight: InsightData | undefined;
  let monthRangePrefix: string | undefined;
  
  if (sortedInsights.length > 1) {
    const nextMonth = sortedInsights[1];
    
    // 최신 월과 다음 월이 연속인지 확인
    if (areConsecutiveMonths(latestInsight, nextMonth)) {
      // 연속된 경우: 전월 데이터 사용
      previousInsight = nextMonth;
      
      // 연속 월인 경우만 monthRangePrefix 설정 (3개월 이상일 때 월별 분석)
      if (isConsecutive && sortedInsights.length >= 3) {
        monthRangePrefix = getMonthRangeString(insights);
      }
    } else if (sortedInsights.length >= 3) {
      // 연속되지 않은 경우: 전전월까지 합산
      const previousMonths = sortedInsights.slice(1, 3); // 전월과 전전월
      const merged = mergeInsights(previousMonths);
      if (merged) {
        previousInsight = merged;
        // 합산한 월 범위 표시 (오래된 월~최신 월)
        const oldestMonth = previousMonths[previousMonths.length - 1];
        const newestMonth = previousMonths[0];
        monthRangePrefix = `${oldestMonth.month}월~${newestMonth.month}월`;
      }
    } else if (sortedInsights.length === 2) {
      // 전월만 있는 경우: 전월 사용
      previousInsight = nextMonth;
    }
    
    // 비연속된 전체 월 범위 설정 (합산하지 않은 경우만)
    if (!isConsecutive && sortedInsights.length > 1 && !monthRangePrefix) {
      monthRangePrefix = getMonthRangeString(insights);
    }
  }

  const comparison = createComparisonData(latestInsight, previousInsight);
  const insightText = generateInsightText(comparison, insights, monthRangePrefix);
  
  // 막대 그래프용: 오래된 순서로 정렬 (왼쪽이 오래된 것, 오른쪽이 최신)
  const chartInsights = sortedInsights.length > 1 ? [...sortedInsights].reverse() : sortedInsights;

  return (
    <div id="report-root" className="space-y-6 w-full max-w-full mx-auto px-4 print:px-0" style={{ pageBreakInside: 'auto', boxSizing: 'border-box' }}>
      {/* 헤더 */}
      <div className="card report-section bg-gradient-to-r from-purple-600 to-pink-600 text-white header">
        <div className="flex flex-col">
          <div className="mb-4">
            <h1 className="text-3xl font-bold mb-1">{business.name}</h1>
            <h2 className="text-xl">인스타그램 인사이트 월별 비교 보고서</h2>
          </div>
          <div className="flex justify-end text-right">
            <div>
              <p className="text-white/90">
                {latestInsight.year}년 {latestInsight.month}월 ({latestInsight.period === '14days' ? '14일' : '30일'} 기준)
              </p>
              <p className="text-sm text-white/70 mt-0.5">
                생성일: {formatDate(new Date(), 'yyyy년 MM월 dd일')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2열 레이아웃: 좌측 이미지 + 우측 데이터 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 좌측: 원본 인사이트 이미지 */}
        {latestInsight.originalImages && latestInsight.originalImages.length > 0 && (
          <div className="lg:col-span-4 space-y-4">
            <div className="card report-section sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📱 원본 인사이트</h3>
              <div className="space-y-6">
                {latestInsight.originalImages.map((imagePath, index) => (
                  <PhoneFrame
                    key={index}
                    imageUrl={`${window.location.origin}/uploads/${imagePath}`}
                    caption={`스크린샷 ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 우측: 데이터 및 그래프 */}
        <div className={latestInsight.originalImages && latestInsight.originalImages.length > 0 ? 'lg:col-span-8' : 'lg:col-span-12'}>
          <div className="space-y-6">
            {/* 인사이트 요약 */}
            <div className="card report-section">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📊 인사이트 요약</h3>
              <p className="text-gray-700 leading-relaxed">{insightText}</p>
            </div>

            {/* 프로필 활동 */}
            {settings.includeSections.profileActivity && (
              <div className="card report-section break-inside-avoid">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  👥 프로필 활동
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 cards-grid">
                  {/* 전체 */}
                  <div className="border border-gray-200 rounded-lg p-4 overflow-visible card-item">
                    <p className="text-sm text-gray-600 mb-2 text-center label">전체</p>
                    <div className="flex items-center justify-center mb-2 gap-2 flex-wrap">
                      <span className="text-xs text-gray-400 whitespace-nowrap">{formatNumber(comparison.previous?.profileActivity.total || 0)}</span>
                      <span className="text-gray-300 flex-shrink-0">/</span>
                      <span className="text-lg font-bold text-gray-900 whitespace-nowrap value">{formatNumber(latestInsight.profileActivity.total)}</span>
                    </div>
                    {comparison.changes.profileTotal && (
                      <div className="border-t border-gray-200 pt-2">
                        <div className="flex items-center justify-center gap-1">
                          <span>{comparison.changes.profileTotal.trend === 'up' ? '📈' : comparison.changes.profileTotal.trend === 'down' ? '📉' : '➡️'}</span>
                          <p className={`text-lg font-bold ${comparison.changes.profileTotal.trend === 'up' ? 'text-green-600' : comparison.changes.profileTotal.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                            {comparison.changes.profileTotal.percentage >= 0 ? '+' : ''}{comparison.changes.profileTotal.percentage.toFixed(1)}%
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 text-center">
                          ({comparison.changes.profileTotal.value >= 0 ? '+' : ''}{formatNumber(comparison.changes.profileTotal.value)})
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 프로필 방문 */}
                  <div className="border border-gray-200 rounded-lg p-4 overflow-visible card-item">
                    <p className="text-sm text-gray-600 mb-2 text-center label">프로필 방문</p>
                    <div className="flex items-center justify-center mb-2 gap-2 flex-wrap">
                      <span className="text-xs text-gray-400 whitespace-nowrap">{formatNumber(comparison.previous?.profileActivity.profileVisits || 0)}</span>
                      <span className="text-gray-300 flex-shrink-0">/</span>
                      <span className="text-lg font-bold text-gray-900 whitespace-nowrap value">{formatNumber(latestInsight.profileActivity.profileVisits)}</span>
                    </div>
                    {comparison.changes.profileVisits && (
                      <div className="border-t border-gray-200 pt-2">
                        <div className="flex items-center justify-center gap-1">
                          <span>{comparison.changes.profileVisits.trend === 'up' ? '📈' : comparison.changes.profileVisits.trend === 'down' ? '📉' : '➡️'}</span>
                          <p className={`text-lg font-bold ${comparison.changes.profileVisits.trend === 'up' ? 'text-green-600' : comparison.changes.profileVisits.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                            {comparison.changes.profileVisits.percentage >= 0 ? '+' : ''}{comparison.changes.profileVisits.percentage.toFixed(1)}%
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 text-center">
                          ({comparison.changes.profileVisits.value >= 0 ? '+' : ''}{formatNumber(comparison.changes.profileVisits.value)})
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 외부링크 클릭 */}
                  <div className="border border-gray-200 rounded-lg p-4 overflow-visible card-item">
                    <p className="text-sm text-gray-600 mb-2 text-center label">외부링크 클릭</p>
                    <div className="flex items-center justify-center mb-2 gap-2 flex-wrap">
                      <span className="text-xs text-gray-400 whitespace-nowrap">{formatNumber(comparison.previous?.profileActivity.externalLinkTaps || 0)}</span>
                      <span className="text-gray-300 flex-shrink-0">/</span>
                      <span className="text-lg font-bold text-gray-900 whitespace-nowrap value">{formatNumber(latestInsight.profileActivity.externalLinkTaps)}</span>
                    </div>
                    {comparison.changes.externalLinkTaps && (
                      <div className="border-t border-gray-200 pt-2">
                        <div className="flex items-center justify-center gap-1">
                          <span>{comparison.changes.externalLinkTaps.trend === 'up' ? '📈' : comparison.changes.externalLinkTaps.trend === 'down' ? '📉' : '➡️'}</span>
                          <p className={`text-lg font-bold ${comparison.changes.externalLinkTaps.trend === 'up' ? 'text-green-600' : comparison.changes.externalLinkTaps.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                            {comparison.changes.externalLinkTaps.percentage >= 0 ? '+' : ''}{comparison.changes.externalLinkTaps.percentage.toFixed(1)}%
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 text-center">
                          ({comparison.changes.externalLinkTaps.value >= 0 ? '+' : ''}{formatNumber(comparison.changes.externalLinkTaps.value)})
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 비즈니스 주소 */}
                  <div className="border border-gray-200 rounded-lg p-4 overflow-visible card-item">
                    <p className="text-sm text-gray-600 mb-2 text-center label">비즈니스 주소</p>
                    <div className="flex items-center justify-center mb-2 gap-2 flex-wrap">
                      <span className="text-xs text-gray-400 whitespace-nowrap">{formatNumber(comparison.previous?.profileActivity.businessAddressTaps || 0)}</span>
                      <span className="text-gray-300 flex-shrink-0">/</span>
                      <span className="text-lg font-bold text-gray-900 whitespace-nowrap value">{formatNumber(latestInsight.profileActivity.businessAddressTaps)}</span>
                    </div>
                    {comparison.changes.businessAddressTaps && (
                      <div className="border-t border-gray-200 pt-2">
                        <div className="flex items-center justify-center gap-1">
                          <span>{comparison.changes.businessAddressTaps.trend === 'up' ? '📈' : comparison.changes.businessAddressTaps.trend === 'down' ? '📉' : '➡️'}</span>
                          <p className={`text-lg font-bold ${comparison.changes.businessAddressTaps.trend === 'up' ? 'text-green-600' : comparison.changes.businessAddressTaps.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                            {comparison.changes.businessAddressTaps.percentage >= 0 ? '+' : ''}{comparison.changes.businessAddressTaps.percentage.toFixed(1)}%
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 text-center">
                          ({comparison.changes.businessAddressTaps.value >= 0 ? '+' : ''}{formatNumber(comparison.changes.businessAddressTaps.value)})
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {settings.includeGraphs.lineChart && insights.length > 1 && (
                  <div className="panel">
                    <LineChartComponent
                      insights={sortedInsights.reverse()}
                      dataKey="profileActivity.profileVisits"
                      title="프로필 방문 추이"
                      color="#0ea5e9"
                    />
                  </div>
                )}
              </div>
            )}

            {/* 조회 */}
            {settings.includeSections.views && (
              <div className="card report-section break-inside-avoid">
                <h3 className="text-xl font-bold text-gray-900 mb-4">👁️ 조회</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-6 board-grid">
                  <MetricCard
                    title="도달한 계정"
                    value={latestInsight.views.reachedAccounts}
                    previous={comparison.previous?.views.reachedAccounts}
                    change={comparison.changes.reachedAccounts}
                  />
                  <MetricCard
                    title="총 조회 수"
                    value={latestInsight.views.totalViews}
                    previous={comparison.previous?.views.totalViews}
                    change={comparison.changes.totalViews}
                  />
                </div>

                {settings.includeGraphs.barChart && (
                  <div className="panel">
                    <BarChartComponent
                      insights={chartInsights}
                      dataKeys={['views.reachedAccounts', 'views.totalViews']}
                      title="조회 현황"
                    />
                  </div>
                )}
              </div>
            )}

            {/* 콘텐츠 유형 */}
            {settings.includeSections.contentTypes && (
              <div className="card report-section break-inside-avoid">
                <h3 className="text-xl font-bold text-gray-900 mb-4">📱 콘텐츠 유형별</h3>
                
                <div className="grid grid-cols-3 gap-4 mb-8 kpis-grid">
                  <PercentageMetricCard
                    title="게시물"
                    value={latestInsight.contentTypes.posts}
                    total={
                      latestInsight.contentTypes.posts +
                      latestInsight.contentTypes.stories +
                      latestInsight.contentTypes.reels
                    }
                    previous={comparison.previous?.contentTypes.posts}
                    previousTotal={
                      comparison.previous ? (
                        comparison.previous.contentTypes.posts +
                        comparison.previous.contentTypes.stories +
                        comparison.previous.contentTypes.reels
                      ) : undefined
                    }
                    change={comparison.changes.posts}
                  />
                  <PercentageMetricCard
                    title="스토리"
                    value={latestInsight.contentTypes.stories}
                    total={
                      latestInsight.contentTypes.posts +
                      latestInsight.contentTypes.stories +
                      latestInsight.contentTypes.reels
                    }
                    previous={comparison.previous?.contentTypes.stories}
                    previousTotal={
                      comparison.previous ? (
                        comparison.previous.contentTypes.posts +
                        comparison.previous.contentTypes.stories +
                        comparison.previous.contentTypes.reels
                      ) : undefined
                    }
                    change={comparison.changes.stories}
                  />
                  <PercentageMetricCard
                    title="릴스"
                    value={latestInsight.contentTypes.reels}
                    total={
                      latestInsight.contentTypes.posts +
                      latestInsight.contentTypes.stories +
                      latestInsight.contentTypes.reels
                    }
                    previous={comparison.previous?.contentTypes.reels}
                    previousTotal={
                      comparison.previous ? (
                        comparison.previous.contentTypes.posts +
                        comparison.previous.contentTypes.stories +
                        comparison.previous.contentTypes.reels
                      ) : undefined
                    }
                    change={comparison.changes.reels}
                  />
                </div>

                {settings.includeGraphs.barChart && (
                  <div className="panel" style={{ marginTop: 'var(--card-gap)' }}>
                    <BarChartComponent
                      insights={chartInsights}
                      dataKeys={['contentTypes.posts', 'contentTypes.stories', 'contentTypes.reels']}
                      title="콘텐츠 유형별 분포"
                    />
                  </div>
                )}
              </div>
            )}

            {/* 기타 지표 */}
            {settings.includeSections.metrics && (
              <div className="card report-section break-inside-avoid">
                <h3 className="text-xl font-bold text-gray-900 mb-4">📈 기타 지표</h3>
                
                <div className="grid grid-cols-3 gap-4 mb-6 kpis-grid">
                  <MetricCard
                    title="조회수"
                    value={latestInsight.metrics.totalViews}
                    previous={comparison.previous?.metrics.totalViews}
                    change={comparison.changes.metricsViews}
                  />
                  <MetricCard
                    title="반응"
                    value={latestInsight.metrics.reactions}
                    previous={comparison.previous?.metrics.reactions}
                    change={comparison.changes.reactions}
                  />
                  <MetricCard
                    title="새 팔로워"
                    value={latestInsight.metrics.newFollowers}
                    previous={comparison.previous?.metrics.newFollowers}
                    change={comparison.changes.newFollowers}
                  />
                </div>

                {settings.includeGraphs.lineChart && (
                  <div className="panel">
                    {insights.length > 1 ? (
                      <LineChartComponent
                        insights={sortedInsights}
                        dataKey="metrics.newFollowers"
                        title="새 팔로워 추이"
                        color="#10b981"
                      />
                    ) : (
                      <BarChartComponent
                        insights={chartInsights}
                        dataKeys={['metrics.totalViews', 'metrics.reactions', 'metrics.newFollowers']}
                        title="기타 지표 현황"
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 메모 */}
            {latestInsight.notes && (
              <div className="card">
                <h3 className="text-xl font-bold text-gray-900 mb-4">📝 메모</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{latestInsight.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  previous?: number;
  change?: {
    value: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  };
}

function MetricCard({ title, value, previous, change }: MetricCardProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-6 overflow-visible min-h-[140px] card-item">
      <p className="text-sm text-gray-600 mb-3 text-center label">{title}</p>
      <div className="flex items-center justify-center mb-3 gap-2 flex-wrap">
        <span className="text-xs text-gray-400 whitespace-nowrap">{formatNumber(previous || 0)}</span>
        <span className="text-gray-300 flex-shrink-0">/</span>
        <span className="text-lg font-bold text-gray-900 whitespace-nowrap value">{formatNumber(value)}</span>
      </div>
      
      {change && (
        <div className="border-t border-gray-200 pt-3">
          <div className="flex items-center justify-center gap-1">
            <span>{change.trend === 'up' ? '📈' : change.trend === 'down' ? '📉' : '➡️'}</span>
            <p className={`text-lg font-bold ${
              change.trend === 'up' ? 'text-green-600' :
              change.trend === 'down' ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {change.percentage >= 0 ? '+' : ''}{change.percentage.toFixed(1)}%
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            ({change.value >= 0 ? '+' : ''}{formatNumber(change.value)})
          </p>
        </div>
      )}
    </div>
  );
}

interface PercentageMetricCardProps {
  title: string;
  value: number;
  total: number;
  previous?: number;
  previousTotal?: number;
  change?: {
    value: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  };
}

function PercentageMetricCard({ title, value, total, previous, previousTotal, change }: PercentageMetricCardProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const previousPercentage = previousTotal && previousTotal > 0 ? (previous || 0) / previousTotal * 100 : 0;
  
  return (
    <div className="bg-gray-50 rounded-lg p-6 overflow-visible min-h-[180px] card-item">
      <p className="text-sm text-gray-600 mb-3 text-center label">{title}</p>
      <div className="flex items-center justify-center mb-3 gap-2 flex-wrap">
        <span className="text-xs text-gray-400 whitespace-nowrap">{formatNumber(previous || 0)}</span>
        <span className="text-gray-300 flex-shrink-0">/</span>
        <span className="text-lg font-bold text-gray-900 whitespace-nowrap value">{formatNumber(value)}</span>
      </div>
      
      {/* 퍼센트 및 진행 바 */}
      <div className="mb-3">
        <div className="flex items-baseline justify-center space-x-2 mb-2">
          <p className="text-xl font-bold text-gray-900">{percentage.toFixed(1)}%</p>
          {previousTotal && previousTotal > 0 && (
            <p className="text-xs text-gray-400">({previousPercentage.toFixed(1)}%)</p>
          )}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
      
      {change && (
        <div className="border-t border-gray-200 pt-3">
          <div className="flex items-center justify-center gap-1">
            <span>{change.trend === 'up' ? '📈' : change.trend === 'down' ? '📉' : '➡️'}</span>
            <p className={`text-lg font-bold ${
              change.trend === 'up' ? 'text-green-600' :
              change.trend === 'down' ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {change.percentage >= 0 ? '+' : ''}{change.percentage.toFixed(1)}%
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-1 text-center">
            ({change.value >= 0 ? '+' : ''}{formatNumber(change.value)})
          </p>
        </div>
      )}
    </div>
  );
}

