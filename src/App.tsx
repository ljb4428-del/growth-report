import { useState, useEffect } from 'react';
import { Business } from './types';
import { businessAPI } from './utils/api';
import { logger } from './utils/logger';
import BusinessSelector from './components/BusinessSelector';
import Dashboard from './components/Dashboard';
import LogViewer from './components/LogViewer';
import { Building2 } from 'lucide-react';

function App() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

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
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Building2 className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Growth Report
                </h1>
                <p className="text-sm text-gray-500">
                  인스타그램 인사이트 월별 비교 보고서
                </p>
              </div>
            </div>
            
            {selectedBusiness && (
              <BusinessSelector
                businesses={businesses}
                selectedBusiness={selectedBusiness}
                onSelect={setSelectedBusiness}
                onCreate={handleCreateBusiness}
                onUpdate={handleUpdateBusiness}
                onDelete={handleDeleteBusiness}
              />
            )}
          </div>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedBusiness ? (
          <Dashboard business={selectedBusiness} />
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
    </div>
  );
}

export default App;

