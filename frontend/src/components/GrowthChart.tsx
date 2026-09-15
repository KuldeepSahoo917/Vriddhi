import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import './GrowthChart.css';

export interface GrowthChartProps {
  data: Record<string, number>[];
  dataKey?: string;
}

function formatRupees(value: number): string {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  return `₹${value.toLocaleString('en-IN')}`;
}

export function GrowthChart({ data, dataKey = 'balance' }: GrowthChartProps) {
  return (
    <div className="growth-chart">
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--text-accent)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--text-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
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
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke="var(--text-accent)"
            strokeWidth={2}
            fill="url(#growthFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
