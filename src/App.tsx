import { useState, useEffect } from 'react';
import { Business, AISettings } from './types';
import { businessAPI, settingsAPI } from './utils/api';
import { logger } from './utils/logger';
import Dashboard from './components/Dashboard';
import LogViewer from './components/LogViewer';
import { Building2, Settings } from 'lucide-react';

function App() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAISettingsModal, setShowAISettingsModal] = useState(false);
  const [aiSettings, setAiSettings] = useState<AISettings>({ provider: 'openai', apiKey: '' });

  useEffect(() => {
    loadBusinesses();
  }, []);

  async function loadBusinesses() {
    setLoading(true);
    logger.info('앱 초기화 시작');
    
    const result = await businessAPI.getAll();
    
    if (result.success && result.data) {
      setBusinesses(result.data);
      if (result.data.length > 0) {
        setSelectedBusiness(result.data[0]);
        logger.info('기본 비즈니스 선택됨', { name: result.data[0].name });
      }
    } else {
      logger.warning('비즈니스가 없습니다. 새로 생성해주세요.');
    }
    
    setLoading(false);
  }

  async function handleCreateBusiness(name: string, description?: string) {
    const result = await businessAPI.create(name, description);
    
    if (result.success && result.data) {
      setBusinesses([...businesses, result.data]);
      setSelectedBusiness(result.data);
      return true;
    }
    
    return false;
  }

  async function handleUpdateBusiness(id: string, name: string, description?: string) {
    const result = await businessAPI.update(id, name, description);
    
    if (result.success && result.data) {
      setBusinesses(businesses.map(b => b.id === id ? result.data! : b));
      if (selectedBusiness?.id === id) {
        setSelectedBusiness(result.data);
      }
      return true;
    }
    
    return false;
  }

  async function handleDeleteBusiness(id: string) {
    const result = await businessAPI.delete(id);
    
    if (result.success) {
      const newBusinesses = businesses.filter(b => b.id !== id);
      setBusinesses(newBusinesses);
      
      if (selectedBusiness?.id === id) {
        setSelectedBusiness(newBusinesses[0] || null);
      }
      
      return true;
    }
    
    return false;
  }

  async function handleOpenAISettings() {
    const result = await settingsAPI.getAISettings();
    if (result.success && result.data) {
      setAiSettings(result.data);
    }
    setShowAISettingsModal(true);
  }

  async function handleSaveAISettings() {
    const result = await settingsAPI.saveAISettings(aiSettings);
    if (result.success) {
      setShowAISettingsModal(false);
      alert('AI 설정이 저장되었습니다.');
    } else {
      alert('AI 설정 저장에 실패했습니다.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Growth Report
            </h1>
            <p className="text-purple-100 text-sm mt-1">
              인스타그램 인사이트 월별 비교 보고서
            </p>
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {selectedBusiness ? (
          <Dashboard 
            business={selectedBusiness}
            businesses={businesses}
            onSelectBusiness={setSelectedBusiness}
            onShowAISettings={handleOpenAISettings}
          />
        ) : (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              비즈니스가 없습니다
            </h2>
            <p className="text-gray-600 mb-6">
              새로운 비즈니스를 생성하여 인사이트 데이터를 관리하세요.
            </p>
            <button
              onClick={() => {
                const name = prompt('비즈니스 이름을 입력하세요:');
                if (name) {
                  handleCreateBusiness(name);
                }
              }}
              className="btn-primary"
            >
              비즈니스 생성
            </button>
          </div>
        )}
      </main>

      {/* 로그 뷰어 */}
      <LogViewer />

      {/* AI 설정 모달 */}
      {showAISettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 rounded-t-2xl">
              <h2 className="text-xl font-bold text-white">AI API 설정</h2>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  AI 제공자 선택
                </label>
                <select
                  value={aiSettings.provider}
                  onChange={(e) =>
                    setAiSettings({ ...aiSettings, provider: e.target.value as 'openai' | 'gemini' | 'ocrspace' })
                  }
                  className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none bg-gray-50 text-gray-900"
                >
                  <option value="openai">OpenAI (GPT-4o)</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="ocrspace">OCR.space (무료)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  API 키
                </label>
                <input
                  type="password"
                  value={aiSettings.apiKey}
                  onChange={(e) =>
                    setAiSettings({ ...aiSettings, apiKey: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none bg-gray-50 text-gray-900"
                  placeholder="API 키를 입력하세요"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {aiSettings.provider === 'openai' && 'OpenAI 계정에서 API 키를 발급받으세요 (https://platform.openai.com/api-keys)'}
                  {aiSettings.provider === 'gemini' && 'Google AI Studio에서 API 키를 발급받으세요 (https://makersuite.google.com/app/apikey)'}
                  {aiSettings.provider === 'ocrspace' && 'OCR.space에서 무료 API 키를 발급받으세요 (https://ocr.space/ocrapi)'}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowAISettingsModal(false)}
                className="px-5 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                취소
              </button>
              <button 
                onClick={handleSaveAISettings} 
                className="px-5 py-2 text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

