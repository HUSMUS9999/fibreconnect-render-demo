import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { api } from '../lib/api';
import { t, getCountryName, getDelayCategoryLabel, getTypeLabel } from '../lib/i18n';
import { AlertTriangle, TrendingDown, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { TextGenerateEffect } from '../components/ui/text-generate-effect';
import { CustomSelect } from '../components/ui/custom-select';
import { useTheme } from '../lib/theme';

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#3b82f6', '#8b5cf6', '#6b7280'];

export default function SLAReport() {
  const { user, lang } = useAuth();
  const { theme } = useTheme();
  const [report, setReport] = useState<any>(null);
  const [filterCountry, setFilterCountry] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [filterCountry]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = filterCountry ? `?country=${filterCountry}` : '';
      setReport(await api.get(`/dashboard/sla-report${params}`));
    } catch (e) {}
    setLoading(false);
  };

  if (loading || !report) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500 dark:text-gray-400 text-sm">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  const categoryData = (report.by_category || []).map((c: any) => ({
    name: getDelayCategoryLabel(c.delay_category, lang),
    value: c.count,
  }));

  const countryData = (report.by_country || []).map((c: any) => ({
    name: getCountryName(c.country, lang),
    count: c.count,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <TextGenerateEffect words={t('nav.sla')} className="text-2xl text-gray-900 dark:text-white" duration={0.3} />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {report.violations?.length || 0} violations SLA detectees
          </p>
        </div>
        {user?.role === 'super_admin' && (
          <CustomSelect
            value={filterCountry}
            onChange={setFilterCountry}
            placeholder="Tous les pays"
            options={[
              { value: '', label: 'Tous les pays', icon: '🌍' },
              { value: 'FR', label: 'France', icon: '🇫🇷' },
              { value: 'DE', label: 'Allemagne', icon: '🇩🇪' },
              { value: 'BE', label: 'Belgique', icon: '🇧🇪' },
              { value: 'LU', label: 'Luxembourg', icon: '🇱🇺' },
            ]}
            className="w-48"
          />
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-lg transition-shadow duration-300"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Causes des retards</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
                  {categoryData.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb', backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', color: theme === 'dark' ? '#f3f4f6' : '#111827', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">Aucune donnee</div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-lg transition-shadow duration-300"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Violations par pays</h3>
          {countryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={countryData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#f0f0f0'} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb', backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', color: theme === 'dark' ? '#f3f4f6' : '#111827', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" fill="#ef4444" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">Aucune donnee</div>
          )}
        </motion.div>
      </div>

      {/* Violations list */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm"
      >
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">Detail des violations</h3>
        </div>
        {report.violations?.length === 0 ? (
          <div className="p-12 text-center text-gray-400">Aucune violation SLA</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">Reference</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">Ville</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">Cause</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">Deadline</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {(report.violations || []).map((v: any, idx: number) => (
                <motion.tr
                  key={v.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.02 }}
                  className="hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors"
                >
                  <td className="px-4 py-3 font-mono font-semibold text-blue-600 dark:text-blue-400">{v.reference}</td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{getTypeLabel(v.type, lang)}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{v.city}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
                      {v.delay_category ? getDelayCategoryLabel(v.delay_category, lang) : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{v.expected_time ? new Date(v.expected_time).toLocaleString() : '-'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{v.justification || <span className="text-red-500 dark:text-red-400 italic text-xs">Non justifie</span>}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>
    </div>
  );
}
