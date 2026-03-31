import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  HiBeaker, HiLightningBolt, HiLocationMarker, HiExclamation,
  HiCheckCircle, HiCurrencyRupee, HiUsers, HiShieldCheck, HiClock,
} from 'react-icons/hi';
import { simulateDisruption } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import StatsCard from '../components/StatsCard';
import RiskBadge from '../components/RiskBadge';

const ZONES = [
  'Kukatpally', 'Banjara Hills', 'LB Nagar', 'Jubilee Hills', 'Old City',
  'Gachibowli', 'Secunderabad', 'Madhapur', 'Ameerpet', 'Dilsukhnagar',
];

const DISRUPTION_TYPES = [
  { value: 'heavy_rain', label: 'Heavy Rain', emoji: '\uD83C\uDF27\uFE0F', description: 'Intense rainfall disrupting delivery operations' },
  { value: 'extreme_heat', label: 'Extreme Heat', emoji: '\uD83C\uDF21\uFE0F', description: 'Dangerous heat wave affecting outdoor workers' },
  { value: 'flood', label: 'Flood', emoji: '\uD83C\uDF0A', description: 'Flooding making roads impassable' },
  { value: 'curfew', label: 'Curfew / Bandh', emoji: '\uD83D\uDEA7', description: 'Government-imposed restrictions on movement' },
  { value: 'severe_pollution', label: 'Severe Pollution', emoji: '\uD83C\uDFED', description: 'Hazardous air quality (AQI > 300) unsafe for outdoor work' },
];

