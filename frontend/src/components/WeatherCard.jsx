import React from 'react';
import { motion } from 'framer-motion';
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
      <div className={`card ${className} h-full`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-base-800 rounded-lg w-1/3" />
          <div className="h-16 bg-base-800 rounded-xl w-1/2" />
          <div className="h-20 bg-base-800 rounded-xl w-full" />
        </div>
      </div>
    );
  }

  const WeatherIcon = getWeatherIcon(weather.condition || weather.weather_condition);
  const temp = weather.temperature ?? weather.temp ?? '--';
  const humidity = weather.humidity ?? '--';
  const rainfall = weather.rainfall_mm_hr ?? weather.rainfall ?? weather.rainfall_mm ?? 0;
  const riskLevel = weather.risk_level || weather.risk || 'low';
  const condition = weather.condition || weather.weather_condition || 'Unknown';
  const updatedAt = weather.timestamp || weather.updated_at;

  return (
    <motion.div 
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      className={`card flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-base-500 mb-1">Current Weather</p>
            {zone && <p className="text-base-200 font-semibold">{zone.replace(/_/g, ' ')}</p>}
          </div>
          <RiskBadge level={riskLevel} />
        </div>

        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 bg-info-500/10 border border-info-500/20 rounded-2xl flex items-center justify-center text-info-400">
            <WeatherIcon className="w-14 h-14" />
          </div>
          <div>
            <p className="text-5xl font-extrabold font-sans tracking-tighter text-base-100">{temp}°</p>
            <p className="text-base-400 font-medium capitalize mt-1">{condition.replace(/_/g, ' ')}</p>
          </div>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-base-950/50 rounded-xl p-4 border border-base-800">
            <p className="text-xs font-bold text-base-500 uppercase tracking-wider mb-1">Humidity</p>
            <p className="text-lg font-bold text-base-200">{humidity}%</p>
          </div>
          <div className="bg-base-950/50 rounded-xl p-4 border border-base-800">
            <p className="text-xs font-bold text-base-500 uppercase tracking-wider mb-1">Rainfall</p>
            <p className="text-lg font-bold text-base-200">{rainfall} <span className="text-sm font-medium text-base-500">mm/hr</span></p>
          </div>
        </div>

        {updatedAt && (
          <p className="text-xs font-medium text-base-600 mt-4 text-center">
            Updated today at {new Date(updatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default WeatherCard;
