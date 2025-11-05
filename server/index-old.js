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
app.use(express.json({ limit: '50mb' })); // JSON 크기 제한 증가
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 데이터 디렉토리 경로
const DATA_DIR = path.join(__dirname, '../data');
const REPORTS_DIR = path.join(__dirname, '../reports');
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

    const filePath = path.join(DATA_DIR, 'businesses.json');
    const data = await fs.readFile(filePath, 'utf-8');
    let businesses = JSON.parse(data);

    businesses = businesses.filter(b => b.id !== id);
    await fs.writeFile(filePath, JSON.stringify(businesses, null, 2));

    // 비즈니스 데이터 디렉토리 삭제 (선택사항)
    // await fs.rm(path.join(DATA_DIR, id), { recursive: true, force: true });

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
                  const data = await fs.readFile(filePath, 'utf-8');
                  insights.push(JSON.parse(data));
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
    const data = req.body;
    log('info', '인사이트 데이터 생성 요청', { 
      businessId: data.businessId, 
      year: data.year, 
      month: data.month,
      period: data.period 
    });

    const insight = {
      ...data,
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
                const data = await fs.readFile(filePath, 'utf-8');
                const insight = JSON.parse(data);
                
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

// ==================== JSON 데이터 수신 API ====================

// JSON 데이터 직접 수신하여 저장
app.post('/api/insights/import', async (req, res) => {
  try {
    const { businessId, year, month, period, data } = req.body;
    log('info', 'JSON 데이터 수신 요청', { businessId, year, month, period });

    if (!businessId || !year || !month || !period || !data) {
      return res.status(400).json({ 
        success: false, 
        error: '필수 필드가 누락되었습니다: businessId, year, month, period, data' 
      });
    }

    // 인사이트 데이터 생성
    const insight = {
      id: `insight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      businessId,
      year,
      month,
      period,
      ...data, // JSON 데이터 병합
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 파일 경로 생성
    const dirPath = path.join(DATA_DIR, businessId, String(year), String(month));
    await ensureDir(dirPath);

    const fileName = `${period}.json`;
    const filePath = path.join(dirPath, fileName);

    await fs.writeFile(filePath, JSON.stringify(insight, null, 2));

    log('success', 'JSON 데이터 저장 완료', insight);
    res.json({ success: true, data: insight });
  } catch (error) {
    log('error', 'JSON 데이터 저장 실패', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== 보고서 생성 API ====================

// 보고서 생성 (PDF/PPT)
app.post('/api/reports/generate', async (req, res) => {
  try {
    const { businessId, format, year, month, period } = req.body;
    log('info', '보고서 생성 요청', { businessId, format, year, month, period });

    // 인사이트 데이터 가져오기
    const insights = await getInsightsForReport(businessId, year, month, period);
    
    if (insights.length === 0) {
      return res.status(404).json({ success: false, error: '보고서 생성에 필요한 데이터가 없습니다.' });
    }

    // 보고서 생성
    let reportPath;
    if (format === 'pdf') {
      reportPath = await generatePDFReport(businessId, insights);
    } else if (format === 'ppt') {
      reportPath = await generatePPTReport(businessId, insights);
    } else {
      return res.status(400).json({ success: false, error: '지원하지 않는 형식입니다.' });
    }

    log('success', '보고서 생성 완료', { reportPath });
    res.json({ success: true, data: { path: reportPath } });
  } catch (error) {
    log('error', '보고서 생성 실패', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 보고서 데이터 조회 (그래프, 증감률, 분석 등)
app.post('/api/reports/analyze', async (req, res) => {
  try {
    const { businessId, year, month, period } = req.body;
    log('info', '보고서 분석 요청', { businessId, year, month, period });

    const insights = await getInsightsForReport(businessId, year, month, period);
    
    if (insights.length === 0) {
      return res.json({ success: true, data: { insights: [], analysis: null } });
    }

    // 분석 데이터 생성
    const analysis = await analyzeInsights(insights);

    log('success', '보고서 분석 완료');
    res.json({ success: true, data: { insights, analysis } });
  } catch (error) {
    log('error', '보고서 분석 실패', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 보고서 내용 수정 API
app.put('/api/reports/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const updates = req.body;
    log('info', '보고서 수정 요청', { reportId });

    // 보고서 메타데이터 관리 (선택사항)
    // 현재는 보고서 파일을 직접 수정하지 않고, 
    // 프론트엔드에서 수정 후 재생성하는 방식을 권장

    res.json({ 
      success: true, 
      message: '보고서를 수정하려면 데이터를 업데이트한 후 보고서를 재생성해주세요.' 
    });
  } catch (error) {
    log('error', '보고서 수정 실패', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 생성된 보고서 목록 조회
app.get('/api/reports/list/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    log('info', '보고서 목록 조회 요청', { businessId });

    const reports = [];
    
    try {
      const files = await fs.readdir(REPORTS_DIR);
      
      for (const file of files) {
        if (file.startsWith(`report-${businessId}-`)) {
          const filePath = path.join(REPORTS_DIR, file);
          const stats = await fs.stat(filePath);
          
          reports.push({
            fileName: file,
            url: `/reports/${file}`,
            createdAt: stats.birthtime,
            size: stats.size,
            format: file.endsWith('.pdf') ? 'pdf' : 'pptx',
          });
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }

    // 최신순 정렬
    reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    log('success', '보고서 목록 조회 완료', { count: reports.length });
    res.json({ success: true, data: reports });
  } catch (error) {
    log('error', '보고서 목록 조회 실패', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== 보고서 헬퍼 함수 ====================

// 인사이트 데이터 가져오기
async function getInsightsForReport(businessId, year, month, period) {
  const insights = [];
  
  try {
    const businessDir = path.join(DATA_DIR, businessId);
    const yearPath = path.join(businessDir, String(year));
    const monthPath = path.join(yearPath, String(month));

    const files = await fs.readdir(monthPath);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(monthPath, file);
        const data = await fs.readFile(filePath, 'utf-8');
        const insight = JSON.parse(data);
        
        if (!period || insight.period === period) {
          insights.push(insight);
        }
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  return insights.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

// 인사이트 분석
async function analyzeInsights(insights) {
  if (insights.length === 0) return null;

  const latest = insights[insights.length - 1];
  const previous = insights.length > 1 ? insights[insights.length - 2] : null;

  // 증감률 계산
  const calculateGrowth = (current, prev) => {
    if (!prev || prev === 0) return 0;
    return ((current - prev) / prev * 100).toFixed(2);
  };

  const analysis = {
    summary: {
      totalViews: latest.metrics?.totalViews || 0,
      reachedAccounts: latest.views?.reachedAccounts || 0,
      reactions: latest.metrics?.reactions || 0,
      newFollowers: latest.metrics?.newFollowers || 0,
    },
    growth: previous ? {
      totalViews: calculateGrowth(latest.metrics?.totalViews, previous.metrics?.totalViews),
      reachedAccounts: calculateGrowth(latest.views?.reachedAccounts, previous.views?.reachedAccounts),
      reactions: calculateGrowth(latest.metrics?.reactions, previous.metrics?.reactions),
      newFollowers: calculateGrowth(latest.metrics?.newFollowers, previous.metrics?.newFollowers),
    } : null,
    trends: generateTrends(insights),
    recommendations: generateRecommendations(latest, previous),
  };

  return analysis;
}

// 추세 분석 생성
function generateTrends(insights) {
  const trends = [];

  if (insights.length < 2) {
    return ['데이터가 부족하여 추세를 분석할 수 없습니다.'];
  }

  const latest = insights[insights.length - 1];
  const previous = insights[insights.length - 2];

  // 조회수 추세
  const viewsChange = latest.metrics?.totalViews - previous.metrics?.totalViews;
  if (viewsChange > 0) {
    trends.push(`조회수가 ${viewsChange.toLocaleString()}회 증가했습니다.`);
  } else if (viewsChange < 0) {
    trends.push(`조회수가 ${Math.abs(viewsChange).toLocaleString()}회 감소했습니다.`);
  }

  // 팔로워 추세
  const followersChange = latest.metrics?.newFollowers - previous.metrics?.newFollowers;
  if (followersChange > 0) {
    trends.push(`신규 팔로워가 ${followersChange.toLocaleString()}명 증가했습니다.`);
  } else if (followersChange < 0) {
    trends.push(`신규 팔로워가 ${Math.abs(followersChange).toLocaleString()}명 감소했습니다.`);
  }

  // 반응 추세
  const reactionsChange = latest.metrics?.reactions - previous.metrics?.reactions;
  if (reactionsChange > 0) {
    trends.push(`반응(좋아요, 댓글 등)이 ${reactionsChange.toLocaleString()}개 증가했습니다.`);
  }

  return trends.length > 0 ? trends : ['변화가 없습니다.'];
}

// 추천사항 생성
function generateRecommendations(latest, previous) {
  const recommendations = [];

  if (!previous) {
    return ['이전 데이터가 없어 추천사항을 생성할 수 없습니다. 다음 기간에 비교 분석이 가능합니다.'];
  }

  // 조회수 기반 추천
  const viewsGrowth = ((latest.metrics?.totalViews - previous.metrics?.totalViews) / previous.metrics?.totalViews * 100);
  if (viewsGrowth < 0) {
    recommendations.push('조회수가 감소했습니다. 콘텐츠 발행 빈도를 늘리거나 해시태그 전략을 재검토해보세요.');
  } else if (viewsGrowth > 50) {
    recommendations.push('조회수가 크게 증가했습니다! 현재 전략을 유지하며 더 많은 콘텐츠를 제작하세요.');
  }

  // 릴스 비중 추천
  const reelsRatio = (latest.contentTypes?.reels || 0) / 
    ((latest.contentTypes?.posts || 0) + (latest.contentTypes?.stories || 0) + (latest.contentTypes?.reels || 0));
  if (reelsRatio < 0.3) {
    recommendations.push('릴스 콘텐츠 비중을 늘려보세요. 현재 인스타그램 알고리즘은 릴스를 우대합니다.');
  }

  // 팔로워 증가 추천
  if (latest.metrics?.newFollowers < 10) {
    recommendations.push('팔로워 증가율이 낮습니다. 인터랙션을 유도하는 콘텐츠(질문, 투표 등)를 활용해보세요.');
  }

  // 프로필 활동 추천
  if ((latest.profileActivity?.profileVisits || 0) > 0) {
    const conversionRate = (latest.metrics?.newFollowers || 0) / (latest.profileActivity?.profileVisits || 1) * 100;
    if (conversionRate < 10) {
      recommendations.push(`프로필 방문자의 팔로우 전환율이 ${conversionRate.toFixed(1)}%로 낮습니다. 프로필 소개와 하이라이트를 개선해보세요.`);
    }
  }

  return recommendations.length > 0 ? recommendations : ['현재 전략을 유지하세요.'];
}

// PDF 보고서 생성
async function generatePDFReport(businessId, insights) {
  await ensureDir(REPORTS_DIR);
  
  const timestamp = Date.now();
  const fileName = `report-${businessId}-${timestamp}.pdf`;
  const filePath = path.join(REPORTS_DIR, fileName);

  // 분석 데이터 생성
  const analysis = await analyzeInsights(insights);
  const latest = insights[insights.length - 1];

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const stream = fsSync.createWriteStream(filePath);

      doc.pipe(stream);

      // 제목
      doc.fontSize(24).font('Helvetica-Bold').text('인스타그램 인사이트 보고서', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).font('Helvetica').text(`생성일: ${new Date().toLocaleDateString('ko-KR')}`, { align: 'center' });
      doc.moveDown(2);

      // 기간 정보
      doc.fontSize(16).font('Helvetica-Bold').text('보고 기간');
      doc.fontSize(12).font('Helvetica').text(`${latest.year}년 ${latest.month}월 (${latest.period})`);
      doc.moveDown(2);

      // 요약 통계
      doc.fontSize(16).font('Helvetica-Bold').text('주요 지표');
      doc.moveDown();
      
      const metrics = [
        { label: '총 조회수', value: analysis.summary.totalViews.toLocaleString() },
        { label: '도달한 계정', value: analysis.summary.reachedAccounts.toLocaleString() },
        { label: '반응 수', value: analysis.summary.reactions.toLocaleString() },
        { label: '신규 팔로워', value: analysis.summary.newFollowers.toLocaleString() },
      ];

      metrics.forEach(metric => {
        doc.fontSize(12).font('Helvetica-Bold').text(metric.label + ': ', { continued: true });
        doc.font('Helvetica').text(metric.value);
      });

      doc.moveDown(2);

      // 증감률 (이전 데이터가 있는 경우)
      if (analysis.growth) {
        doc.fontSize(16).font('Helvetica-Bold').text('전기 대비 증감률');
        doc.moveDown();

        const growthMetrics = [
          { label: '조회수', value: `${analysis.growth.totalViews}%` },
          { label: '도달 계정', value: `${analysis.growth.reachedAccounts}%` },
          { label: '반응', value: `${analysis.growth.reactions}%` },
          { label: '팔로워', value: `${analysis.growth.newFollowers}%` },
        ];

        growthMetrics.forEach(metric => {
          const isPositive = parseFloat(metric.value) > 0;
          doc.fontSize(12).font('Helvetica-Bold').text(metric.label + ': ', { continued: true });
          doc.fillColor(isPositive ? 'green' : 'red').font('Helvetica').text(metric.value);
          doc.fillColor('black');
        });

        doc.moveDown(2);
      }

      // 콘텐츠 유형 분포
      if (latest.contentTypes) {
        doc.fontSize(16).font('Helvetica-Bold').text('콘텐츠 유형 분포');
        doc.moveDown();

        doc.fontSize(12).font('Helvetica')
          .text(`게시물: ${latest.contentTypes.posts || 0}개`)
          .text(`스토리: ${latest.contentTypes.stories || 0}개`)
          .text(`릴스: ${latest.contentTypes.reels || 0}개`);

        doc.moveDown(2);
      }

      // 추세 분석
      doc.fontSize(16).font('Helvetica-Bold').text('추세 분석');
      doc.moveDown();
      
      analysis.trends.forEach(trend => {
        doc.fontSize(12).font('Helvetica').text(`• ${trend}`);
      });

      doc.moveDown(2);

      // 추천사항
      doc.fontSize(16).font('Helvetica-Bold').text('추천사항');
      doc.moveDown();
      
      analysis.recommendations.forEach(rec => {
        doc.fontSize(12).font('Helvetica').text(`• ${rec}`);
        doc.moveDown(0.5);
      });

      doc.end();

      stream.on('finish', () => {
        resolve(`/reports/${fileName}`);
      });

      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

// PPT 보고서 생성
async function generatePPTReport(businessId, insights) {
  await ensureDir(REPORTS_DIR);
  
  const timestamp = Date.now();
  const fileName = `report-${businessId}-${timestamp}.pptx`;
  const filePath = path.join(REPORTS_DIR, fileName);

  const analysis = await analyzeInsights(insights);
  const latest = insights[insights.length - 1];

  const pptx = new PptxGenJS();

  // 슬라이드 1: 표지
  const slide1 = pptx.addSlide();
  slide1.background = { color: '4472C4' };
  slide1.addText('인스타그램 인사이트 보고서', {
    x: 0.5,
    y: 2.0,
    w: 9,
    h: 1.5,
    fontSize: 44,
    bold: true,
    color: 'FFFFFF',
    align: 'center',
  });
  slide1.addText(`${latest.year}년 ${latest.month}월 (${latest.period})`, {
    x: 0.5,
    y: 3.5,
    w: 9,
    h: 0.5,
    fontSize: 24,
    color: 'FFFFFF',
    align: 'center',
  });
  slide1.addText(`생성일: ${new Date().toLocaleDateString('ko-KR')}`, {
    x: 0.5,
    y: 4.5,
    w: 9,
    h: 0.5,
    fontSize: 16,
    color: 'FFFFFF',
    align: 'center',
  });

  // 슬라이드 2: 주요 지표
  const slide2 = pptx.addSlide();
  slide2.addText('주요 지표', {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: '4472C4',
  });

  const metricsData = [
    [
      { text: '지표', options: { bold: true, fill: '4472C4', color: 'FFFFFF' } },
      { text: '수치', options: { bold: true, fill: '4472C4', color: 'FFFFFF' } },
    ],
    ['총 조회수', analysis.summary.totalViews.toLocaleString()],
    ['도달한 계정', analysis.summary.reachedAccounts.toLocaleString()],
    ['반응 수', analysis.summary.reactions.toLocaleString()],
    ['신규 팔로워', analysis.summary.newFollowers.toLocaleString()],
  ];

  slide2.addTable(metricsData, {
    x: 1.5,
    y: 1.5,
    w: 7,
    rowH: 0.5,
    fontSize: 16,
    align: 'center',
    border: { pt: 1, color: '4472C4' },
  });

  // 슬라이드 3: 증감률 (이전 데이터가 있는 경우)
  if (analysis.growth) {
    const slide3 = pptx.addSlide();
    slide3.addText('전기 대비 증감률', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.6,
      fontSize: 32,
      bold: true,
      color: '4472C4',
    });

    const growthData = [
      [
        { text: '지표', options: { bold: true, fill: '4472C4', color: 'FFFFFF' } },
        { text: '증감률', options: { bold: true, fill: '4472C4', color: 'FFFFFF' } },
      ],
      ['조회수', `${analysis.growth.totalViews}%`],
      ['도달 계정', `${analysis.growth.reachedAccounts}%`],
      ['반응', `${analysis.growth.reactions}%`],
      ['팔로워', `${analysis.growth.newFollowers}%`],
    ];

    slide3.addTable(growthData, {
      x: 1.5,
      y: 1.5,
      w: 7,
      rowH: 0.5,
      fontSize: 16,
      align: 'center',
      border: { pt: 1, color: '4472C4' },
    });
  }

  // 슬라이드 4: 콘텐츠 유형 분포
  if (latest.contentTypes) {
    const slide4 = pptx.addSlide();
    slide4.addText('콘텐츠 유형 분포', {
      x: 0.5,
      y: 0.5,
      w: 9,
      h: 0.6,
      fontSize: 32,
      bold: true,
      color: '4472C4',
    });

    const chartData = [
      {
        name: '콘텐츠 유형',
        labels: ['게시물', '스토리', '릴스'],
        values: [
          latest.contentTypes.posts || 0,
          latest.contentTypes.stories || 0,
          latest.contentTypes.reels || 0,
        ],
      },
    ];

    slide4.addChart(pptx.ChartType.pie, chartData, {
      x: 2,
      y: 1.5,
      w: 6,
      h: 4,
      showLegend: true,
      showTitle: false,
    });
  }

  // 슬라이드 5: 추세 분석
  const slide5 = pptx.addSlide();
  slide5.addText('추세 분석', {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: '4472C4',
  });

  let yPos = 1.5;
  analysis.trends.forEach(trend => {
    slide5.addText(`• ${trend}`, {
      x: 1,
      y: yPos,
      w: 8,
      h: 0.4,
      fontSize: 16,
    });
    yPos += 0.5;
  });

  // 슬라이드 6: 추천사항
  const slide6 = pptx.addSlide();
  slide6.addText('추천사항', {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: '4472C4',
  });

  yPos = 1.5;
  analysis.recommendations.forEach(rec => {
    slide6.addText(`• ${rec}`, {
      x: 1,
      y: yPos,
      w: 8,
      h: 0.4,
      fontSize: 14,
    });
    yPos += 0.6;
  });

  await pptx.writeFile({ fileName: filePath });
  
  return `/reports/${fileName}`;
}

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
        OCREngine: 2, // 엔진 2가 더 정확함
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
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    log('info', '이미지 업로드 요청', { fileName: file?.originalname });

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file provided' });
    }

    const url = `/uploads/${file.filename}`;
    log('success', '이미지 업로드 완료', { url });
    res.json({ success: true, data: { url } });
  } catch (error) {
    log('error', '이미지 업로드 실패', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== 서버 시작 ====================

app.use('/reports', express.static(REPORTS_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));

app.listen(PORT, () => {
  log('info', `서버가 포트 ${PORT}에서 실행 중입니다`);
  ensureDir(DATA_DIR);
  ensureDir(REPORTS_DIR);
  ensureDir(UPLOADS_DIR);
});

