import { useState, useEffect } from 'react';
import { Business, InsightData, AISettings } from '../types';
import { insightAPI, settingsAPI } from '../utils/api';
import { Upload, BarChart3, FileText, Settings } from 'lucide-react';
import DataUpload from './DataUpload';
import ReportView from './ReportView';
import DataList from './DataList';
import DataEditor from './DataEditor';

interface Props {
  business: Business;
  businesses: Business[];
  onSelectBusiness: (business: Business) => void;
  onShowAISettings: () => void;
}

export default function Dashboard({ business, businesses, onSelectBusiness, onShowAISettings }: Props) {
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingInsight, setEditingInsight] = useState<InsightData | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMonthlyReportModal, setShowMonthlyReportModal] = useState(false);
  const [showComparisonReportModal, setShowComparisonReportModal] = useState(false);
  const [selectedMonthlyInsights, setSelectedMonthlyInsights] = useState<InsightData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isBusinessDropdownOpen, setIsBusinessDropdownOpen] = useState(false);
  const [selectedBusinessIndex, setSelectedBusinessIndex] = useState(0);

  useEffect(() => {
    loadInsights();
  }, [business.id]);

  // ESC 키 핸들러 및 F2 단축키
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setShowUploadModal(false);
        setShowEditModal(false);
        setShowMonthlyReportModal(false);
        setShowComparisonReportModal(false);
        setIsBusinessDropdownOpen(false);
      } else if (e.key === 'F2') {
        e.preventDefault();
        setIsBusinessDropdownOpen(true);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function loadInsights() {
    setLoading(true);
    const result = await insightAPI.getAll(business.id);
    
    if (result.success && result.data) {
      setInsights(result.data);
    }
    
    setLoading(false);
  }

  function handleDataUploaded() {
    loadInsights();
    setShowUploadModal(false);
    setViewMode('list');
  }

  function handleEditClick(insight: InsightData) {
    setEditingInsight(insight);
    setShowEditModal(true);
  }

  async function handleDataUpdated(data: Partial<InsightData>) {
    if (!editingInsight) return;

    const result = await insightAPI.update(editingInsight.id, data);
    
    if (result.success) {
      loadInsights();
      setShowEditModal(false);
      setEditingInsight(null);
    }
  }

  function handleCancelEdit() {
    setEditingInsight(null);
    setShowEditModal(false);
  }

  function handleViewMonthlyReport(monthInsights: InsightData[]) {
    setSelectedMonthlyInsights(monthInsights);
    setShowMonthlyReportModal(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // 검색 필터링
  const filteredBusinesses = businesses.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* 툴바 */}
      <div className="bg-gradient-to-r from-purple-500 via-purple-600 to-pink-500 rounded-lg shadow-lg p-0.5">
        <div className="bg-white rounded-lg px-5 py-3">
          <div className="flex items-center justify-between space-x-3">
            {/* 좌측: 비즈니스 선택 검색박스 */}
            <div className="relative flex-1 max-w-sm">
              <div
                className="flex items-center space-x-2 bg-gradient-to-r from-gray-50 to-white border-2 border-purple-200 rounded-lg px-3 py-2.5 cursor-text hover:border-purple-300 transition-colors"
                onClick={() => setIsBusinessDropdownOpen(true)}
              >
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {isBusinessDropdownOpen ? (
                  <input
                    type="text"
                    placeholder="업체 검색..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedBusinessIndex(0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setSelectedBusinessIndex((prev) =>
                          prev < filteredBusinesses.length - 1 ? prev + 1 : prev
                        );
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setSelectedBusinessIndex((prev) => (prev > 0 ? prev - 1 : 0));
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        if (filteredBusinesses.length > 0) {
                          onSelectBusiness(filteredBusinesses[selectedBusinessIndex]);
                          setIsBusinessDropdownOpen(false);
                          setSearchQuery('');
                          setSelectedBusinessIndex(0);
                        }
                      }
                    }}
                    className="flex-1 outline-none bg-transparent text-gray-900 placeholder-gray-400 text-sm"
                    autoFocus
                  />
                ) : (
                  <span className="font-medium text-gray-800 flex-1 truncate text-sm">{business.name}</span>
                )}
                <svg className={`w-4 h-4 text-purple-600 transition-transform ${isBusinessDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>

              {/* 검색 드롭다운 */}
              {isBusinessDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => {
                      setIsBusinessDropdownOpen(false);
                      setSearchQuery('');
                    }}
                  />
                  <div className="absolute top-full left-0 mt-3 w-full bg-white rounded-xl shadow-xl border border-purple-200 z-20 overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                      {filteredBusinesses.length > 0 ? (
                        filteredBusinesses.map((b, index) => (
                          <button
                            key={b.id}
                            onClick={() => {
                              onSelectBusiness(b);
                              setIsBusinessDropdownOpen(false);
                              setSearchQuery('');
                              setSelectedBusinessIndex(0);
                            }}
                            className={`w-full flex flex-col px-4 py-3 text-left transition-colors border-b border-gray-100 last:border-b-0 ${
                              index === selectedBusinessIndex
                                ? 'bg-purple-200'
                                : b.id === business.id
                                ? 'bg-purple-100 hover:bg-purple-150'
                                : 'hover:bg-purple-50'
                            }`}
                          >
                            <div className="font-semibold text-gray-900 text-sm">{b.name}</div>
                            {b.description && (
                              <div className="text-xs text-gray-500 truncate mt-1">{b.description}</div>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-gray-500 text-sm">
                          검색 결과가 없습니다.
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 우측: AI API 설정 */}
            <button
              onClick={onShowAISettings}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg px-4 py-2 font-medium transition-all hover:shadow-lg text-sm"
              title="AI API 설정"
            >
              <Settings className="w-4 h-4" />
              <span>AI API 설정</span>
            </button>
          </div>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div>
        <DataList
          business={business}
          insights={insights}
          onRefresh={loadInsights}
          onUploadClick={() => setShowUploadModal(true)}
          onEditClick={handleEditClick}
          onViewMonthlyReport={handleViewMonthlyReport}
          onViewComparisonReport={() => setShowComparisonReportModal(true)}
        />
      </div>

      {/* 업로드 모달 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowUploadModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[95vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0">
              <h2 className="text-xl font-bold text-white">데이터 업로드</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-white/70 hover:text-white text-2xl transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <DataUpload
                business={business}
                onSuccess={handleDataUploaded}
              />
            </div>
          </div>
        </div>
      )}

      {/* 데이터 수정 모달 */}
      {showEditModal && editingInsight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowEditModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[95vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0">
              <h2 className="text-xl font-bold text-white">데이터 수정</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-white/70 hover:text-white text-2xl transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <DataEditor
                data={editingInsight}
                images={[]}
                onSave={handleDataUpdated}
                onCancel={handleCancelEdit}
              />
            </div>
          </div>
        </div>
      )}

      {/* 월별 보고서 모달 */}
      {showMonthlyReportModal && selectedMonthlyInsights.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowMonthlyReportModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-[80vw] max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0 z-10">
              <h2 className="text-xl font-bold text-white">당 월 보고서</h2>
              <button
                onClick={() => setShowMonthlyReportModal(false)}
                className="text-white/70 hover:text-white text-2xl transition-colors"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <div className="p-4">
                <ReportView
                  business={business}
                  insights={selectedMonthlyInsights}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 비교 보고서 모달 */}
      {showComparisonReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowComparisonReportModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-[80vw] max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between rounded-t-2xl flex-shrink-0 z-10">
              <h2 className="text-xl font-bold text-white">비교 보고서 생성</h2>
              <button
                onClick={() => setShowComparisonReportModal(false)}
                className="text-white/70 hover:text-white text-2xl transition-colors"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              <div className="p-4">
                <ReportView
                  business={business}
                  insights={insights}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

