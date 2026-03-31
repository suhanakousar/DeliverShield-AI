import React, { useState, useEffect } from 'react';
import { getWeather } from '../services/api';

const ZONES = ['kukatpally', 'banjara_hills', 'old_city', 'gachibowli', 'lb_nagar', 'madhapur'];

const getConditionEmoji = (condition) => {
  if (!condition) return '🌤️';
  const c = condition.toLowerCase();
  if (c.includes('rain') || c.includes('storm')) return '🌧️';
  if (c.includes('extreme_heat') || c.includes('very_hot')) return '🔥';
  if (c.includes('flood')) return '🌊';
  if (c.includes('hot') || c.includes('heat')) return '☀️';
  if (c.includes('cloud')) return '⛅';
  if (c.includes('clear') || c.includes('pleasant')) return '🌤️';
  return '🌤️';
};

const LiveWeatherBar = () => {
  const [weatherData, setWeatherData] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchWeather = async () => {
      const results = {};
      for (const zone of ZONES) {
        try {
          const data = await getWeather(zone);
          results[zone] = data.weather || data;
        } catch (e) {
          // skip
        }
      }
      setWeatherData(results);
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const ticker = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % ZONES.length);
    }, 4000);
    return () => clearInterval(ticker);
  }, []);

  const zones = Object.keys(weatherData);
  if (zones.length === 0) return null;

  return (
    <div className="bg-slate-800/80 border-b border-slate-700/50 px-4 py-1.5 overflow-hidden">
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1 text-emerald-400 font-semibold flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          LIVE
        </span>
        <div className="flex gap-4 overflow-hidden">
          {ZONES.map((zone) => {
            const w = weatherData[zone];
            if (!w) return null;
            return (
              <div key={zone} className="flex items-center gap-1.5 text-slate-300 flex-shrink-0 transition-all">
                <span>{getConditionEmoji(w.weather_condition)}</span>
                <span className="text-slate-400">{zone.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span>
                <span className="font-medium">{w.temperature?.toFixed(0)}°C</span>
                {w.rainfall_mm_hr > 0 && (
                  <span className="text-blue-400">{w.rainfall_mm_hr?.toFixed(1)}mm/hr</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LiveWeatherBar;
