import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Area, AreaChart,
} from 'recharts';

const CHART_COLORS = {
  heavy_rain: '#3B82F6',
  extreme_heat: '#F97316',
  flood: '#06B6D4',
  curfew: '#EF4444',
  storm: '#A855F7',
  default: '#6366F1',
};

const PIE_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#A855F7'];

const CustomTooltip = ({ active, payload, label, prefix = '' }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
      {label && <p className="text-xs text-slate-400 mb-1">{label}</p>}
      {payload.map((entry, index) => (
        <p key={index} className="text-sm font-semibold" style={{ color: entry.color || entry.fill }}>
          {prefix}{typeof entry.value === 'number' ? entry.value.toLocaleString('en-IN') : entry.value}
        </p>
      ))}
    </div>
  );
};

export const ClaimsByTypeChart = ({ data = [] }) => {
  // Transform data if needed
  const chartData = Array.isArray(data) ? data.map(item => ({
    name: (item.type || item.name || item.disruption_type || '').replace(/_/g, ' '),
    value: item.count || item.value || 0,
    type: item.type || item.disruption_type || '',
  })) : [];

  if (chartData.length === 0) {
    // Demo data
    chartData.push(
      { name: 'Heavy Rain', value: 45, type: 'heavy_rain' },
      { name: 'Extreme Heat', value: 28, type: 'extreme_heat' },
      { name: 'Flood', value: 15, type: 'flood' },
      { name: 'Curfew', value: 12, type: 'curfew' },
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={4}
          dataKey="value"
          stroke="none"
        >
          {chartData.map((entry, index) => (
            <Cell
              key={index}
              fill={CHART_COLORS[entry.type] || PIE_COLORS[index % PIE_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value) => (
            <span className="text-xs text-slate-400 capitalize">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export const WeeklyPayoutsChart = ({ data = [] }) => {
  let chartData = Array.isArray(data) ? data.map(item => ({
    week: item.week || item.label || item.name || '',
    amount: item.amount || item.total || item.value || 0,
  })) : [];

  if (chartData.length === 0) {
    chartData = [
      { week: 'W1', amount: 12400 },
      { week: 'W2', amount: 8600 },
      { week: 'W3', amount: 15200 },
      { week: 'W4', amount: 9800 },
      { week: 'W5', amount: 18600 },
      { week: 'W6', amount: 11200 },
      { week: 'W7', amount: 7400 },
      { week: 'W8', amount: 14800 },
    ];
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} barCategoryGap="20%">
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
        <XAxis
          dataKey="week"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94A3B8', fontSize: 12 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94A3B8', fontSize: 12 }}
          tickFormatter={(v) => `\u20B9${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip content={<CustomTooltip prefix={'\u20B9'} />} cursor={{ fill: 'rgba(99,102,241,0.1)' }} />
        <Bar dataKey="amount" fill="#6366F1" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export const RiskTrendChart = ({ data = [] }) => {
  let chartData = Array.isArray(data) ? data.map(item => ({
    time: item.time || item.label || item.date || '',
    risk: item.risk || item.score || item.value || 0,
  })) : [];

  if (chartData.length === 0) {
    chartData = [
      { time: '6AM', risk: 15 },
      { time: '8AM', risk: 22 },
      { time: '10AM', risk: 35 },
      { time: '12PM', risk: 48 },
      { time: '2PM', risk: 62 },
      { time: '4PM', risk: 55 },
      { time: '6PM', risk: 70 },
      { time: '8PM', risk: 45 },
      { time: '10PM', risk: 30 },
    ];
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
        <XAxis
          dataKey="time"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94A3B8', fontSize: 12 }}
        />
        <YAxis
          domain={[0, 100]}
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94A3B8', fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="risk"
          stroke="#6366F1"
          strokeWidth={2}
          fill="url(#riskGradient)"
          dot={{ fill: '#6366F1', r: 3 }}
          activeDot={{ r: 5, fill: '#818CF8' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const ForecastChart = ({ data }) => {
  if (!data || data.length === 0) {
    // Demo data if API returns empty
    data = [
      { day: 'Mon', risk: 35, rain_prob: 20 },
      { day: 'Tue', risk: 45, rain_prob: 40 },
      { day: 'Wed', risk: 72, rain_prob: 85 },
      { day: 'Thu', risk: 65, rain_prob: 60 },
      { day: 'Fri', risk: 40, rain_prob: 30 },
      { day: 'Sat', risk: 55, rain_prob: 50 },
      { day: 'Sun', risk: 30, rain_prob: 15 },
    ];
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
        <YAxis stroke="#94a3b8" fontSize={12} />
        <Tooltip
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
          labelStyle={{ color: '#e2e8f0' }}
          itemStyle={{ color: '#e2e8f0' }}
        />
        <Area type="monotone" dataKey="risk" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} name="Risk Score" />
        <Area type="monotone" dataKey="rain_prob" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} name="Rain %" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default { ClaimsByTypeChart, WeeklyPayoutsChart, RiskTrendChart, ForecastChart };
