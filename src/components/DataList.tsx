import { useState } from 'react';
import { Business, InsightData } from '../types';
import { formatDate, formatNumber, getMonthString } from '../utils/helpers';
import { Calendar, TrendingUp, Eye, Users, Plus, BarChart3, Edit2, Check } from 'lucide-react';

interface Props {
  business: Business;
  insights: InsightData[];
  onRefresh: () => void;
  onUploadClick: () => void;
  onEditClick: (insight: InsightData) => void;
  onViewMonthlyReport: (monthInsights: InsightData[]) => void;
  onViewComparisonReport: (selectedInsights?: InsightData[]) => void;
}

export default function DataList({ business, insights, onRefresh, onUploadClick, onEditClick, onViewMonthlyReport, onViewComparisonReport }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
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

  // 체크박스 핸들러
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedIds.size === insights.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(insights.map(insight => insight.id)));
    }
  };

  // 선택된 데이터 가져오기
  const getSelectedInsights = () => {
    return insights.filter(insight => selectedIds.has(insight.id));
  };

  // 비교 보고서 생성 (선택된 항목)
  const handleComparisonReport = () => {
    const selected = getSelectedInsights();
    if (selected.length > 0) {
      onViewComparisonReport(selected);
    }
  };

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
    <div className="space-y-4">
      {/* 요약 카드 - 3개 독립 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 총 데이터 카드 */}
        <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded p-1.5">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-xs font-semibold text-gray-600">총 데이터</p>
              <div className="flex items-baseline space-x-0.5">
                <p className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {insights.length}
                </p>
                <p className="text-xs text-gray-600">개</p>
              </div>
            </div>
          </div>
        </div>

        {/* 누적 기간 카드 */}
        <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded p-1.5">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-xs font-semibold text-gray-600">누적 기간</p>
              <div className="flex items-baseline space-x-0.5">
                <p className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {months.length}
                </p>
                <p className="text-xs text-gray-600">개월</p>
              </div>
            </div>
          </div>
        </div>

        {/* 최신 업데이트 카드 */}
        <div className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded p-1.5">
              <Eye className="w-4 h-4 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-xs font-semibold text-gray-600">최신 업데이트</p>
              <p className="text-xs font-bold text-gray-900">
                {formatDate(insights[0].updatedAt, 'yyyy.MM.dd HH:mm')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 월별 데이터 목록 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">월별 데이터</h2>
          <div className="flex items-center space-x-2">
            <button 
              onClick={onUploadClick} 
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>새 데이터 추가</span>
            </button>
            <button 
              onClick={handleComparisonReport}
              className={`flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all hover:shadow-lg ${
                selectedIds.size === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={selectedIds.size === 0}
              title={selectedIds.size === 0 ? '비교할 데이터를 선택하세요' : '선택된 데이터 비교 보고서 생성'}
            >
              <BarChart3 className="w-4 h-4" />
              <span>비교 보고서 생성 ({selectedIds.size})</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-md">
          {/* 전체 테이블 헤더 */}
          <div className="bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 px-5 py-3 sticky top-0 z-20">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                월별 데이터 ({insights.length}개)
              </h3>
            </div>
          </div>

          {/* 테이블 헤더 */}
          <div className="flex gap-3 px-5 py-3 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600 sticky top-11 z-10 items-center">
            <div className="w-10 flex items-center justify-center flex-shrink-0">
              <button
                onClick={toggleSelectAll}
                className="relative inline-flex items-center justify-center w-5 h-5 border-2 border-gray-400 rounded transition-all hover:border-purple-500"
                title="전체 선택"
              >
                {selectedIds.size > 0 && (
                  <div className={`absolute inset-0 rounded flex items-center justify-center ${
                    selectedIds.size === insights.length
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                      : 'bg-gray-400'
                  }`}>
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            </div>
            <div className="w-28 flex-shrink-0">날짜</div>
            <div className="w-16 text-center flex-shrink-0">기간</div>
            <div className="flex-1 text-center">도달 계정</div>
            <div className="flex-1 text-center">프로필 방문</div>
            <div className="flex-1 text-center">새 팔로워</div>
            <div className="flex-1 text-center">외부 클릭</div>
            <div className="w-24 text-center flex-shrink-0">작업</div>
          </div>

          {/* 모든 데이터를 월별로 그룹화하여 표시 */}
          <div className="divide-y divide-gray-200">
            {months.flatMap((monthKey) => {
              const monthInsights = groupedByMonth[monthKey];
              const [year, month] = monthKey.split('-').map(Number);
              
              return monthInsights
                .sort((a, b) => (a.period === '14days' ? -1 : 1))
                .map((insight) => (
                  <div
                    key={insight.id}
                    className="flex gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group items-center text-sm border-t border-gray-100 first:border-t-0"
                  >
                    {/* 체크박스 */}
                    <div className="w-10 flex justify-center flex-shrink-0">
                      <button
                        onClick={() => toggleSelect(insight.id)}
                        className="relative inline-flex items-center justify-center w-5 h-5 border-2 border-gray-300 rounded transition-all hover:border-purple-500"
                        title="선택"
                      >
                        {selectedIds.has(insight.id) && (
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    </div>

                    {/* 날짜 */}
                    <div className="w-28 flex-shrink-0">
                      <p className="text-gray-600 font-medium">{year}.{String(month).padStart(2, '0')}.{formatDate(insight.updatedAt, 'dd')}</p>
                      <p className="text-gray-400 text-xs">{formatDate(insight.updatedAt, 'HH:mm')}</p>
                    </div>

                    {/* 기간 */}
                    <div className="w-16 text-center flex-shrink-0">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold whitespace-nowrap ${
                        insight.period === '14days'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {insight.period === '14days' ? '14일' : '30일'}
                      </span>
                    </div>

                    {/* 도달 계정 */}
                    <div className="flex-1 text-center">
                      <p className="font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                        {formatNumber(insight.views.reachedAccounts)}
                      </p>
                    </div>

                    {/* 프로필 방문 */}
                    <div className="flex-1 text-center">
                      <p className="font-bold bg-gradient-to-r from-purple-600 to-purple-500 bg-clip-text text-transparent">
                        {formatNumber(insight.profileActivity.profileVisits)}
                      </p>
                    </div>

                    {/* 새 팔로워 */}
                    <div className="flex-1 text-center">
                      <p className="font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                        {formatNumber(insight.metrics.newFollowers)}
                      </p>
                    </div>

                    {/* 외부 클릭 */}
                    <div className="flex-1 text-center">
                      <p className="font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent">
                        {formatNumber(insight.profileActivity.externalLinkTaps)}
                      </p>
                    </div>

                    {/* 작업 버튼 */}
                    <div className="w-24 flex items-center justify-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => onEditClick(insight)}
                        className="inline-flex items-center justify-center px-2 py-1 text-xs font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded transition-all"
                        title="데이터 수정"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onViewMonthlyReport([insight])}
                        className="inline-flex items-center justify-center px-2 py-1 text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 rounded transition-all whitespace-nowrap"
                        title="당월 보고서"
                      >
                        <BarChart3 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ));
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

