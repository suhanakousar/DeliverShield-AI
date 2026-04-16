import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineLightningBolt, HiOutlineCloud, HiOutlineSun, HiOutlineShieldExclamation } from 'react-icons/hi';
import toast from 'react-hot-toast';

const ZONES = ['Kukatpally', 'Banjara Hills', 'LB Nagar', 'Jubilee Hills', 'Old City', 'Gachibowli', 'Madhapur'];

const DISRUPTION_TYPES = [
  { value: 'heavy_rain', label: 'Heavy Rain', icon: HiOutlineCloud },
  { value: 'extreme_heat', label: 'Extreme Heat', icon: HiOutlineSun },
  { value: 'flood', label: 'Flood', icon: HiOutlineCloud },
  { value: 'curfew', label: 'Curfew', icon: HiOutlineShieldExclamation },
];

const SimulateDisruptionPage = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    disruption_type: 'heavy_rain',
    zone: 'Kukatpally',
    severity: 'high',
    duration_hours: 4,
  });

  const handleSimulate = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Fake simulation delay
    await new Promise(r => setTimeout(r, 2000));
    setLoading(false);
    toast.success(`Simulated ${formData.disruption_type} in ${formData.zone}!`);
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-12">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-primary-500/10 border border-primary-500/20 rounded-2xl flex items-center justify-center text-primary-500 mx-auto mb-6">
          <HiOutlineLightningBolt className="w-8 h-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-sans tracking-tighter text-base-100 mb-2">Simulate Event</h1>
        <p className="text-base-400 font-medium">Trigger a test disruption to verify system behavior.</p>
      </div>

      <div className="card p-8">
        <form onSubmit={handleSimulate} className="space-y-8">
          
          <div>
            <label className="label mb-4">Event Type</label>
            <div className="grid grid-cols-2 gap-4">
              {DISRUPTION_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, disruption_type: type.value }))}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-colors ${
                    formData.disruption_type === type.value 
                      ? 'bg-primary-500/10 border-primary-500 text-primary-400 shadow-inner' 
                      : 'bg-base-950 border-base-800 text-base-400 hover:border-base-700'
                  }`}
                >
                  <type.icon className="w-8 h-8" />
                  <span className="font-bold text-sm">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Zone</label>
              <select 
                value={formData.zone} 
                onChange={e => setFormData(prev => ({ ...prev, zone: e.target.value }))}
                className="select-field"
              >
                {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Severity</label>
              <select 
                value={formData.severity} 
                onChange={e => setFormData(prev => ({ ...prev, severity: e.target.value }))}
                className="select-field"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="extreme">Extreme</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label">Duration (Hours): {formData.duration_hours}h</label>
            <input 
              type="range" 
              min="1" max="24" 
              value={formData.duration_hours} 
              onChange={e => setFormData(prev => ({ ...prev, duration_hours: Number(e.target.value) }))}
              className="w-full h-2 bg-base-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="btn-primary w-full py-4 text-lg shadow-xl shadow-primary-500/20 gap-2"
          >
            {loading ? 'Simulating Event...' : 'Trigger Disruption Simulation'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SimulateDisruptionPage;
