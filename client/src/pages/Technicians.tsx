import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { api } from '../lib/api';
import { t, getTechnicianTagLabel } from '../lib/i18n';
import { UserCog, MapPin, CheckCircle, XCircle, Award, Clock, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';
import { TextGenerateEffect } from '../components/ui/text-generate-effect';
import { CustomSelect } from '../components/ui/custom-select';

export default function Technicians() {
  const { user, lang } = useAuth();
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [filterCountry, setFilterCountry] = useState('');
  const [loading, setLoading] = useState(true);

  const countryOptions = [
    { value: "", label: "Tous les pays", icon: <span className="text-base">🌍</span> },
    { value: "FR", label: "France", icon: <span className="text-base">🇫🇷</span> },
    { value: "DE", label: "Allemagne", icon: <span className="text-base">🇩🇪</span> },
    { value: "BE", label: "Belgique", icon: <span className="text-base">🇧🇪</span> },
    { value: "LU", label: "Luxembourg", icon: <span className="text-base">🇱🇺</span> },
  ];

  useEffect(() => { loadData(); }, [filterCountry]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/auth/technicians${filterCountry ? `?country=${filterCountry}` : ''}`);
      setTechnicians(data);
    } catch (e) {}
    setLoading(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <TextGenerateEffect words={t('nav.technicians')} className="text-2xl text-gray-900 dark:text-white" duration={0.3} />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{technicians.length} techniciens</p>
        </div>
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

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {technicians.map((tech, idx) => (
            <motion.div
              key={tech.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 hover:shadow-lg hover:border-blue-200/50 dark:hover:border-blue-500/30 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
                    {tech.first_name[0]}{tech.last_name[0]}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{tech.first_name} {tech.last_name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{tech.email}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border font-medium ${
                  tech.is_available
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                    : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                }`}>
                  {tech.is_available ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {tech.is_available ? 'Disponible' : 'Indisponible'}
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  <span>{tech.city}, {t(`country.${tech.country}`)}</span>
                </div>
                <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                  <Award className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {(tech.certifications || []).map((cert: string) => (
                      <span key={cert} className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-xs px-2 py-0.5 rounded-lg border border-blue-100 dark:border-blue-800">
                        {getTechnicianTagLabel(cert, lang)}
                      </span>
                      ))}
                    </div>
                </div>
                <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                  <Briefcase className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" />
                    <div className="flex flex-wrap gap-1">
                      {(tech.skills || []).map((skill: string) => (
                      <span key={skill} className="bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 text-xs px-2 py-0.5 rounded-lg border border-purple-100 dark:border-purple-800">
                        {getTechnicianTagLabel(skill, lang)}
                      </span>
                      ))}
                    </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-800 grid grid-cols-2 gap-3 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
                  <span>Max: <span className="font-medium text-gray-900 dark:text-white">{tech.max_daily_interventions}/jour</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
                  <span className="font-medium text-gray-900 dark:text-white">{tech.work_start_time}-{tech.work_end_time}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
