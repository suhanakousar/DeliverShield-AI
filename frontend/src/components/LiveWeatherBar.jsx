import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getWeather } from '../services/api';
import { HiOutlineSun, HiOutlineCloud, HiOutlineLightningBolt, HiOutlineLocationMarker } from 'react-icons/hi';

const ZONES = ['kukatpally', 'banjara_hills', 'old_city', 'gachibowli', 'lb_nagar', 'madhapur'];

const getConditionIcon = (condition) => {
  if (!condition) return HiOutlineSun;
  const c = condition.toLowerCase();
  if (c.includes('rain') || c.includes('storm')) return HiOutlineLightningBolt;
  if (c.includes('extreme_heat') || c.includes('very_hot')) return HiOutlineSun;
  if (c.includes('flood')) return HiOutlineCloud;
  if (c.includes('hot') || c.includes('heat')) return HiOutlineSun;
  if (c.includes('cloud')) return HiOutlineCloud;
  if (c.includes('clear') || c.includes('pleasant')) return HiOutlineSun;
  return HiOutlineSun;
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

  // We'll show a scrolling marquee effect
  return (
    <div className="bg-base-950 border-b border-base-800 px-4 py-2.5 overflow-hidden flex items-center shadow-inner">
      <div className="flex items-center gap-2 pr-4 border-r border-base-800 shrink-0">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500"></span>
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-success-400">Live</span>
      </div>
      
      <div className="flex-1 overflow-hidden relative ml-4">
        <div className="flex animate-[marquee_30s_linear_infinite] whitespace-nowrap hover:[animation-play-state:paused]">
          {[...ZONES, ...ZONES].map((zone, idx) => {
            const w = weatherData[zone];
            if (!w) return null;
            const Icon = getConditionIcon(w.weather_condition);
            return (
              <div key={`${zone}-${idx}`} className="flex items-center gap-3 px-6 shrink-0 border-r border-base-800/50 last:border-0">
                <Icon className="w-4 h-4 text-base-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-base-300">
                  {zone.replace(/_/g, ' ')}
                </span>
                <span className="text-sm font-bold text-base-100">{w.temperature?.toFixed(0)}°</span>
                {w.rainfall_mm_hr > 0 && (
                  <span className="text-xs font-bold text-info-400 bg-info-500/10 px-2 py-0.5 rounded-full">
                    {w.rainfall_mm_hr?.toFixed(1)}mm/hr
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}} />
    </div>
  );
};

export default LiveWeatherBar;