const SEVERITY_LEVELS = [
  { value: 'low', label: 'Low', color: 'text-emerald-400', description: 'Minor impact, some delays' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-400', description: 'Moderate impact, reduced deliveries' },
  { value: 'high', label: 'High', color: 'text-orange-400', description: 'Major impact, most deliveries affected' },
  { value: 'extreme', label: 'Extreme', color: 'text-red-400', description: 'Complete shutdown, all deliveries halted' },
];

const DEFAULT_WEATHER_OVERRIDES = {
  heavy_rain: { rainfall_mm: 45, temperature: 26, humidity: 95, wind_speed: 30 },
  extreme_heat: { rainfall_mm: 0, temperature: 46, humidity: 20, wind_speed: 5 },
  flood: { rainfall_mm: 80, temperature: 24, humidity: 98, wind_speed: 40 },
  curfew: { rainfall_mm: 0, temperature: 32, humidity: 60, wind_speed: 10 },
  severe_pollution: { rainfall_mm: 0, temperature: 34, humidity: 55, wind_speed: 3 },
};

const SimulateDisruptionPage = () => {
  const [formData, setFormData] = useState({
    disruption_type: 'heavy_rain',
    zone: 'Kukatpally',
    severity: 'high',
    duration_hours: 4,
    rainfall_mm: 45,
    temperature: 26,
    humidity: 95,
    wind_speed: 30,
  });
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleTypeChange = (type) => {
    const overrides = DEFAULT_WEATHER_OVERRIDES[type] || {};
    setFormData(prev => ({
      ...prev,
      disruption_type: type,
      ...overrides,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'duration_hours' || name === 'rainfall_mm' || name === 'temperature' || name === 'humidity' || name === 'wind_speed' ? Number(value) : value }));
  };

  const handleSimulate = async (e) => {
    e.preventDefault();
    setSimulating(true);
    setResult(null);

    try {
      const payload = {
        event_type: formData.disruption_type,
        zone: formData.zone.toLowerCase().replace(/\s+/g, '_'),
        severity: formData.severity,
        disrupted_hours: formData.duration_hours,
        weather_data: {
          rainfall_mm: formData.rainfall_mm,
          temperature: formData.temperature,
          humidity: formData.humidity,
          wind_speed: formData.wind_speed,
        },
      };

      const response = await simulateDisruption(payload);
      setResult(response);
      toast.success('Disruption simulated successfully!');
    } catch (error) {
      console.error('Simulation error:', error);

      // Demo fallback
      if (!error.response) {
        const demoResult = {
          event: {
            id: `EVT-${Date.now().toString(36).toUpperCase()}`,
            disruption_type: formData.disruption_type,
            zone: formData.zone,
            severity: formData.severity,
            duration_hours: formData.duration_hours,
            status: 'active',
            created_at: new Date().toISOString(),
          },
          summary: {
            workers_affected: Math.floor(Math.random() * 40) + 15,
            claims_generated: Math.floor(Math.random() * 35) + 10,
            total_payouts: Math.floor(Math.random() * 15000) + 5000,
            avg_payout: Math.floor(Math.random() * 300) + 200,
            fraud_flags: Math.floor(Math.random() * 3),
            processing_time_ms: Math.floor(Math.random() * 800) + 200,
          },
          claims_breakdown: {
            paid: Math.floor(Math.random() * 20) + 5,
            pending: Math.floor(Math.random() * 10) + 2,
            flagged: Math.floor(Math.random() * 3),
          },
        };
        setResult(demoResult);
        toast.success('Disruption simulated! (Demo mode - backend offline)');
        return;
      }

      const detail = error.response?.data?.detail;
      const errorMsg = Array.isArray(detail)
        ? detail.map(e => e.msg || JSON.stringify(e)).join(', ')
        : (typeof detail === 'string' ? detail : 'Simulation failed. Please try again.');
      toast.error(errorMsg);
    } finally {
      setSimulating(false);
    }
  };

  const selectedType = DISRUPTION_TYPES.find(t => t.value === formData.disruption_type);
  const selectedSeverity = SEVERITY_LEVELS.find(s => s.value === formData.severity);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-primary-500/15 rounded-xl flex items-center justify-center">
            <HiBeaker className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Simulate Disruption</h1>
            <p className="text-slate-400 text-sm">Test the system by simulating a disruption event</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simulation Form */}
        <div>
          <form onSubmit={handleSimulate} className="space-y-6">
            {/* Disruption Type Selection */}
            <div className="card">
              <h3 className="font-semibold text-white mb-4">Disruption Type</h3>
              <div className="grid grid-cols-2 gap-3">
                {DISRUPTION_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeChange(type.value)}
                    className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                      formData.disruption_type === type.value
                        ? 'border-primary-500/50 bg-primary-500/10 ring-2 ring-primary-500/30'
                        : 'border-slate-700/50 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-2xl block mb-2">{type.emoji}</span>
                    <p className="font-medium text-white text-sm">{type.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Zone & Severity */}
            <div className="card">
              <h3 className="font-semibold text-white mb-4">Parameters</h3>
              <div className="space-y-4">
                {/* Zone */}
                <div>
                  <label className="label flex items-center gap-1.5">
                    <HiLocationMarker className="w-4 h-4 text-slate-500" />
                    Zone
                  </label>
                  <select
                    name="zone"
                    value={formData.zone}
                    onChange={handleChange}
                    className="select-field"
                  >
                    {ZONES.map(z => (
                      <option key={z} value={z}>{z}</option>
                    ))}
                  </select>
                </div>

                {/* Severity */}
                <div>
                  <label className="label flex items-center gap-1.5">
                    <HiExclamation className="w-4 h-4 text-slate-500" />
                    Severity
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {SEVERITY_LEVELS.map((sev) => (
                      <button
                        key={sev.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, severity: sev.value }))}
                        className={`py-2 px-3 rounded-lg border text-center text-sm font-medium transition-all ${
                          formData.severity === sev.value
                            ? 'border-primary-500/50 bg-primary-500/10 text-white'
                            : 'border-slate-700/50 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <span className={sev.color}>{sev.label}</span>
                      </button>
                    ))}
                  </div>
                  {selectedSeverity && (
                    <p className="text-xs text-slate-500 mt-1.5">{selectedSeverity.description}</p>
                  )}
                </div>

                {/* Duration */}
                <div>
                  <label className="label flex items-center gap-1.5">
                    <HiClock className="w-4 h-4 text-slate-500" />
                    Duration (hours)
                  </label>
                  <input
                    name="duration_hours"
                    type="number"
                    value={formData.duration_hours}
                    onChange={handleChange}
                    min={1}
                    max={24}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Advanced: Weather Overrides */}
            <div className="card">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full"
              >
                <h3 className="font-semibold text-white">Weather Data Overrides</h3>
                <span className="text-sm text-slate-400">{showAdvanced ? 'Hide' : 'Show'}</span>
              </button>

              {showAdvanced && (
                <div className="grid grid-cols-2 gap-4 mt-4 animate-fade-in">
                  <div>
                    <label className="label">Rainfall (mm/hr)</label>
                    <input
                      name="rainfall_mm"
                      type="number"
                      value={formData.rainfall_mm}
                      onChange={handleChange}
                      min={0}
                      max={200}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Temperature (C)</label>
                    <input
                      name="temperature"
                      type="number"
                      value={formData.temperature}
                      onChange={handleChange}
                      min={0}
                      max={55}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Humidity (%)</label>
                    <input
                      name="humidity"
                      type="number"
                      value={formData.humidity}
                      onChange={handleChange}
                      min={0}
                      max={100}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Wind Speed (km/h)</label>
                    <input
                      name="wind_speed"
                      type="number"
                      value={formData.wind_speed}
                      onChange={handleChange}
                      min={0}
                      max={150}
                      className="input-field"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Simulate Button */}
            <button
              type="submit"
              disabled={simulating}
              className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-3 shadow-lg shadow-primary-500/25"
            >
              {simulating ? (
                <>
                  <LoadingSpinner size="sm" text="" />
                  Simulating...
                </>
              ) : (
                <>
                  <HiLightningBolt className="w-5 h-5" />
                  Simulate Disruption
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div>
          {!result && !simulating && (
            <div className="card border border-dashed border-slate-700 flex flex-col items-center justify-center min-h-[400px] text-center">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700">
                <HiBeaker className="w-10 h-10 text-slate-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-400 mb-2">Ready to Simulate</h3>
              <p className="text-sm text-slate-600 max-w-xs">
                Configure the disruption parameters and click "Simulate" to see the system in action.
              </p>
            </div>
          )}

          {simulating && (
            <div className="card flex flex-col items-center justify-center min-h-[400px]">
              <div className="relative mb-6">
                <div className="w-20 h-20 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <HiLightningBolt className="w-8 h-8 text-primary-400 animate-pulse" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Processing Disruption...</h3>
              <div className="space-y-1 text-sm text-slate-400">
                <p className="animate-pulse">Detecting affected workers...</p>
                <p className="animate-pulse" style={{ animationDelay: '0.3s' }}>Generating claims...</p>
                <p className="animate-pulse" style={{ animationDelay: '0.6s' }}>Running fraud analysis...</p>
                <p className="animate-pulse" style={{ animationDelay: '0.9s' }}>Processing payouts...</p>
              </div>
            </div>
          )}

          {result && !simulating && (
            <div className="space-y-4 animate-slide-up">
              {/* Success banner */}
              <div className="card border border-accent-500/30 bg-gradient-to-r from-accent-500/5 to-primary-500/5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-accent-500/15 rounded-xl flex items-center justify-center">
                    <HiCheckCircle className="w-7 h-7 text-accent-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">Disruption Simulated!</h3>
                    <p className="text-sm text-slate-400">
                      {selectedType?.emoji} {selectedType?.label} in {formData.zone} ({formData.severity} severity)
                    </p>
                  </div>
                </div>
              </div>

              {/* Event details */}
              {result.event && (
                <div className="card">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <HiExclamation className="w-4 h-4 text-amber-400" />
                    Event Created
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-slate-700/30 rounded-lg p-2.5">
                      <p className="text-xs text-slate-500">Event ID</p>
                      <p className="text-slate-300 font-mono text-xs">{result.event.id}</p>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-2.5">
                      <p className="text-xs text-slate-500">Status</p>
                      <RiskBadge level={result.event.severity || formData.severity} />
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-2.5">
                      <p className="text-xs text-slate-500">Duration</p>
                      <p className="text-slate-300">{result.event.duration_hours || formData.duration_hours}h</p>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-2.5">
                      <p className="text-xs text-slate-500">Zone</p>
                      <p className="text-slate-300">{result.event.zone || formData.zone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary Stats */}
              {result.summary && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <StatsCard
                    icon={HiUsers}
                    label="Workers Affected"
                    value={result.summary.workers_affected || 0}
                    color="primary"
                  />
                  <StatsCard
                    icon={HiShieldCheck}
                    label="Claims Generated"
                    value={result.summary.claims_generated || 0}
                    color="blue"
                  />
                  <StatsCard
                    icon={HiCurrencyRupee}
                    label="Total Payouts"
                    value={`\u20B9${(result.summary.total_payouts || 0).toLocaleString('en-IN')}`}
                    color="accent"
                  />
                  <StatsCard
                    icon={HiCurrencyRupee}
                    label="Avg Payout"
                    value={`\u20B9${result.summary.avg_payout || 0}`}
                    color="amber"
                  />
                  <StatsCard
                    icon={HiExclamation}
                    label="Fraud Flags"
                    value={result.summary.fraud_flags || 0}
                    color={result.summary.fraud_flags > 0 ? 'red' : 'accent'}
                  />
                  <StatsCard
                    icon={HiClock}
                    label="Processing Time"
                    value={`${result.summary.processing_time_ms || 0}ms`}
                    color="purple"
                  />
                </div>
              )}

              {/* Claims Breakdown */}
              {result.claims_breakdown && (
                <div className="card">
                  <h4 className="font-semibold text-white mb-3">Claims Breakdown</h4>
                  <div className="space-y-2">
                    {Object.entries(result.claims_breakdown).map(([status, count]) => (
                      <div key={status} className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg">
                        <span className="text-sm text-slate-400 capitalize">{status}</span>
                        <span className="text-sm font-bold text-white">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Run Again */}
              <button
                onClick={() => setResult(null)}
                className="btn-outline w-full flex items-center justify-center gap-2"
              >
                <HiBeaker className="w-4 h-4" />
                Run Another Simulation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimulateDisruptionPage;
