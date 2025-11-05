import { useState, useEffect } from 'react';
import { Business, InsightData } from '../types';
import { aiAPI, insightAPI } from '../utils/api';
import { logger } from '../utils/logger';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import DataEditor from './DataEditor';

interface Props {
  business: Business;
  onSuccess: () => void;
}

export default function DataUpload({ business, onSuccess }: Props) {
  const [step, setStep] = useState<'upload' | 'settings' | 'converting' | 'editing' | 'manual'>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [extractedData, setExtractedData] = useState<Partial<InsightData> | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [inputMode, setInputMode] = useState<'upload' | 'manual'>('manual');

  // 수동 입력 탭 선택 시 자동으로 폼 표시
  useEffect(() => {
    if (inputMode === 'manual' && !extractedData) {
      const emptyData: Partial<InsightData> = {
        businessId: business.id,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        period: '30days',
        views: { reachedAccounts: 0, totalViews: 0 },
        contentTypes: { posts: 0, stories: 0, reels: 0 },
        metrics: { totalViews: 0, reactions: 0, newFollowers: 0 },
        profileActivity: { total: 0, profileVisits: 0, externalLinkTaps: 0, businessAddressTaps: 0 },
      };
      setExtractedData(emptyData);
    }
  }, [inputMode, business.id]);

  // 파일 드롭 핸들러
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('image/')
    );
    
    if (droppedFiles.length > 0) {
      setFiles([...files, ...droppedFiles]);
      logger.info('이미지 파일 추가됨', { count: droppedFiles.length });
    }
  }

  // 파일 선택 핸들러
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles([...files, ...selectedFiles]);
      logger.info('이미지 파일 선택됨', { count: selectedFiles.length });
    }
  }

  // 파일 제거
  function removeFile(index: number) {
    setFiles(files.filter((_, i) => i !== index));
  }

  // AI 변환 시작
  async function startConversion() {
    if (files.length === 0) {
      alert('최소 1개 이상의 이미지를 업로드해주세요.');
      return;
    }

    if (!aiSettings.apiKey) {
      alert('AI API 키를 설정해주세요.');
      setShowSettings(true);
      return;
    }

    setStep('converting');
    logger.info('AI 변환 시작', { fileCount: files.length, provider: aiSettings.provider });

    try {
      // 첫 번째 이미지로 변환 (여러 이미지를 한 번에 처리하는 경우 여기서 로직 추가)
      const result = await aiAPI.convertImage(files[0], aiSettings.provider, aiSettings.apiKey);
      
      if (result.success && result.data) {
        setExtractedData({
          ...result.data,
          businessId: business.id,
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          period: '30days', // 기본값
        });
        setStep('editing');
      } else {
        logger.error('AI 변환 실패', result.error || '알 수 없는 오류');
        alert('AI 변환에 실패했습니다: ' + result.error);
        setStep('upload');
      }
    } catch (error) {
      logger.error('AI 변환 중 오류 발생', error as Error);
      alert('AI 변환 중 오류가 발생했습니다.');
      setStep('upload');
    }
  }

  // 데이터 저장
  async function handleSave(data: Partial<InsightData>) {
    try {
      // 먼저 이미지 업로드
      const uploadedImages: string[] = [];
      
      if (files.length > 0) {
        logger.info('이미지 업로드 시작', { count: files.length });
        
        for (const file of files) {
          const formData = new FormData();
          formData.append('image', file);
          formData.append('businessId', business.id);
          
          const response = await fetch('http://localhost:3000/api/upload/image', {
            method: 'POST',
            body: formData,
          });
          
          if (response.ok) {
            const result = await response.json();
            uploadedImages.push(result.data.filename);
          } else {
            logger.error('이미지 업로드 실패', file.name);
          }
        }
        
        logger.success('이미지 업로드 완료', { count: uploadedImages.length });
      }
      
      // 이미지 경로 포함하여 데이터 저장
      const dataWithImages = {
        ...data,
        originalImages: uploadedImages,
      };
      
      const result = await insightAPI.create(dataWithImages);
      
      if (result.success) {
        logger.success('인사이트 데이터 저장 완료');
        alert('데이터가 저장되었습니다!');
        onSuccess();
      } else {
        logger.error('데이터 저장 실패', result.error || '알 수 없는 오류');
        alert('데이터 저장에 실패했습니다: ' + result.error);
      }
    } catch (error) {
      logger.error('저장 중 오류 발생', error as Error);
      alert('저장 중 오류가 발생했습니다.');
    }
  }


  if (step === 'editing' && extractedData) {
    return (
      <DataEditor
        data={extractedData}
        images={files}
        onSave={handleSave}
        onCancel={() => {
          setStep('upload');
          setExtractedData(null);
        }}
      />
    );
  }

  if (step === 'converting') {
    return (
      <div className="card text-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4"></div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          AI가 이미지를 분석하고 있습니다...
        </h3>
        <p className="text-gray-600">
          잠시만 기다려주세요. 이미지에서 데이터를 추출하는 중입니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 입력 모드 탭 - 컴팩트 */}
      <div className="flex space-x-1 border-b border-gray-200 pb-2">
        <button
          onClick={() => setInputMode('manual')}
          className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${
            inputMode === 'manual'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          ✏️ 수동 입력
        </button>
        <button
          onClick={() => setInputMode('upload')}
          className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${
            inputMode === 'upload'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          📸 이미지 업로드
        </button>
      </div>

      {/* 수동 입력 모드 */}
      {inputMode === 'manual' && extractedData && (
        <DataEditor
          data={extractedData}
          images={[]}
          onSave={handleSave}
          onCancel={() => {
            setInputMode('upload');
            setExtractedData(null);
          }}
        />
      )}

      {/* 업로드 영역 */}
      {inputMode === 'upload' && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            인스타그램 인사이트 스크린샷 업로드
          </h2>
          
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-primary-400'
            }`}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              이미지를 드래그 앤 드롭하거나 클릭하여 선택
            </h3>
            <p className="text-gray-600 mb-4">
              PNG, JPG, JPEG 형식의 이미지 파일을 업로드하세요
            </p>
            
            <label className="btn-primary cursor-pointer inline-block">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              파일 선택
            </label>
          </div>

          {/* 선택된 파일 목록 */}
          {files.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="font-semibold text-gray-900">
                선택된 이미지 ({files.length}개)
              </h3>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <ImageIcon className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <X className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={startConversion}
                className="btn-primary w-full mt-4"
                disabled={!aiSettings.apiKey}
              >
                AI로 데이터 추출 시작
              </button>
              
              {!aiSettings.apiKey && (
                <p className="text-sm text-red-600 text-center mt-2">
                  ⚠️ AI API 키를 먼저 설정해주세요
                </p>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

