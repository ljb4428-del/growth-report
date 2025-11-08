import { useState } from 'react';
import { InsightData } from '../types';
import { formatDate } from '../utils/helpers';
import { Image as ImageIcon } from 'lucide-react';

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
    if (num === undefined || num === null || num === '') return '';
    const numValue = typeof num === 'string' ? parseFloat(num.replace(/,/g, '')) : num;
    if (isNaN(numValue) || numValue === 0) return '';
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
    <div className="space-y-4">
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
      <form onSubmit={handleSubmit} className="card flex flex-col min-h-0">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">추출된 데이터 확인 및 수정</h2>
        </div>

        <div className="flex gap-8 flex-1 min-h-0">
          {/* 좌측 컬럼 */}
          <div className="flex-1 space-y-4 min-w-0 bg-gray-50 rounded-lg p-5 border border-gray-200">
            {/* 기본 정보 */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">기본 정보</h3>
              
              {/* 인스타그램 계정 정보 */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업체명
                  </label>
                  <input
                    type="text"
                    value={data.businessName || ''}
                    onChange={(e) => updateField('businessName', e.target.value)}
                    className="input-field"
                    placeholder="예: 린다데코"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    인스타그램 계정 ID
                  </label>
                  <input
                    type="text"
                    value={data.instagramId || ''}
                    onChange={(e) => updateField('instagramId', e.target.value)}
                    className="input-field"
                    placeholder="예: linda_deco"
                  />
                </div>
              </div>

              {/* 기본 정보 (년도, 월, 기간) */}
              <div className="grid grid-cols-3 gap-4">
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
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">조회</h3>
              <div className="grid grid-cols-2 gap-4">
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
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">콘텐츠 유형별</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    게시물
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={data.contentTypes?.posts && data.contentTypes.posts !== 0 ? data.contentTypes.posts : ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      updateField('contentTypes.posts', isNaN(value) ? 0 : Math.round(value * 10) / 10);
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
                    value={data.contentTypes?.stories && data.contentTypes.stories !== 0 ? data.contentTypes.stories : ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      updateField('contentTypes.stories', isNaN(value) ? 0 : Math.round(value * 10) / 10);
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
                    value={data.contentTypes?.reels && data.contentTypes.reels !== 0 ? data.contentTypes.reels : ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      updateField('contentTypes.reels', isNaN(value) ? 0 : Math.round(value * 10) / 10);
                    }}
                    className="input-field"
                    placeholder="예: 20 또는 20.3"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 우측 컬럼 */}
          <div className="flex-1 space-y-4 min-w-0 bg-gray-50 rounded-lg p-5 border border-gray-200">
            {/* 기타 지표 */}
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">기타 지표</h3>
              <div className="grid grid-cols-3 gap-4">
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
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                프로필 활동
                <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                  중요
                </span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
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
        </div>

        {/* 하단 버튼 */}
        <div className="flex items-center justify-end space-x-2 pt-4 mt-4 border-t border-gray-200">
          <button type="button" onClick={onCancel} className="btn-secondary">
            취소
          </button>
          <button type="submit" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-2 rounded-lg font-medium transition-all shadow-md hover:shadow-lg">
            저장
          </button>
        </div>
      </form>
    </div>
  );
}

