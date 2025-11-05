import { ApiResponse, Business, InsightData, AISettings } from '../types';
import { logger } from './logger';

const API_BASE = '/api';

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    const data = await response.json();
    
    if (!response.ok) {
      logger.error('API 요청 실패', data.error || `Status: ${response.status}`);
      return {
        success: false,
        error: data.error || `Request failed with status ${response.status}`,
      };
    }
    
    return data;
  } catch (error) {
    logger.error('API 응답 파싱 실패', error as Error);
    return {
      success: false,
      error: 'Failed to parse response',
    };
  }
}

// 비즈니스 관리 API
export const businessAPI = {
  async getAll(): Promise<ApiResponse<Business[]>> {
    logger.info('비즈니스 목록 조회 시작');
    try {
      const response = await fetch(`${API_BASE}/businesses`);
      const result = await handleResponse<Business[]>(response);
      if (result.success) {
        logger.success('비즈니스 목록 조회 완료', { count: result.data?.length });
      }
      return result;
    } catch (error) {
      logger.error('비즈니스 목록 조회 실패', error as Error);
      return { success: false, error: (error as Error).message };
    }
  },

  async create(name: string, description?: string): Promise<ApiResponse<Business>> {
    logger.info('비즈니스 생성 시작', { name, description });
    try {
      const response = await fetch(`${API_BASE}/businesses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      const result = await handleResponse<Business>(response);
      if (result.success) {
        logger.success('비즈니스 생성 완료', result.data);
      }
      return result;
    } catch (error) {
      logger.error('비즈니스 생성 실패', error as Error);
      return { success: false, error: (error as Error).message };
    }
  },

  async update(id: string, name: string, description?: string): Promise<ApiResponse<Business>> {
    logger.info('비즈니스 수정 시작', { id, name });
    try {
      const response = await fetch(`${API_BASE}/businesses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      const result = await handleResponse<Business>(response);
      if (result.success) {
        logger.success('비즈니스 수정 완료', result.data);
      }
      return result;
    } catch (error) {
      logger.error('비즈니스 수정 실패', error as Error);
      return { success: false, error: (error as Error).message };
    }
  },

  async delete(id: string): Promise<ApiResponse<void>> {
    logger.info('비즈니스 삭제 시작', { id });
    try {
      const response = await fetch(`${API_BASE}/businesses/${id}`, {
        method: 'DELETE',
      });
      const result = await handleResponse<void>(response);
      if (result.success) {
        logger.success('비즈니스 삭제 완료', { id });
      }
      return result;
    } catch (error) {
      logger.error('비즈니스 삭제 실패', error as Error);
      return { success: false, error: (error as Error).message };
    }
  },
};

// 인사이트 데이터 API
export const insightAPI = {
  async getAll(businessId: string): Promise<ApiResponse<InsightData[]>> {
    logger.info('인사이트 데이터 조회 시작', { businessId });
    try {
      const response = await fetch(`${API_BASE}/insights/${businessId}`);
      const result = await handleResponse<InsightData[]>(response);
      if (result.success) {
        logger.success('인사이트 데이터 조회 완료', { count: result.data?.length });
      }
      return result;
    } catch (error) {
      logger.error('인사이트 데이터 조회 실패', error as Error);
      return { success: false, error: (error as Error).message };
    }
  },

  async create(data: Partial<InsightData>): Promise<ApiResponse<InsightData>> {
    logger.info('인사이트 데이터 생성 시작', { businessId: data.businessId, year: data.year, month: data.month, period: data.period });
    try {
      const response = await fetch(`${API_BASE}/insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await handleResponse<InsightData>(response);
      if (result.success) {
        logger.success('인사이트 데이터 생성 완료', result.data);
      }
      return result;
    } catch (error) {
      logger.error('인사이트 데이터 생성 실패', error as Error);
      return { success: false, error: (error as Error).message };
    }
  },

  async update(id: string, data: Partial<InsightData>): Promise<ApiResponse<InsightData>> {
    logger.info('인사이트 데이터 수정 시작', { id });
    try {
      const response = await fetch(`${API_BASE}/insights/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await handleResponse<InsightData>(response);
      if (result.success) {
        logger.success('인사이트 데이터 수정 완료', result.data);
      }
      return result;
    } catch (error) {
      logger.error('인사이트 데이터 수정 실패', error as Error);
      return { success: false, error: (error as Error).message };
    }
  },
};

// AI 변환 API
export const aiAPI = {
  async convertImage(file: File, provider: 'openai' | 'gemini', apiKey: string): Promise<ApiResponse<Partial<InsightData>>> {
    logger.info('이미지 AI 변환 시작', { fileName: file.name, provider, fileSize: file.size });
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('provider', provider);
      formData.append('apiKey', apiKey);

      const response = await fetch(`${API_BASE}/ai/convert`, {
        method: 'POST',
        body: formData,
      });
      const result = await handleResponse<Partial<InsightData>>(response);
      if (result.success) {
        logger.success('이미지 AI 변환 완료', result.data);
      }
      return result;
    } catch (error) {
      logger.error('이미지 AI 변환 실패', error as Error);
      return { success: false, error: (error as Error).message };
    }
  },
};

// 설정 API
export const settingsAPI = {
  async getAISettings(): Promise<ApiResponse<AISettings>> {
    logger.info('AI 설정 조회 시작');
    try {
      const response = await fetch(`${API_BASE}/settings/ai`);
      const result = await handleResponse<AISettings>(response);
      if (result.success) {
        logger.success('AI 설정 조회 완료');
      }
      return result;
    } catch (error) {
      logger.error('AI 설정 조회 실패', error as Error);
      return { success: false, error: (error as Error).message };
    }
  },

  async saveAISettings(settings: AISettings): Promise<ApiResponse<AISettings>> {
    logger.info('AI 설정 저장 시작', { provider: settings.provider });
    try {
      const response = await fetch(`${API_BASE}/settings/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const result = await handleResponse<AISettings>(response);
      if (result.success) {
        logger.success('AI 설정 저장 완료');
      }
      return result;
    } catch (error) {
      logger.error('AI 설정 저장 실패', error as Error);
      return { success: false, error: (error as Error).message };
    }
  },
};

// 이미지 업로드 API
export const uploadAPI = {
  async uploadImage(file: File, businessId: string, section: string): Promise<ApiResponse<{ url: string }>> {
    logger.info('이미지 업로드 시작', { fileName: file.name, businessId, section });
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('businessId', businessId);
      formData.append('section', section);

      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });
      const result = await handleResponse<{ url: string }>(response);
      if (result.success) {
        logger.success('이미지 업로드 완료', result.data);
      }
      return result;
    } catch (error) {
      logger.error('이미지 업로드 실패', error as Error);
      return { success: false, error: (error as Error).message };
    }
  },
};

