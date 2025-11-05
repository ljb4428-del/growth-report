import { Business, InsightData, ReportSettings } from '../types';
import { formatDate, formatNumber, createComparisonData, generateInsightText, isConsecutiveMonths, getMonthRangeString } from '../utils/helpers';
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
  
  // 비연속된 월의 경우: 첫 번째 월과 마지막 월 비교
  let previousInsight: InsightData | undefined;
  let monthRangePrefix: string | undefined;
  
  if (!isConsecutive && sortedInsights.length > 1) {
    previousInsight = sortedInsights[sortedInsights.length - 1]; // 가장 이전 월
    monthRangePrefix = getMonthRangeString(insights); // "7월~10월" (비연속)
  } else if (isConsecutive && sortedInsights.length > 1) {
    previousInsight = sortedInsights[1]; // 이전 월
    // 연속 월인 경우만 monthRangePrefix 설정 (3개월 이상일 때 월별 분석)
    if (sortedInsights.length >= 3) {
      monthRangePrefix = getMonthRangeString(insights); // "7월~9월" (연속)
    }
  }

  const comparison = createComparisonData(latestInsight, previousInsight);
  const insightText = generateInsightText(comparison, insights, monthRangePrefix);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="flex flex-col">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">{business.name}</h1>
            <h2 className="text-xl">인스타그램 인사이트 월별 비교 보고서</h2>
          </div>
          <div className="flex justify-end text-right">
            <div>
              <p className="text-primary-100">
                {latestInsight.year}년 {latestInsight.month}월 ({latestInsight.period === '14days' ? '14일' : '30일'} 기준)
              </p>
              <p className="text-sm text-primary-200 mt-1">
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
            <div className="card sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">📱 원본 인사이트</h3>
              <div className="space-y-6">
                {latestInsight.originalImages.map((imagePath, index) => (
                  <PhoneFrame
                    key={index}
                    imageUrl={`http://localhost:3000/uploads/${imagePath}`}
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
            <div className="card">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📊 인사이트 요약</h3>
              <p className="text-gray-700 leading-relaxed">{insightText}</p>
            </div>

            {/* 프로필 활동 */}
            {settings.includeSections.profileActivity && (
              <div className="card">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  👥 프로필 활동
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {/* 전체 */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-3">전체</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-400">{comparison.previous?.profileActivity.total || 0}</span>
                      <span className="text-gray-300">/</span>
                      <span className="text-2xl font-bold text-gray-900">{latestInsight.profileActivity.total}</span>
                    </div>
                    {comparison.changes.profileTotal && (
                      <div className="border-t border-gray-200 pt-3 text-center">
                        <p className={`text-lg font-bold ${comparison.changes.profileTotal.trend === 'up' ? 'text-green-600' : comparison.changes.profileTotal.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                          {comparison.changes.profileTotal.trend === 'up' ? '📈' : comparison.changes.profileTotal.trend === 'down' ? '📉' : '➡️'}
                          {comparison.changes.profileTotal.percentage >= 0 ? '+' : ''}{comparison.changes.profileTotal.percentage.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          ({comparison.changes.profileTotal.value >= 0 ? '+' : ''}{formatNumber(comparison.changes.profileTotal.value)})
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 프로필 방문 */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-3">프로필 방문</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-400">{comparison.previous?.profileActivity.profileVisits || 0}</span>
                      <span className="text-gray-300">/</span>
                      <span className="text-2xl font-bold text-gray-900">{latestInsight.profileActivity.profileVisits}</span>
                    </div>
                    {comparison.changes.profileVisits && (
                      <div className="border-t border-gray-200 pt-3 text-center">
                        <p className={`text-lg font-bold ${comparison.changes.profileVisits.trend === 'up' ? 'text-green-600' : comparison.changes.profileVisits.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                          {comparison.changes.profileVisits.trend === 'up' ? '📈' : comparison.changes.profileVisits.trend === 'down' ? '📉' : '➡️'}
                          {comparison.changes.profileVisits.percentage >= 0 ? '+' : ''}{comparison.changes.profileVisits.percentage.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          ({comparison.changes.profileVisits.value >= 0 ? '+' : ''}{formatNumber(comparison.changes.profileVisits.value)})
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 외부링크 클릭 */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-3">외부링크 클릭</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-400">{comparison.previous?.profileActivity.externalLinkTaps || 0}</span>
                      <span className="text-gray-300">/</span>
                      <span className="text-2xl font-bold text-gray-900">{latestInsight.profileActivity.externalLinkTaps}</span>
                    </div>
                    {comparison.changes.externalLinkTaps && (
                      <div className="border-t border-gray-200 pt-3 text-center">
                        <p className={`text-lg font-bold ${comparison.changes.externalLinkTaps.trend === 'up' ? 'text-green-600' : comparison.changes.externalLinkTaps.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                          {comparison.changes.externalLinkTaps.trend === 'up' ? '📈' : comparison.changes.externalLinkTaps.trend === 'down' ? '📉' : '➡️'}
                          {comparison.changes.externalLinkTaps.percentage >= 0 ? '+' : ''}{comparison.changes.externalLinkTaps.percentage.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          ({comparison.changes.externalLinkTaps.value >= 0 ? '+' : ''}{formatNumber(comparison.changes.externalLinkTaps.value)})
                        </p>
                      </div>
                    )}
                  </div>

                  {/* 비즈니스 주소 */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-3">비즈니스 주소</p>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-400">{comparison.previous?.profileActivity.businessAddressTaps || 0}</span>
                      <span className="text-gray-300">/</span>
                      <span className="text-2xl font-bold text-gray-900">{latestInsight.profileActivity.businessAddressTaps}</span>
                    </div>
                    {comparison.changes.businessAddressTaps && (
                      <div className="border-t border-gray-200 pt-3 text-center">
                        <p className={`text-lg font-bold ${comparison.changes.businessAddressTaps.trend === 'up' ? 'text-green-600' : comparison.changes.businessAddressTaps.trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                          {comparison.changes.businessAddressTaps.trend === 'up' ? '📈' : comparison.changes.businessAddressTaps.trend === 'down' ? '📉' : '➡️'}
                          {comparison.changes.businessAddressTaps.percentage >= 0 ? '+' : ''}{comparison.changes.businessAddressTaps.percentage.toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          ({comparison.changes.businessAddressTaps.value >= 0 ? '+' : ''}{formatNumber(comparison.changes.businessAddressTaps.value)})
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {settings.includeGraphs.lineChart && insights.length > 1 && (
                  <LineChartComponent
                    insights={sortedInsights.reverse()}
                    dataKey="profileActivity.profileVisits"
                    title="프로필 방문 추이"
                    color="#0ea5e9"
                  />
                )}
              </div>
            )}

            {/* 조회 */}
            {settings.includeSections.views && (
              <div className="card">
                <h3 className="text-xl font-bold text-gray-900 mb-4">👁️ 조회</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <MetricCard
                    title="도달한 계정"
                    value={latestInsight.views.reachedAccounts}
                    change={comparison.changes.reachedAccounts}
                  />
                  <MetricCard
                    title="총 조회 수"
                    value={latestInsight.views.totalViews}
                    change={comparison.changes.totalViews}
                  />
                </div>

                {settings.includeGraphs.barChart && (
                  <BarChartComponent
                    insights={[latestInsight]}
                    dataKeys={['views.reachedAccounts', 'views.totalViews']}
                    title="조회 현황"
                  />
                )}
              </div>
            )}

            {/* 콘텐츠 유형 */}
            {settings.includeSections.contentTypes && (
              <div className="card">
                <h3 className="text-xl font-bold text-gray-900 mb-4">📱 콘텐츠 유형별</h3>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <PercentageMetricCard
                    title="게시물"
                    value={latestInsight.contentTypes.posts}
                    total={
                      latestInsight.contentTypes.posts +
                      latestInsight.contentTypes.stories +
                      latestInsight.contentTypes.reels
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
                    change={comparison.changes.reels}
                  />
                </div>

                {settings.includeGraphs.barChart && (
                  <BarChartComponent
                    insights={[latestInsight]}
                    dataKeys={['contentTypes.posts', 'contentTypes.stories', 'contentTypes.reels']}
                    title="콘텐츠 유형별 분포"
                  />
                )}
              </div>
            )}

            {/* 기타 지표 */}
            {settings.includeSections.metrics && (
              <div className="card">
                <h3 className="text-xl font-bold text-gray-900 mb-4">📈 기타 지표</h3>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <MetricCard
                    title="조회수"
                    value={latestInsight.metrics.totalViews}
                    change={comparison.changes.metricsViews}
                  />
                  <MetricCard
                    title="반응"
                    value={latestInsight.metrics.reactions}
                    change={comparison.changes.reactions}
                  />
                  <MetricCard
                    title="새 팔로워"
                    value={latestInsight.metrics.newFollowers}
                    change={comparison.changes.newFollowers}
                  />
                </div>

                {settings.includeGraphs.lineChart && insights.length > 1 && (
                  <LineChartComponent
                    insights={sortedInsights}
                    dataKey="metrics.newFollowers"
                    title="새 팔로워 추이"
                    color="#10b981"
                  />
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
  change?: {
    value: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  };
}

function MetricCard({ title, value, change }: MetricCardProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mb-2">{formatNumber(value)}</p>
      
      {change && (
        <div className="flex items-center space-x-1 text-sm">
          {change.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
          {change.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
          {change.trend === 'stable' && <Minus className="w-4 h-4 text-gray-600" />}
          
          <span className={`font-medium ${
            change.trend === 'up' ? 'text-green-600' :
            change.trend === 'down' ? 'text-red-600' :
            'text-gray-600'
          }`}>
            {change.percentage >= 0 ? '+' : ''}{change.percentage.toFixed(1)}%
          </span>
          
          <span className="text-gray-500">
            ({change.value >= 0 ? '+' : ''}{formatNumber(change.value)})
          </span>
        </div>
      )}
    </div>
  );
}

interface PercentageMetricCardProps {
  title: string;
  value: number;
  total: number;
  change?: {
    value: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  };
}

function PercentageMetricCard({ title, value, total, change }: PercentageMetricCardProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <div className="flex items-baseline space-x-2 mb-1">
        <p className="text-2xl font-bold text-gray-900">{percentage.toFixed(1)}%</p>
        <p className="text-sm text-gray-500">({formatNumber(value)})</p>
      </div>
      
      {/* 진행 바 */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div 
          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      
      {change && (
        <div className="flex items-center space-x-1 text-sm">
          {change.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-600" />}
          {change.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-600" />}
          {change.trend === 'stable' && <Minus className="w-4 h-4 text-gray-600" />}
          
          <span className={`font-medium ${
            change.trend === 'up' ? 'text-green-600' :
            change.trend === 'down' ? 'text-red-600' :
            'text-gray-600'
          }`}>
            {change.percentage >= 0 ? '+' : ''}{change.percentage.toFixed(1)}%
          </span>
          
          <span className="text-gray-500">
            ({change.value >= 0 ? '+' : ''}{formatNumber(change.value)})
          </span>
        </div>
      )}
    </div>
  );
}

