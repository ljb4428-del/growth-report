import { useState, useRef } from 'react';
import { Business, InsightData, ReportSettings } from '../types';
import { Download, FileText, Settings } from 'lucide-react';
import { logger } from '../utils/logger';
import ReportContent from './ReportContent';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Props {
  business: Business;
  insights: InsightData[];
}

export default function ReportView({ business, insights }: Props) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<ReportSettings>({
    businessId: business.id,
    selectedMonths: [],
    selectedPeriods: ['14days', '30days'],
    includeGraphs: {
      lineChart: true,
      barChart: true,
    },
    includeSections: {
      views: true,
      contentTypes: true,
      metrics: true,
      profileActivity: true,
    },
  });
  const [showSettings, setShowSettings] = useState(false);
  const [exporting, setExporting] = useState(false);

  // 월 목록 생성
  const availableMonths = Array.from(
    new Set(
      insights.map((i) => `${i.year}-${String(i.month).padStart(2, '0')}`)
    )
  ).sort();

  // 월 선택/해제
  function toggleMonth(month: string) {
    if (settings.selectedMonths.includes(month)) {
      setSettings({
        ...settings,
        selectedMonths: settings.selectedMonths.filter((m) => m !== month),
      });
    } else {
      setSettings({
        ...settings,
        selectedMonths: [...settings.selectedMonths, month],
      });
    }
  }

  // 전체 선택
  function selectAllMonths() {
    setSettings({ ...settings, selectedMonths: availableMonths });
  }

  // 전체 해제
  function clearAllMonths() {
    setSettings({ ...settings, selectedMonths: [] });
  }

  // 클론에서 SVG 차트를 이미지로 스냅샷
  async function snapshotChartsInClone(clone: HTMLElement): Promise<void> {
    const svgElements = clone.querySelectorAll('svg');
    
    for (const svg of svgElements) {
      try {
        const originalWidth = svg.clientWidth || svg.viewBox.baseVal.width || 800;
        const originalHeight = svg.clientHeight || svg.viewBox.baseVal.height || 600;
        
        const svgData = new XMLSerializer().serializeToString(svg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = originalWidth;
            canvas.height = originalHeight;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              
              const dataUrl = canvas.toDataURL('image/png');
              const imgElement = document.createElement('img');
              imgElement.src = dataUrl;
              imgElement.style.width = `${originalWidth}px`;
              imgElement.style.height = `${originalHeight}px`;
              imgElement.style.display = 'block';
              
              if (svg.parentNode) {
                svg.parentNode.replaceChild(imgElement, svg);
              }
              
              URL.revokeObjectURL(url);
              resolve(null);
            } else {
              reject(new Error('Canvas context not available'));
            }
          };
          img.onerror = reject;
          img.src = url;
        });
      } catch (error) {
        logger.warn('차트 스냅샷 실패', error as Error);
      }
    }
  }

  // PDF 내보내기 - 섹션별 캡처 방식
  async function exportToPDF() {
    if (!reportRef.current) return;

    setExporting(true);
    logger.info('PDF 내보내기 시작');

    let clone: HTMLElement | null = null;
    let exportContainer: HTMLElement | null = null;

    try {
      const element = reportRef.current;
      
      // 오프스크린 클론 생성
      clone = element.cloneNode(true) as HTMLElement;
      clone.classList.add('exporting', 'compact-print');
      
      // 오프스크린 컨테이너 생성
      exportContainer = document.createElement('div');
      exportContainer.style.position = 'fixed';
      exportContainer.style.left = '-9999px';
      exportContainer.style.top = '0';
      exportContainer.style.width = `${element.scrollWidth}px`;
      exportContainer.style.height = `${element.scrollHeight}px`;
      exportContainer.style.backgroundColor = '#ffffff';
      exportContainer.style.overflow = 'hidden';
      exportContainer.appendChild(clone);
      document.body.appendChild(exportContainer);
      
      // 이미지 로딩 대기
      const images = clone.querySelectorAll('img');
      const imagePromises = Array.from(images).map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve; // 실패해도 계속 진행
          setTimeout(resolve, 2000); // 타임아웃
        });
      });
      await Promise.all(imagePromises);
      
      // 클론에서 차트를 이미지로 스냅샷
      await snapshotChartsInClone(clone);
      
      // 스타일이 적용되도록 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 200));

      // .report-section 요소들 찾기
      const sections = clone.querySelectorAll('.report-section');
      
      if (sections.length === 0) {
        throw new Error('보고서 섹션을 찾을 수 없습니다.');
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // A4 용지 크기 (mm) - 템플릿 기준
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10; // @page margin
      const pagePadding = 14; // --page-padding
      const gap = 6; // --gap (섹션 간격) - 줄여서 더 많은 내용 배치
      const pdfContentWidth = pageWidth - (margin * 2);
      const contentHeight = pageHeight - (margin * 2);
      
      let currentY = margin;

      // 각 섹션을 개별적으로 캡처하고 배치
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i] as HTMLElement;
        
        // 섹션을 개별적으로 캡처 (scale을 2로 줄여서 더 많은 내용이 들어가도록)
        const sectionCanvas = await html2canvas(section, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          scrollY: 0,
          windowWidth: element.scrollWidth,
          windowHeight: section.scrollHeight,
          width: section.scrollWidth,
          height: section.scrollHeight,
        });

        // 섹션 이미지 크기 계산
        const sectionImgWidth = pdfContentWidth;
        const sectionImgHeight = (sectionCanvas.height * pdfContentWidth) / sectionCanvas.width;
        const sectionImgData = sectionCanvas.toDataURL('image/png');

        // 남은 페이지 높이 확인
        const remainingHeight = contentHeight - (currentY - margin);
        
        // 현재 섹션이 남은 공간에 들어가지 않으면 새 페이지 시작 (섹션 개수 제한 제거)
        if (sectionImgHeight > remainingHeight && currentY > margin) {
          pdf.addPage();
          currentY = margin;
        }

        // 섹션이 한 페이지보다 크면 여러 페이지로 나누기
        if (sectionImgHeight > contentHeight) {
          // 섹션을 여러 페이지로 나누기
          let sectionHeightLeft = sectionImgHeight;
          let sectionPosition = currentY;

          // 첫 부분
          pdf.addImage(sectionImgData, 'PNG', margin, sectionPosition, sectionImgWidth, sectionImgHeight, undefined, 'FAST');
          sectionHeightLeft -= (contentHeight - (currentY - margin));
          currentY = margin;

          // 나머지 부분
          while (sectionHeightLeft > 0) {
            pdf.addPage();
            sectionPosition = margin - (sectionImgHeight - sectionHeightLeft);
            pdf.addImage(sectionImgData, 'PNG', margin, sectionPosition, sectionImgWidth, sectionImgHeight, undefined, 'FAST');
            sectionHeightLeft -= contentHeight;
            currentY = margin;
          }
        } else {
          // 섹션이 한 페이지에 들어가는 경우
          pdf.addImage(sectionImgData, 'PNG', margin, currentY, sectionImgWidth, sectionImgHeight, undefined, 'FAST');
          currentY += sectionImgHeight + gap; // 섹션 간 간격
          
          // 다음 페이지가 필요한지 확인
          if (currentY > contentHeight + margin) {
            pdf.addPage();
            currentY = margin;
          }
        }
      }

      const fileName = `${business.name}_인사이트_보고서_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      logger.success('PDF 내보내기 완료', { fileName });
      alert('PDF 파일이 다운로드되었습니다!');
    } catch (error) {
      logger.error('PDF 내보내기 실패', error as Error);
      alert('PDF 내보내기 중 오류가 발생했습니다.');
    } finally {
      // 클론 및 컨테이너 제거
      if (exportContainer && exportContainer.parentNode) {
        exportContainer.parentNode.removeChild(exportContainer);
      }
      setExporting(false);
    }
  }

  // 필터링된 인사이트 데이터
  const filteredInsights = insights.filter((insight) => {
    const monthKey = `${insight.year}-${String(insight.month).padStart(2, '0')}`;
    const monthMatch =
      settings.selectedMonths.length === 0 ||
      settings.selectedMonths.includes(monthKey);
    const periodMatch = settings.selectedPeriods.includes(insight.period);
    return monthMatch && periodMatch;
  });

  return (
    <div className="space-y-6">
      {/* 컨트롤 바 */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <FileText className="w-6 h-6 text-purple-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">보고서 생성</h2>
              <p className="text-sm text-gray-600">
                {filteredInsights.length}개 데이터로 보고서 생성
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="btn-secondary"
            >
              <Settings className="w-4 h-4 inline mr-2" />
              설정
            </button>

            <button
              onClick={exportToPDF}
              disabled={exporting || filteredInsights.length === 0}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 inline mr-2" />
              PDF 내보내기
            </button>
          </div>
        </div>
      </div>

      {/* 설정 패널 */}
      {showSettings && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">보고서 설정</h3>

          <div className="space-y-6">
            {/* 월 선택 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  비교할 월 선택
                </label>
                <div className="space-x-2">
                  <button
                    onClick={selectAllMonths}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    전체 선택
                  </button>
                  <button
                    onClick={clearAllMonths}
                    className="text-sm text-gray-600 hover:text-gray-700"
                  >
                    전체 해제
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableMonths.map((month) => (
                  <button
                    key={month}
                    onClick={() => toggleMonth(month)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      settings.selectedMonths.includes(month)
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </div>

            {/* 기간 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                기간 선택
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.selectedPeriods.includes('14days')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSettings({
                          ...settings,
                          selectedPeriods: [...settings.selectedPeriods, '14days'],
                        });
                      } else {
                        setSettings({
                          ...settings,
                          selectedPeriods: settings.selectedPeriods.filter(
                            (p) => p !== '14days'
                          ),
                        });
                      }
                    }}
                    className="mr-2"
                  />
                  14일 기준
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.selectedPeriods.includes('30days')}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSettings({
                          ...settings,
                          selectedPeriods: [...settings.selectedPeriods, '30days'],
                        });
                      } else {
                        setSettings({
                          ...settings,
                          selectedPeriods: settings.selectedPeriods.filter(
                            (p) => p !== '30days'
                          ),
                        });
                      }
                    }}
                    className="mr-2"
                  />
                  30일 기준
                </label>
              </div>
            </div>

            {/* 포함할 섹션 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                보고서에 포함할 항목
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(settings.includeSections).map(([key, value]) => (
                  <label key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          includeSections: {
                            ...settings.includeSections,
                            [key]: e.target.checked,
                          },
                        })
                      }
                      className="mr-2"
                    />
                    {key === 'views' && '조회'}
                    {key === 'contentTypes' && '콘텐츠 유형'}
                    {key === 'metrics' && '기타 지표'}
                    {key === 'profileActivity' && '프로필 활동'}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 보고서 내용 */}
      {exporting && (
        <div className="card text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">보고서를 내보내는 중...</p>
        </div>
      )}

      <div ref={reportRef} className="bg-white w-full" style={{ maxWidth: '100%' }}>
        <ReportContent
          business={business}
          insights={filteredInsights}
          settings={settings}
        />
      </div>
    </div>
  );
}

