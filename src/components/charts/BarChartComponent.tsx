import { InsightData } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatNumber } from '../../utils/helpers';

interface Props {
  insights: InsightData[];
  dataKeys: string[];
  title: string;
}

const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function BarChartComponent({ insights, dataKeys, title }: Props) {
  // 데이터 포맷팅
  const chartData = insights.map((insight) => {
    const dataPoint: any = {
      name: `${insight.year}.${String(insight.month).padStart(2, '0')}`,
      period: insight.period === '14days' ? '14일' : '30일',
      fullLabel: `${insight.year}년 ${insight.month}월 (${insight.period === '14days' ? '14일' : '30일'})`,
    };

    dataKeys.forEach((key) => {
      const keys = key.split('.');
      let value: any = insight;
      
      for (const k of keys) {
        value = value?.[k];
      }

      // 키의 마지막 부분을 레이블로 사용
      const label = keys[keys.length - 1];
      dataPoint[label] = value || 0;
    });

    return dataPoint;
  });

  // 레이블 매핑
  const labelMap: { [key: string]: string } = {
    reachedAccounts: '도달한 계정',
    totalViews: '조회 수',
    posts: '게시물',
    stories: '스토리',
    reels: '릴스',
    reactions: '반응',
    newFollowers: '새 팔로워',
  };

  return (
    <div className="mt-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">{title}</h4>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => formatNumber(value)}
          />
          <Tooltip
            formatter={(value: any, name: string) => [
              formatNumber(value),
              labelMap[name] || name
            ]}
            labelFormatter={(label, payload) => payload[0]?.payload?.fullLabel || label}
          />
          <Legend 
            formatter={(value) => labelMap[value] || value}
          />
          {dataKeys.map((key, index) => {
            const label = key.split('.').pop() || key;
            return (
              <Bar
                key={key}
                dataKey={label}
                fill={COLORS[index % COLORS.length]}
              />
            );
          })}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

