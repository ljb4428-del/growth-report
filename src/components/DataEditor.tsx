import { useState } from 'react';
import { InsightData } from '../types';
import { formatDate } from '../utils/helpers';
import { Save, X, Image as ImageIcon } from 'lucide-react';

interface Props {
  data: Partial<InsightData>;
  images: File[];
  onSave: (data: Partial<InsightData>) => void;
  onCancel: () => void;
}

export default function DataEditor({ data: initialData, images, onSave, onCancel }: Props) {
  const [data, setData] = useState<Partial<InsightData>>(initialData);
  const [showImages, setShowImages] = useState(true);

  // 숫자를 쉼표 포맷으로 변환 (예: 1000 -> "1,000")
  function formatNumberWithComma(num: number | string | undefined): string {
    if (num === undefined || num === null || num === '') return '0';
    const numValue = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
    if (isNaN(numValue)) return '0';
    return new Intl.NumberFormat('ko-KR').format(numValue);
  }

  // 쉼표 포맷 문자열을 숫자로 변환 (예: "1,000" -> 1000)
  function parseNumberFromComma(str: string): number {
    if (!str || str === '') return 0;
    const cleaned = str.replace(/,/g, '');
    const num = parseInt(cleaned);
    return isNaN(num) ? 0 : num;
  }

  function updateField(path: string, value: any) {
    const parts = path.split('.');
    const newData = { ...data };
    let current: any = newData;
    
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    current[parts[parts.length - 1]] = value;
    setData(newData);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(data);
  }

  return (
    <div className="space-y-6">
      {/* 원본 이미지 보기 */}
      {images.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">원본 이미지</h3>
            <button
              onClick={() => setShowImages(!showImages)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              {showImages ? '숨기기' : '보기'}
            </button>
          </div>
          
          {showImages && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((file, index) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Screenshot ${index + 1}`}
                    className="w-full h-auto"
                  />
                  <div className="p-2 bg-gray-50">
                    <p className="text-xs text-gray-600 truncate">{file.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 데이터 편집 폼 */}
      <form onSubmit={handleSubmit} className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">추출된 데이터 확인 및 수정</h2>
          <div className="flex items-center space-x-2">
            <button type="button" onClick={onCancel} className="btn-secondary">
              <X className="w-4 h-4 inline mr-2" />
              취소
            </button>
            <button type="submit" className="btn-primary">
              <Save className="w-4 h-4 inline mr-2" />
              저장
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* 기본 정보 */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  년도 *
                </label>
                <input
                  type="number"
                  value={data.year || new Date().getFullYear()}
                  onChange={(e) => updateField('year', parseInt(e.target.value))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  월 *
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={data.month || new Date().getMonth() + 1}
                  onChange={(e) => updateField('month', parseInt(e.target.value))}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  기간 *
                </label>
                <select
                  value={data.period || '30days'}
                  onChange={(e) => updateField('period', e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="14days">14일</option>
                  <option value="30days">30일</option>
                </select>
              </div>
            </div>
          </div>

          {/* 조회 관련 */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">조회</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  도달한 계정
                </label>
                <input
                  type="text"
                  value={formatNumberWithComma(data.views?.reachedAccounts)}
                  onChange={(e) => updateField('views.reachedAccounts', parseNumberFromComma(e.target.value))}
                  className="input-field"
                  placeholder="예: 39,983"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  조회 수
                </label>
                <input
                  type="text"
                  value={formatNumberWithComma(data.views?.totalViews)}
                  onChange={(e) => updateField('views.totalViews', parseNumberFromComma(e.target.value))}
                  className="input-field"
                  placeholder="예: 259,701"
                />
              </div>
            </div>
          </div>

          {/* 콘텐츠 유형 */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">콘텐츠 유형별</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  게시물
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={data.contentTypes?.posts || 0}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    updateField('contentTypes.posts', Math.round(value * 10) / 10);
                  }}
                  className="input-field"
                  placeholder="예: 6 또는 6.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  스토리
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={data.contentTypes?.stories || 0}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    updateField('contentTypes.stories', Math.round(value * 10) / 10);
                  }}
                  className="input-field"
                  placeholder="예: 4 또는 4.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  릴스
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={data.contentTypes?.reels || 0}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    updateField('contentTypes.reels', Math.round(value * 10) / 10);
                  }}
                  className="input-field"
                  placeholder="예: 20 또는 20.3"
                />
              </div>
            </div>
          </div>

          {/* 기타 지표 */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">기타 지표</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  조회수
                </label>
                <input
                  type="text"
                  value={formatNumberWithComma(data.metrics?.totalViews)}
                  onChange={(e) => updateField('metrics.totalViews', parseNumberFromComma(e.target.value))}
                  className="input-field"
                  placeholder="예: 15,000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  반응
                </label>
                <input
                  type="text"
                  value={formatNumberWithComma(data.metrics?.reactions)}
                  onChange={(e) => updateField('metrics.reactions', parseNumberFromComma(e.target.value))}
                  className="input-field"
                  placeholder="예: 1,234"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  새 팔로워
                </label>
                <input
                  type="text"
                  value={formatNumberWithComma(data.metrics?.newFollowers)}
                  onChange={(e) => updateField('metrics.newFollowers', parseNumberFromComma(e.target.value))}
                  className="input-field"
                  placeholder="예: 567"
                />
              </div>
            </div>
          </div>

          {/* 프로필 활동 (가장 중요) */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              프로필 활동
              <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                중요
              </span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  전체 수치
                </label>
                <input
                  type="text"
                  value={formatNumberWithComma(data.profileActivity?.total)}
                  onChange={(e) => updateField('profileActivity.total', parseNumberFromComma(e.target.value))}
                  className="input-field"
                  placeholder="예: 23,685"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  프로필 방문
                </label>
                <input
                  type="text"
                  value={formatNumberWithComma(data.profileActivity?.profileVisits)}
                  onChange={(e) => updateField('profileActivity.profileVisits', parseNumberFromComma(e.target.value))}
                  className="input-field"
                  placeholder="예: 22,816"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  외부링크 누름
                </label>
                <input
                  type="text"
                  value={formatNumberWithComma(data.profileActivity?.externalLinkTaps)}
                  onChange={(e) => updateField('profileActivity.externalLinkTaps', parseNumberFromComma(e.target.value))}
                  className="input-field"
                  placeholder="예: 1,234"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  비즈니스 주소 누름
                </label>
                <input
                  type="text"
                  value={formatNumberWithComma(data.profileActivity?.businessAddressTaps)}
                  onChange={(e) => updateField('profileActivity.businessAddressTaps', parseNumberFromComma(e.target.value))}
                  className="input-field"
                  placeholder="예: 567"
                />
              </div>
            </div>
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              메모 (선택)
            </label>
            <textarea
              value={data.notes || ''}
              onChange={(e) => updateField('notes', e.target.value)}
              className="input-field"
              rows={3}
              placeholder="추가적인 메모나 설명을 입력하세요"
            />
          </div>
        </div>
      </form>
    </div>
  );
}

