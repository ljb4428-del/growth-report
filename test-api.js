/**
 * API 테스트 스크립트
 * 
 * 사용법:
 * 1. 서버 실행: npm run server
 * 2. 다른 터미널에서: node test-api.js
 */

import axios from 'axios';

const API_BASE = 'http://localhost:5000';

// 테스트용 JSON 데이터
const testData = {
  views: {
    reachedAccounts: 5420,
    totalViews: 13250
  },
  contentTypes: {
    posts: 8,
    stories: 15,
    reels: 5
  },
  metrics: {
    totalViews: 13250,
    reactions: 892,
    newFollowers: 143
  },
  profileActivity: {
    total: 325,
    profileVisits: 280,
    externalLinkTaps: 28,
    businessAddressTaps: 17
  }
};

async function test() {
  console.log('🧪 API 테스트 시작...\n');

  try {
    // Step 1: 비즈니스 생성
    console.log('1️⃣ 비즈니스 생성 중...');
    const businessRes = await axios.post(`${API_BASE}/api/businesses`, {
      name: '테스트 인스타그램 계정',
      description: 'API 테스트용 계정'
    });
    const business = businessRes.data;
    
    if (!business.success) {
      throw new Error('비즈니스 생성 실패: ' + business.error);
    }
    
    const businessId = business.data.id;
    console.log(`✅ 비즈니스 생성 완료: ${businessId}\n`);

    // Step 2: JSON 데이터 전송 (14일)
    console.log('2️⃣ JSON 데이터 전송 중 (14일)...');
    const insightRes1 = await axios.post(`${API_BASE}/api/insights/import`, {
      businessId,
      year: 2024,
      month: 10,
      period: '14days',
      data: testData
    });
    const insight1 = insightRes1.data;
    
    if (!insight1.success) {
      throw new Error('데이터 전송 실패: ' + insight1.error);
    }
    console.log(`✅ 14일 데이터 저장 완료\n`);

    // Step 3: JSON 데이터 전송 (30일 - 약간 다른 수치)
    console.log('3️⃣ JSON 데이터 전송 중 (30일)...');
    const testData2 = {
      views: {
        reachedAccounts: 4680,
        totalViews: 11470
      },
      contentTypes: {
        posts: 6,
        stories: 12,
        reels: 3
      },
      metrics: {
        totalViews: 11470,
        reactions: 778,
        newFollowers: 128
      },
      profileActivity: {
        total: 289,
        profileVisits: 245,
        externalLinkTaps: 25,
        businessAddressTaps: 19
      }
    };

    const insightRes2 = await axios.post(`${API_BASE}/api/insights/import`, {
      businessId,
      year: 2024,
      month: 10,
      period: '30days',
      data: testData2
    });
    const insight2 = insightRes2.data;
    
    if (!insight2.success) {
      throw new Error('데이터 전송 실패: ' + insight2.error);
    }
    console.log(`✅ 30일 데이터 저장 완료\n`);

    // Step 4: 분석 데이터 조회
    console.log('4️⃣ 분석 데이터 조회 중...');
    const analyzeRes = await axios.post(`${API_BASE}/api/reports/analyze`, {
      businessId,
      year: 2024,
      month: 10
    });
    const analysis = analyzeRes.data;
    
    if (!analysis.success) {
      throw new Error('분석 실패: ' + analysis.error);
    }
    
    console.log('✅ 분석 완료:');
    console.log(`   - 총 조회수: ${analysis.data.analysis.summary.totalViews.toLocaleString()}`);
    console.log(`   - 도달 계정: ${analysis.data.analysis.summary.reachedAccounts.toLocaleString()}`);
    console.log(`   - 신규 팔로워: ${analysis.data.analysis.summary.newFollowers.toLocaleString()}`);
    
    if (analysis.data.analysis.growth) {
      console.log(`   - 조회수 증감: ${analysis.data.analysis.growth.totalViews}%`);
    }
    
    console.log('\n📊 추세 분석:');
    analysis.data.analysis.trends.forEach(trend => {
      console.log(`   • ${trend}`);
    });
    
    console.log('\n💡 추천사항:');
    analysis.data.analysis.recommendations.forEach(rec => {
      console.log(`   • ${rec}`);
    });
    console.log('');

    // Step 5: PDF 보고서 생성
    console.log('5️⃣ PDF 보고서 생성 중...');
    const pdfRes = await axios.post(`${API_BASE}/api/reports/generate`, {
      businessId,
      format: 'pdf',
      year: 2024,
      month: 10
    });
    const pdfReport = pdfRes.data;
    
    if (!pdfReport.success) {
      throw new Error('PDF 생성 실패: ' + pdfReport.error);
    }
    console.log(`✅ PDF 생성 완료: ${API_BASE}${pdfReport.data.path}\n`);

    // Step 6: PPT 보고서 생성
    console.log('6️⃣ PPT 보고서 생성 중...');
    const pptRes = await axios.post(`${API_BASE}/api/reports/generate`, {
      businessId,
      format: 'ppt',
      year: 2024,
      month: 10
    });
    const pptReport = pptRes.data;
    
    if (!pptReport.success) {
      throw new Error('PPT 생성 실패: ' + pptReport.error);
    }
    console.log(`✅ PPT 생성 완료: ${API_BASE}${pptReport.data.path}\n`);

    // Step 7: 보고서 목록 조회
    console.log('7️⃣ 보고서 목록 조회 중...');
    const listRes = await axios.get(`${API_BASE}/api/reports/list/${businessId}`);
    const reportList = listRes.data;
    
    if (!reportList.success) {
      throw new Error('목록 조회 실패: ' + reportList.error);
    }
    
    console.log(`✅ 생성된 보고서: ${reportList.data.length}개`);
    reportList.data.forEach((report, index) => {
      console.log(`   ${index + 1}. ${report.fileName} (${report.format.toUpperCase()}) - ${(report.size / 1024).toFixed(2)} KB`);
    });

    console.log('\n🎉 모든 테스트 성공!');
    console.log(`\n📥 보고서 다운로드:`);
    console.log(`   PDF: ${API_BASE}${pdfReport.data.path}`);
    console.log(`   PPT: ${API_BASE}${pptReport.data.path}`);

  } catch (error) {
    console.error('\n❌ 테스트 실패:', error.message);
    if (error.response) {
      console.error('응답 상태:', error.response.status);
      console.error('응답 데이터:', error.response.data);
    } else if (error.request) {
      console.error('요청 실패:', error.code || '서버에 연결할 수 없습니다');
    } else {
      console.error('전체 에러:', error);
    }
    process.exit(1);
  }
}

// 테스트 실행
test();

