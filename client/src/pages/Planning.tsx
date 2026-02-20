import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { api } from '../lib/api';
import { t, getStatusLabel, getTypeLabel } from '../lib/i18n';
import { Calendar, Clock, User, MapPin, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { TextGenerateEffect } from '../components/ui/text-generate-effect';
import { CustomDateInput } from '../components/ui/custom-date-input';
import { CustomSelect } from '../components/ui/custom-select';

const STATUS_COLORS: Record<string, string> = {
  'en_attente': '#6b7280',
  'planifiee_auto': '#3b82f6',
  'confirmee': '#8b5cf6',
  'en_cours': '#f59e0b',
  'en_retard': '#ef4444',
  'reportee': '#f97316',
  'finalisee': '#10b981',
  'annulee': '#9ca3af',
};

const STATUS_BG_LIGHT: Record<string, string> = {
  'en_attente': 'bg-gray-500',
  'planifiee_auto': 'bg-blue-500',
  'confirmee': 'bg-purple-500',
  'en_cours': 'bg-amber-500',
  'en_retard': 'bg-red-500',
  'reportee': 'bg-orange-500',
  'finalisee': 'bg-emerald-500',
  'annulee': 'bg-gray-400',
};

export default function Planning() {
  const { user, lang } = useAuth();
  const navigate = useNavigate();
  const [interventions, setInterventions] = useState<any[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterCountry, setFilterCountry] = useState(user?.role === 'admin_pays' ? user.country : '');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [selectedDate, filterCountry]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ date_from: selectedDate, date_to: selectedDate });
      if (filterCountry) params.set('country', filterCountry);
      const [ints, techs] = await Promise.all([
        api.get(`/interventions?${params.toString()}`),
        api.get(`/auth/technicians${filterCountry ? `?country=${filterCountry}` : ''}`),
      ]);
      setInterventions(ints);
      setTechnicians(techs);
    } catch (e) {}
    setLoading(false);
  };

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Group interventions by technician
  const byTech: Record<string, any[]> = {};
  interventions.forEach(int => {
    const key = int.technician_id || 'unassigned';
    if (!byTech[key]) byTech[key] = [];
    byTech[key].push(int);
  });

  // Generate time slots (8-18)
  const hours = Array.from({ length: 11 }, (_, i) => i + 8);

  const dayLabel = new Date(selectedDate).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const countryOptions = [
    { value: "", label: "Tous les pays", icon: <span className="text-base">🌍</span> },
    { value: "FR", label: "France", icon: <span className="text-base">🇫🇷</span> },
    { value: "DE", label: "Allemagne", icon: <span className="text-base">🇩🇪</span> },
    { value: "BE", label: "Belgique", icon: <span className="text-base">🇧🇪</span> },
    { value: "LU", label: "Luxembourg", icon: <span className="text-base">🇱🇺</span> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <TextGenerateEffect
            words={t('nav.planning')}
            className="text-2xl text-gray-900 dark:text-white"
            duration={0.3}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 capitalize">{dayLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeDate(-1)}
              className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <CustomDateInput
              value={selectedDate}
              onChange={setSelectedDate}
              placeholder="Choisir une date"
              className="w-44"
            />
            <button
              onClick={() => changeDate(1)}
              className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-3 py-2 text-xs font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors shadow-sm"
          >
            Aujourd'hui
          </button>
          {user?.role === 'super_admin' && (
            <div className="w-48">
              <CustomSelect
                value={filterCountry}
                onChange={setFilterCountry}
                options={countryOptions}
                placeholder="Tous les pays"
              />
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-500 dark:text-gray-400 text-sm">{t('common.loading')}</span>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm"
        >
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Header hours */}
              <div className="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-800/80">
                <div className="w-52 flex-shrink-0 px-4 py-3 font-medium text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-100 dark:border-gray-800">Technicien</div>
                {hours.map(h => (
                  <div key={h} className="flex-1 px-2 py-3 text-center text-xs font-medium text-gray-400 dark:text-gray-500 border-r border-gray-50 dark:border-gray-800 last:border-0">
                    {String(h).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Technician rows */}
              {technicians.map((tech, idx) => {
                const techInts = byTech[tech.id] || [];
                return (
                  <motion.div
                    key={tech.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className="flex border-b border-gray-50 dark:border-gray-800 hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-colors"
                  >
                    <div className="w-52 flex-shrink-0 px-4 py-3 border-r border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm">
                          {tech.first_name[0]}{tech.last_name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{tech.first_name} {tech.last_name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {tech.city}
                            {!tech.is_available && <span className="text-red-400 ml-1">(indispo.)</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 relative" style={{ height: '64px' }}>
                      {techInts.map((int: any) => {
                        if (!int.scheduled_start_time || !int.scheduled_end_time) return null;
                        const [sh, sm] = int.scheduled_start_time.split(':').map(Number);
                        const [eh, em] = int.scheduled_end_time.split(':').map(Number);
                        const startMin = (sh - 8) * 60 + sm;
                        const endMin = (eh - 8) * 60 + em;
                        const totalMin = 11 * 60;
                        const left = `${(startMin / totalMin) * 100}%`;
                        const width = `${((endMin - startMin) / totalMin) * 100}%`;

                        return (
                          <motion.div
                            key={int.id}
                            initial={{ opacity: 0, scaleX: 0 }}
                            animate={{ opacity: 1, scaleX: 1 }}
                            transition={{ delay: 0.2 + idx * 0.03 }}
                            style={{
                              left,
                              width,
                              originX: 0,
                              minWidth: '40px',
                            }}
                            className="absolute top-2 bottom-2 rounded-lg px-2.5 py-1 text-xs text-white cursor-pointer hover:opacity-90 transition-opacity overflow-hidden shadow-sm"
                            onClick={() => navigate(`/interventions/${int.id}`)}
                            title={`${int.reference} - ${getTypeLabel(int.type, lang)} - ${int.scheduled_start_time}-${int.scheduled_end_time}`}
                          >
                            {/* Background with gradient */}
                            <div
                              className="absolute inset-0 rounded-lg"
                              style={{
                                background: `linear-gradient(135deg, ${STATUS_COLORS[int.status] || '#6b7280'}, ${STATUS_COLORS[int.status] || '#6b7280'}dd)`,
                              }}
                            />
                            <div className="relative z-10">
                              <div className="truncate font-semibold">{int.reference}</div>
                              <div className="truncate opacity-80 text-[10px]">{int.city}</div>
                            </div>
                          </motion.div>
                        );
                      })}
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {hours.map(h => (
                          <div key={h} className="flex-1 border-r border-gray-50 dark:border-gray-800 last:border-0" />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {/* Unassigned */}
              {byTech['unassigned']?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex border-b bg-red-50/50 dark:bg-red-900/10 dark:border-red-900/30"
                >
                  <div className="w-52 flex-shrink-0 px-4 py-3 border-r border-red-100 dark:border-red-900/30">
                    <p className="text-sm font-medium text-red-600">Non assignees</p>
                    <p className="text-xs text-red-400">{byTech['unassigned'].length} interventions</p>
                  </div>
                  <div className="flex-1 px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {byTech['unassigned'].map((int: any) => (
                        <span
                          key={int.id}
                          onClick={() => navigate(`/interventions/${int.id}`)}
                          className="bg-red-100 text-red-700 text-xs px-3 py-1.5 rounded-lg border border-red-200 cursor-pointer hover:bg-red-200 transition-colors font-medium"
                        >
                          {int.reference} - {int.city}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm"
      >
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Legende des statuts</h3>
        <div className="flex flex-wrap gap-4">
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-600 dark:text-gray-400">{getStatusLabel(status, lang)}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
