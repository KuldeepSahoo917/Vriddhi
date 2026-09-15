import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './ComparisonChart.css';

export interface ComparisonChartProps {
  data: Array<{ year: number; planA?: number; planB?: number }>;
  labelA: string;
  labelB: string;
}

function formatRupees(value: number): string {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  return `₹${value.toLocaleString('en-IN')}`;
}

export function ComparisonChart({ data, labelA, labelB }: ComparisonChartProps) {
  return (
    <div className="comparison-chart">
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="year"
            tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            axisLine={{ stroke: 'var(--border)' }}
            tickLine={false}
          />
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Tooltip
            formatter={(value) => formatRupees(Number(value))}
            labelFormatter={(year) => `Year ${year}`}
            contentStyle={{
              background: 'var(--bg-surface)',
              border: '0.5px solid var(--border-strong)',
              borderRadius: 8,
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
            }}
          />
          <Legend
            formatter={(value) => (value === 'planA' ? labelA : labelB)}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Line
            type="monotone"
            dataKey="planA"
            stroke="var(--text-accent)"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="planB"
            stroke="var(--border-gold)"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
