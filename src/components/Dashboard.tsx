import { useState, useEffect } from 'react';
import { Business, InsightData } from '../types';
import { insightAPI } from '../utils/api';
import { Upload, BarChart3, FileText } from 'lucide-react';
import DataUpload from './DataUpload';
import ReportView from './ReportView';
import DataList from './DataList';
import DataEditor from './DataEditor';

interface Props {
  business: Business;
}

type ViewMode = 'list' | 'upload' | 'report' | 'edit';

export default function Dashboard({ business }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [insights, setInsights] = useState<InsightData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingInsight, setEditingInsight] = useState<InsightData | null>(null);

  useEffect(() => {
    loadInsights();
  }, [business.id]);

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
    setViewMode('list');
  }

  function handleEditClick(insight: InsightData) {
    setEditingInsight(insight);
    setViewMode('edit');
  }

  async function handleDataUpdated(data: Partial<InsightData>) {
    if (!editingInsight) return;

    const result = await insightAPI.update(editingInsight.id, data);
    
    if (result.success) {
      loadInsights();
      setViewMode('list');
      setEditingInsight(null);
    }
  }

  function handleCancelEdit() {
    setEditingInsight(null);
    setViewMode('list');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center space-x-2 px-6 py-3 border-b-2 transition-colors ${
              viewMode === 'list'
                ? 'border-primary-600 text-primary-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span>데이터 목록</span>
          </button>
          
          <button
            onClick={() => setViewMode('upload')}
            className={`flex items-center space-x-2 px-6 py-3 border-b-2 transition-colors ${
              viewMode === 'upload'
                ? 'border-primary-600 text-primary-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Upload className="w-5 h-5" />
            <span>데이터 업로드</span>
          </button>
          
          <button
            onClick={() => setViewMode('report')}
            className={`flex items-center space-x-2 px-6 py-3 border-b-2 transition-colors ${
              viewMode === 'report'
                ? 'border-primary-600 text-primary-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            disabled={insights.length === 0}
          >
            <FileText className="w-5 h-5" />
            <span>보고서 생성</span>
          </button>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div>
        {viewMode === 'list' && (
          <DataList
            business={business}
            insights={insights}
            onRefresh={loadInsights}
            onUploadClick={() => setViewMode('upload')}
            onEditClick={handleEditClick}
          />
        )}
        
        {viewMode === 'upload' && (
          <DataUpload
            business={business}
            onSuccess={handleDataUploaded}
          />
        )}
        
        {viewMode === 'edit' && editingInsight && (
          <DataEditor
            data={editingInsight}
            images={[]}
            onSave={handleDataUpdated}
            onCancel={handleCancelEdit}
          />
        )}
        
        {viewMode === 'report' && (
          <ReportView
            business={business}
            insights={insights}
          />
        )}
      </div>
    </div>
  );
}

