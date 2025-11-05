import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import multer from 'multer';
import OpenAI from 'openai';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 5000;

// 미들웨어
app.use(cors());
app.use(express.json({ limit: '50mb'}));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 데이터 디렉토리 경로
const DATA_DIR = path.join(__dirname, '../data');
const UPLOADS_DIR = path.join(__dirname, '../uploads');

// 디렉토리 생성
async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

// 파일 업로드 설정
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureDir(UPLOADS_DIR);
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// 로그 함수
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, data || '');
}

// ==================== 비즈니스 API ====================

// 비즈니스 목록 조회
app.get('/api/businesses', async (req, res) => {
  try {
    log('info', '비즈니스 목록 조회 요청');
    await ensureDir(DATA_DIR);
    
    const filePath = path.join(DATA_DIR, 'businesses.json');
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const businesses = JSON.parse(data);
      log('success', '비즈니스 목록 조회 성공', { count: businesses.length });
      res.json({ success: true, data: businesses });
    } catch {
      log('info', '비즈니스 파일 없음, 빈 배열 반환');
      res.json({ success: true, data: [] });
    }
  } catch (error) {
    log('error', '비즈니스 목록 조회 실패', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 비즈니스 생성
app.post('/api/businesses', async (req, res) => {
  try {
    const { name, description } = req.body;
    log('info', '비즈니스 생성 요청', { name });

    const business = {
      id: `biz-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await ensureDir(DATA_DIR);
    const filePath = path.join(DATA_DIR, 'businesses.json');
    let businesses = [];
    
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      businesses = JSON.parse(data);
    } catch {}

    businesses.push(business);
    await fs.writeFile(filePath, JSON.stringify(businesses, null, 2));

    // 비즈니스 데이터 디렉토리 생성
    await ensureDir(path.join(DATA_DIR, business.id));

    log('success', '비즈니스 생성 완료', business);
    res.json({ success: true, data: business });
  } catch (error) {
    log('error', '비즈니스 생성 실패', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 비즈니스 수정
app.put('/api/businesses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    log('info', '비즈니스 수정 요청', { id, name });

    await ensureDir(DATA_DIR);
    const filePath = path.join(DATA_DIR, 'businesses.json');
    const data = await fs.readFile(filePath, 'utf-8');
    let businesses = JSON.parse(data);

    const index = businesses.findIndex(b => b.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Business not found' });
    }

    businesses[index] = {
      ...businesses[index],
      name,
      description,
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(filePath, JSON.stringify(businesses, null, 2));

    log('success', '비즈니스 수정 완료', businesses[index]);
    res.json({ success: true, data: businesses[index] });
  } catch (error) {
    log('error', '비즈니스 수정 실패', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 비즈니스 삭제
app.delete('/api/businesses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    log('info', '비즈니스 삭제 요청', { id });

    await ensureDir(DATA_DIR);
    const filePath = path.join(DATA_DIR, 'businesses.json');
    const data = await fs.readFile(filePath, 'utf-8');
    let businesses = JSON.parse(data);

    businesses = businesses.filter(b => b.id !== id);
    await fs.writeFile(filePath, JSON.stringify(businesses, null, 2));

    log('success', '비즈니스 삭제 완료', { id });
    res.json({ success: true });
  } catch (error) {
    log('error', '비즈니스 삭제 실패', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== 인사이트 데이터 API ====================

// 인사이트 데이터 조회
app.get('/api/insights/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    log('info', '인사이트 데이터 조회 요청', { businessId });

    const businessDir = path.join(DATA_DIR, businessId);
    const insights = [];

    try {
      const years = await fs.readdir(businessDir);
      
      for (const year of years) {
        const yearPath = path.join(businessDir, year);
        const stat = await fs.stat(yearPath);
        
        if (stat.isDirectory()) {
          const months = await fs.readdir(yearPath);
          
          for (const month of months) {
            const monthPath = path.join(yearPath, month);
            const monthStat = await fs.stat(monthPath);
            
            if (monthStat.isDirectory()) {
              const files = await fs.readdir(monthPath);
              
              for (const file of files) {
                if (file.endsWith('.json')) {
                  const filePath = path.join(monthPath, file);
                  const fileData = await fs.readFile(filePath, 'utf-8');
                  insights.push(JSON.parse(fileData));
                }
              }
            }
          }
        }
      }
    } catch (error) {
      // 디렉토리가 없으면 빈 배열 반환
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    log('success', '인사이트 데이터 조회 완료', { count: insights.length });
    res.json({ success: true, data: insights });
  } catch (error) {
    log('error', '인사이트 데이터 조회 실패', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 인사이트 데이터 생성
app.post('/api/insights', async (req, res) => {
  try {
    const insightData = req.body;
    log('info', '인사이트 데이터 생성 요청', { 
      businessId: insightData.businessId, 
      year: insightData.year, 
      month: insightData.month,
      period: insightData.period 
    });

    const insight = {
      ...insightData,
      id: `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 파일 경로 생성
    const dirPath = path.join(DATA_DIR, insight.businessId, String(insight.year), String(insight.month));
    await ensureDir(dirPath);

    const fileName = `${insight.period}.json`;
    const filePath = path.join(dirPath, fileName);

    await fs.writeFile(filePath, JSON.stringify(insight, null, 2));

    log('success', '인사이트 데이터 생성 완료', insight);
    res.json({ success: true, data: insight });
  } catch (error) {
    log('error', '인사이트 데이터 생성 실패', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 인사이트 데이터 수정
app.put('/api/insights/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    log('info', '인사이트 데이터 수정 요청', { id });

    // 모든 인사이트 데이터를 찾아서 수정
    const { businessId } = updates;
    const businessDir = path.join(DATA_DIR, businessId);

    const years = await fs.readdir(businessDir);
    let found = false;

    for (const year of years) {
      const yearPath = path.join(businessDir, year);
      const stat = await fs.stat(yearPath);
      
      if (stat.isDirectory()) {
        const months = await fs.readdir(yearPath);
        
        for (const month of months) {
          const monthPath = path.join(yearPath, month);
          const monthStat = await fs.stat(monthPath);
          
          if (monthStat.isDirectory()) {
            const files = await fs.readdir(monthPath);
            
            for (const file of files) {
              if (file.endsWith('.json')) {
                const filePath = path.join(monthPath, file);
                const fileData = await fs.readFile(filePath, 'utf-8');
                const insight = JSON.parse(fileData);
                
                if (insight.id === id) {
                  const updated = {
                    ...insight,
                    ...updates,
                    id: insight.id,
                    createdAt: insight.createdAt,
                    updatedAt: new Date().toISOString(),
                  };
                  
                  await fs.writeFile(filePath, JSON.stringify(updated, null, 2));
                  log('success', '인사이트 데이터 수정 완료', updated);
                  res.json({ success: true, data: updated });
                  found = true;
                  break;
                }
              }
            }
            if (found) break;
          }
        }
        if (found) break;
      }
    }

    if (!found) {
      res.status(404).json({ success: false, error: 'Insight not found' });
    }
  } catch (error) {
    log('error', '인사이트 데이터 수정 실패', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== AI 변환 API ====================

app.post('/api/ai/convert', upload.single('image'), async (req, res) => {
  try {
    const { provider, apiKey } = req.body;
    const file = req.file;

    log('info', 'AI 이미지 변환 요청', { provider, fileName: file?.originalname });

    if (!file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    if (!apiKey) {
      return res.status(400).json({ success: false, error: 'API key is required' });
    }

    // 이미지를 base64로 인코딩
    const imageBuffer = await fs.readFile(file.path);
    const base64Image = imageBuffer.toString('base64');

    let extractedData = {};

    if (provider === 'openai') {
      const openai = new OpenAI({ apiKey });

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `다음 인스타그램 인사이트 이미지에서 데이터를 추출하여 JSON 형식으로 반환해주세요. 
                
다음 구조로 반환:
{
  "views": {
    "reachedAccounts": 숫자,
    "totalViews": 숫자
  },
  "contentTypes": {
    "posts": 숫자,
    "stories": 숫자,
    "reels": 숫자
  },
  "metrics": {
    "totalViews": 숫자,
    "reactions": 숫자,
    "newFollowers": 숫자
  },
  "profileActivity": {
    "total": 숫자,
    "profileVisits": 숫자,
    "externalLinkTaps": 숫자,
    "businessAddressTaps": 숫자
  }
}

숫자만 추출하고, 쉼표나 다른 문자는 제거해주세요. 데이터가 없으면 0으로 설정하세요.`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content || '{}';
      extractedData = JSON.parse(content);
    } else if (provider === 'gemini') {
      // Gemini API 호출 (구현 필요)
      log('warning', 'Gemini API는 아직 구현되지 않았습니다');
      extractedData = {
        views: { reachedAccounts: 0, totalViews: 0 },
        contentTypes: { posts: 0, stories: 0, reels: 0 },
        metrics: { totalViews: 0, reactions: 0, newFollowers: 0 },
        profileActivity: { total: 0, profileVisits: 0, externalLinkTaps: 0, businessAddressTaps: 0 },
      };
    } else if (provider === 'ocrspace') {
      // OCR.space API 호출
      const ocrResponse = await axios.post('https://api.ocr.space/parse/image', {
        base64Image: `data:image/jpeg;base64,${base64Image}`,
        language: 'kor',
        isTable: true,
        scale: true,
        OCREngine: 2,
      }, {
        headers: {
          'apikey': apiKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (ocrResponse.data.IsErroredOnProcessing) {
        throw new Error(ocrResponse.data.ErrorMessage[0] || 'OCR 처리 실패');
      }

      const ocrText = ocrResponse.data.ParsedResults[0]?.ParsedText || '';
      log('info', 'OCR 텍스트 추출 완료', { textLength: ocrText.length });

      // OCR 텍스트에서 숫자 추출
      extractedData = extractNumbersFromOCRText(ocrText);
    }

    log('success', 'AI 이미지 변환 완료', extractedData);
    res.json({ success: true, data: extractedData });
  } catch (error) {
    log('error', 'AI 이미지 변환 실패', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// OCR 텍스트에서 숫자 추출 헬퍼 함수
function extractNumbersFromOCRText(text) {
  const data = {
    views: { reachedAccounts: 0, totalViews: 0 },
    contentTypes: { posts: 0, stories: 0, reels: 0 },
    metrics: { totalViews: 0, reactions: 0, newFollowers: 0 },
    profileActivity: { total: 0, profileVisits: 0, externalLinkTaps: 0, businessAddressTaps: 0 },
  };

  // 숫자 추출 (쉼표 제거)
  const numbers = text.match(/[\d,]+/g)?.map(n => parseInt(n.replace(/,/g, ''))) || [];
  
  // 키워드 기반 매칭
  const lines = text.toLowerCase().split('\n');
  
  lines.forEach((line, index) => {
    const num = numbers[index] || 0;
    
    if (line.includes('도달') || line.includes('reached')) {
      data.views.reachedAccounts = num;
    } else if (line.includes('조회') && line.includes('수')) {
      data.views.totalViews = num;
    } else if (line.includes('게시물') || line.includes('post')) {
      data.contentTypes.posts = num;
    } else if (line.includes('스토리') || line.includes('stor')) {
      data.contentTypes.stories = num;
    } else if (line.includes('릴스') || line.includes('reel')) {
      data.contentTypes.reels = num;
    } else if (line.includes('반응') || line.includes('reaction')) {
      data.metrics.reactions = num;
    } else if (line.includes('팔로워') || line.includes('follower')) {
      data.metrics.newFollowers = num;
    } else if (line.includes('프로필') && line.includes('방문')) {
      data.profileActivity.profileVisits = num;
    } else if (line.includes('외부') || line.includes('링크')) {
      data.profileActivity.externalLinkTaps = num;
    } else if (line.includes('주소') || line.includes('address')) {
      data.profileActivity.businessAddressTaps = num;
    } else if (line.includes('프로필') && line.includes('활동')) {
      data.profileActivity.total = num;
    }
  });

  return data;
}

// ==================== 설정 API ====================

// AI 설정 조회
app.get('/api/settings/ai', async (req, res) => {
  try {
    log('info', 'AI 설정 조회 요청');
    await ensureDir(DATA_DIR);
    const filePath = path.join(DATA_DIR, 'settings.json');
    
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const settings = JSON.parse(data);
      log('success', 'AI 설정 조회 성공');
      res.json({ success: true, data: settings.ai || { provider: 'openai', apiKey: '' } });
    } catch {
      log('info', '설정 파일 없음, 기본값 반환');
      res.json({ success: true, data: { provider: 'openai', apiKey: '' } });
    }
  } catch (error) {
    log('error', 'AI 설정 조회 실패', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI 설정 저장
app.post('/api/settings/ai', async (req, res) => {
  try {
    const aiSettings = req.body;
    log('info', 'AI 설정 저장 요청', { provider: aiSettings.provider });

    await ensureDir(DATA_DIR);
    const filePath = path.join(DATA_DIR, 'settings.json');
    
    let settings = {};
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      settings = JSON.parse(data);
    } catch {}

    settings.ai = aiSettings;
    await fs.writeFile(filePath, JSON.stringify(settings, null, 2));

    log('success', 'AI 설정 저장 완료');
    res.json({ success: true, data: aiSettings });
  } catch (error) {
    log('error', 'AI 설정 저장 실패', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 이미지 업로드 API
app.post('/api/upload/image', upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    log('info', '이미지 업로드 요청', { fileName: file?.originalname });

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }

    const filename = file.filename;
    log('success', '이미지 업로드 완료', { filename });
    res.json({ success: true, data: { filename } });
  } catch (error) {
    log('error', '이미지 업로드 실패', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== 서버 시작 ====================

app.use('/uploads', express.static(UPLOADS_DIR));

app.listen(PORT, () => {
  log('info', `서버가 포트 ${PORT}에서 실행 중입니다`);
  ensureDir(DATA_DIR);
  ensureDir(UPLOADS_DIR);
});

