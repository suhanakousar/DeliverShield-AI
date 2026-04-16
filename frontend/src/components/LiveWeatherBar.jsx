import React, { useState, useEffect, useRef } from 'react';
import { getWeatherByCoords } from '../services/api';
import { HiOutlineSun, HiOutlineCloud, HiOutlineLightningBolt, HiLocationMarker } from 'react-icons/hi';

const getConditionIcon = (condition) => {
  if (!condition) return HiOutlineSun;
  const c = condition.toLowerCase();
  if (c.includes('rain') || c.includes('storm') || c.includes('thunder')) return HiOutlineLightningBolt;
  if (c.includes('cloud')) return HiOutlineCloud;
  return HiOutlineSun;
};

const LiveWeatherBar = () => {
  const [weather, setWeather] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [status, setStatus] = useState('idle');
  const coordsRef = useRef(null);

  const fetchWeather = async (lat, lon) => {
    try {
      const data = await getWeatherByCoords(lat, lon);
      setWeather(data.weather || data);
    } catch {
      setStatus('error');
    }
  };

  const reverseGeocode = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=14`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const addr = data.address || {};
      const name =
        addr.neighbourhood || addr.suburb || addr.city_district ||
        addr.town || addr.city || addr.state_district || '';
      setLocationName(name || data.display_name?.split(',')[0] || '');
    } catch {
      setLocationName('');
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus('unsupported');
      return;
    }

    setStatus('locating');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        coordsRef.current = { lat: latitude, lon: longitude };
        setStatus('fetching');
        fetchWeather(latitude, longitude);
        reverseGeocode(latitude, longitude);
      },
      () => {
        setStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }, []);

  useEffect(() => {
    if (!coordsRef.current) return;
    const interval = setInterval(() => {
      if (coordsRef.current) {
        fetchWeather(coordsRef.current.lat, coordsRef.current.lon);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (status === 'idle' || status === 'locating') {
    return (
      <div className="bg-base-950 border-b border-base-800 px-4 py-2.5 flex items-center gap-3 shadow-inner">
        <div className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
        </div>
        <span className="text-xs text-base-400">Requesting location for live weather…</span>
      </div>
    );
  }

  if (status === 'denied' || status === 'unsupported') {
    return (
      <div className="bg-base-950 border-b border-base-800 px-4 py-2.5 flex items-center gap-2 shadow-inner">
        <HiLocationMarker className="w-4 h-4 text-base-500 shrink-0" />
        <span className="text-xs text-base-500">Enable location permission to see live weather for your area.</span>
      </div>
    );
  }

  if (!weather) return null;

  const Icon = getConditionIcon(weather.weather_condition);
  const temp = weather.temperature?.toFixed(1);
  const rain = weather.rainfall_mm_hr;
  const humidity = weather.humidity;
  const wind = weather.wind_speed;
  const desc = weather.weather_description || weather.weather_condition || '';
  const isAlert = rain > 15 || weather.temperature > 42;

  return (
    <div className={`border-b px-4 py-2.5 flex items-center gap-4 shadow-inner transition-colors ${isAlert ? 'bg-danger-900/30 border-danger-700/50' : 'bg-base-950 border-base-800'}`}>
      <div className="flex items-center gap-2 pr-4 border-r border-base-800 shrink-0">
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-success-400">Live</span>
      </div>

      <HiLocationMarker className="w-4 h-4 text-primary-400 shrink-0" />

      {locationName && (
        <span className="text-xs font-bold uppercase tracking-wider text-base-300 shrink-0">
          {locationName}
        </span>
      )}

      <Icon className={`w-4 h-4 shrink-0 ${isAlert ? 'text-danger-400' : 'text-base-400'}`} />

      <span className={`text-sm font-bold shrink-0 ${isAlert ? 'text-danger-300' : 'text-base-100'}`}>
        {temp}°C
      </span>

      {desc && (
        <span className="text-xs text-base-400 capitalize shrink-0 hidden sm:inline">
          {desc}
        </span>
      )}

      <div className="flex items-center gap-4 ml-auto text-xs text-base-400 shrink-0 flex-wrap">
        {rain > 0 && (
          <span className={`font-bold px-2 py-0.5 rounded-full ${rain > 15 ? 'text-danger-300 bg-danger-500/15' : 'text-info-400 bg-info-500/10'}`}>
            Rain {rain.toFixed(1)} mm/hr
          </span>
        )}
        {humidity != null && (
          <span className="hidden md:inline">Humidity {humidity}%</span>
        )}
        {wind != null && (
          <span className="hidden md:inline">Wind {wind} km/h</span>
        )}
        <span className="text-base-600">Open-Meteo</span>
      </div>
    </div>
  );
};

export default LiveWeatherBar;
