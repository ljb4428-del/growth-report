import { Business, InsightData } from '../types';
import { formatDate, formatNumber, getMonthString } from '../utils/helpers';
import { Calendar, TrendingUp, Eye, Users, Plus, BarChart3, Edit2 } from 'lucide-react';

interface Props {
  business: Business;
  insights: InsightData[];
  onRefresh: () => void;
  onUploadClick: () => void;
  onEditClick: (insight: InsightData) => void;
}

export default function DataList({ business, insights, onRefresh, onUploadClick, onEditClick }: Props) {
  // 월별로 그룹화
  const groupedByMonth = insights.reduce((acc, insight) => {
    const monthKey = getMonthString(insight.year, insight.month);
    if (!acc[monthKey]) {
      acc[monthKey] = [];
    }
    acc[monthKey].push(insight);
    return acc;
  }, {} as Record<string, InsightData[]>);

  const months = Object.keys(groupedByMonth).sort().reverse();

  if (insights.length === 0) {
    return (
      <div className="card text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          데이터가 없습니다
        </h3>
        <p className="text-gray-600 mb-6">
          인스타그램 인사이트 스크린샷을 업로드하여 데이터를 추가하세요.
        </p>
        <button onClick={onUploadClick} className="btn-primary">
          <Plus className="w-5 h-5 inline mr-2" />
          첫 데이터 업로드
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 데이터</p>
              <p className="text-2xl font-bold text-gray-900">{insights.length}개</p>
            </div>
            <Calendar className="w-10 h-10 text-primary-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">누적 기간</p>
              <p className="text-2xl font-bold text-gray-900">{months.length}개월</p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">최신 업데이트</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(insights[0].updatedAt, 'yyyy.MM.dd')}
              </p>
            </div>
            <Eye className="w-10 h-10 text-blue-600" />
          </div>
        </div>
      </div>

      {/* 월별 데이터 목록 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">월별 데이터</h2>
          <button onClick={onUploadClick} className="btn-primary">
            <Plus className="w-4 h-4 inline mr-2" />
            새 데이터 추가
          </button>
        </div>

        {months.map((monthKey) => {
          const monthInsights = groupedByMonth[monthKey];
          const [year, month] = monthKey.split('-').map(Number);
          
          return (
            <div key={monthKey} className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {year}년 {month}월
                </h3>
                <span className="text-sm text-gray-500">
                  {monthInsights.length}개 데이터
                </span>
              </div>

              <div className="space-y-3">
                {monthInsights
                  .sort((a, b) => (a.period === '14days' ? -1 : 1))
                  .map((insight) => (
                    <div
                      key={insight.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            insight.period === '14days'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {insight.period === '14days' ? '14일 기준' : '30일 기준'}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            업데이트: {formatDate(insight.updatedAt, 'yyyy.MM.dd HH:mm')}
                          </p>
                        </div>
                        <button
                          onClick={() => onEditClick(insight)}
                          className="flex items-center space-x-1 px-3 py-1 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="데이터 수정"
                        >
                          <Edit2 className="w-4 h-4" />
                          <span>수정</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-600">도달한 계정</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatNumber(insight.views.reachedAccounts)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">프로필 방문</p>
                          <p className="text-lg font-semibold text-primary-600">
                            {formatNumber(insight.profileActivity.profileVisits)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">새 팔로워</p>
                          <p className="text-lg font-semibold text-green-600">
                            {formatNumber(insight.metrics.newFollowers)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">외부링크 클릭</p>
                          <p className="text-lg font-semibold text-orange-600">
                            {formatNumber(insight.profileActivity.externalLinkTaps)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

