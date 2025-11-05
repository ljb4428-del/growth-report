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

  // PDF 내보내기
  async function exportToPDF() {
    if (!reportRef.current) return;

    setExporting(true);
    logger.info('PDF 내보내기 시작');

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `${business.name}_인사이트_보고서_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      logger.success('PDF 내보내기 완료', { fileName });
      alert('PDF 파일이 다운로드되었습니다!');
    } catch (error) {
      logger.error('PDF 내보내기 실패', error as Error);
      alert('PDF 내보내기 중 오류가 발생했습니다.');
    } finally {
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
            <FileText className="w-6 h-6 text-primary-600" />
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
              className="btn-primary"
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
                    className="text-sm text-primary-600 hover:text-primary-700"
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
                        ? 'bg-primary-600 text-white'
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">보고서를 내보내는 중...</p>
        </div>
      )}

      <div ref={reportRef}>
        <ReportContent
          business={business}
          insights={filteredInsights}
          settings={settings}
        />
      </div>
    </div>
  );
}

