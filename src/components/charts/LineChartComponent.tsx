import { InsightData } from '../../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatNumber } from '../../utils/helpers';

interface Props {
  insights: InsightData[];
  dataKey: string;
  title: string;
  color?: string;
}

export default function LineChartComponent({ insights, dataKey, title, color = '#0ea5e9' }: Props) {
  // 데이터 포맷팅
  const chartData = insights.map((insight) => {
    const keys = dataKey.split('.');
    let value: any = insight;
    
    for (const key of keys) {
      value = value?.[key];
    }

    return {
      name: `${insight.year}.${String(insight.month).padStart(2, '0')}`,
      period: insight.period === '14days' ? '14일' : '30일',
      value: value || 0,
      fullLabel: `${insight.year}년 ${insight.month}월 (${insight.period === '14days' ? '14일' : '30일'})`,
    };
  });

  return (
    <div className="mt-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">{title}</h4>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            formatter={(value: any) => [formatNumber(value), '값']}
            labelFormatter={(label, payload) => payload[0]?.payload?.fullLabel || label}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2}
            name={title}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

