import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Area, AreaChart,
} from 'recharts';

const CHART_COLORS = {
  heavy_rain: '#38BDF8', // info-400
  extreme_heat: '#FBBF24', // warning-400
  flood: '#F59E0B', // primary-500
  curfew: '#F87171', // danger-400
  storm: '#A78BFA', // purple-400
  default: '#F59E0B',
};

const PIE_COLORS = ['#F59E0B', '#10B981', '#FBBF24', '#F87171', '#38BDF8', '#A78BFA'];

const CustomTooltip = ({ active, payload, label, prefix = '' }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-base-900 border border-base-700 rounded-xl p-3 shadow-xl">
      {label && <p className="text-xs font-bold uppercase tracking-wider text-base-500 mb-2">{label}</p>}
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
          <p className="text-sm font-bold text-base-100">
            <span className="text-base-400 font-medium mr-2">{entry.name}:</span>
            {prefix}{typeof entry.value === 'number' ? entry.value.toLocaleString('en-IN') : entry.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export const ClaimsByTypeChart = ({ data = [] }) => {
  const chartData = Array.isArray(data) ? data.map(item => ({
    name: (item.type || item.name || item.disruption_type || '').replace(/_/g, ' '),
    value: item.count || item.value || 0,
    type: item.type || item.disruption_type || '',
  })) : [];

  if (chartData.length === 0) {
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
          cornerRadius={4}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={index}
              fill={CHART_COLORS[entry.type] || PIE_COLORS[index % PIE_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} cursor={false} />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          formatter={(value) => (
            <span className="text-xs font-bold uppercase tracking-wider text-base-400 ml-1">{value}</span>
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
      <BarChart data={chartData} barCategoryGap="25%">
        <CartesianGrid strokeDasharray="3 3" stroke="#202836" vertical={false} />
        <XAxis
          dataKey="week"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#717D96', fontSize: 10, fontWeight: 'bold' }}
          dy={10}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#717D96', fontSize: 10, fontWeight: 'bold' }}
          tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
          dx={-10}
        />
        <Tooltip content={<CustomTooltip prefix="₹" />} cursor={{ fill: '#202836', opacity: 0.5 }} />
        <Bar dataKey="amount" fill="#F59E0B" radius={[4, 4, 0, 0]} />
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
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#202836" vertical={false} />
        <XAxis
          dataKey="time"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#717D96', fontSize: 10, fontWeight: 'bold' }}
          dy={10}
        />
        <YAxis
          domain={[0, 100]}
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#717D96', fontSize: 10, fontWeight: 'bold' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="risk"
          stroke="#F59E0B"
          strokeWidth={3}
          fill="url(#riskGradient)"
          dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4, stroke: '#0B101A' }}
          activeDot={{ r: 6, fill: '#F59E0B', stroke: '#0B101A', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const ForecastChart = ({ data }) => {
  let chartData = data;
  if (!chartData || chartData.length === 0) {
    chartData = [
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
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#202836" vertical={false} />
        <XAxis 
          dataKey="day" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#717D96', fontSize: 10, fontWeight: 'bold' }}
          dy={10}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#717D96', fontSize: 10, fontWeight: 'bold' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="risk" stroke="#F59E0B" strokeWidth={2} fill="#F59E0B" fillOpacity={0.1} name="Risk Score" />
        <Area type="monotone" dataKey="rain_prob" stroke="#38BDF8" strokeWidth={2} fill="#38BDF8" fillOpacity={0.1} name="Rain %" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default { ClaimsByTypeChart, WeeklyPayoutsChart, RiskTrendChart, ForecastChart };
