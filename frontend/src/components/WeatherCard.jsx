import React from 'react';
import { WiRain, WiDaySunny, WiCloudy, WiThunderstorm, WiFlood, WiHot } from 'react-icons/wi';
import RiskBadge from './RiskBadge';

const weatherIcons = {
  rain: WiRain,
  heavy_rain: WiThunderstorm,
  sunny: WiDaySunny,
  clear: WiDaySunny,
  cloudy: WiCloudy,
  storm: WiThunderstorm,
  thunderstorm: WiThunderstorm,
  flood: WiFlood,
  extreme_heat: WiHot,
  hot: WiHot,
};

const getWeatherIcon = (condition) => {
  if (!condition) return WiCloudy;
  const normalized = condition.toLowerCase().replace(/\s+/g, '_');
  return weatherIcons[normalized] || WiCloudy;
};

const WeatherCard = ({ weather, zone, className = '' }) => {
  if (!weather) {
    return (
      <div className={`card ${className}`}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-700 rounded w-1/3" />
          <div className="h-8 bg-slate-700 rounded w-1/2" />
          <div className="h-3 bg-slate-700 rounded w-2/3" />
        </div>
      </div>
    );
  }

  const WeatherIcon = getWeatherIcon(weather.condition || weather.weather_condition);
  const temp = weather.temperature ?? weather.temp ?? '--';
  const humidity = weather.humidity ?? '--';
  const rainfall = weather.rainfall ?? weather.rainfall_mm ?? 0;
  const riskLevel = weather.risk_level || weather.risk || 'low';
  const condition = weather.condition || weather.weather_condition || 'Unknown';
  const updatedAt = weather.timestamp || weather.updated_at;

  return (
    <div className={`card ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-slate-400 font-medium">Weather</p>
          {zone && <p className="text-xs text-slate-500">{zone}</p>}
        </div>
        <RiskBadge level={riskLevel} />
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-slate-700/50 rounded-xl flex items-center justify-center">
          <WeatherIcon className="w-10 h-10 text-blue-400" />
        </div>
        <div>
          <p className="text-3xl font-bold text-white">{temp}°C</p>
          <p className="text-sm text-slate-400 capitalize">{condition.replace(/_/g, ' ')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-700/30 rounded-lg p-2.5">
          <p className="text-xs text-slate-500">Humidity</p>
          <p className="text-sm font-semibold text-slate-200">{humidity}%</p>
        </div>
        <div className="bg-slate-700/30 rounded-lg p-2.5">
          <p className="text-xs text-slate-500">Rainfall</p>
          <p className="text-sm font-semibold text-slate-200">{rainfall} mm/hr</p>
        </div>
      </div>

      {updatedAt && (
        <p className="text-xs text-slate-600 mt-3">
          Updated: {new Date(updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </div>
  );
};

export default WeatherCard;
