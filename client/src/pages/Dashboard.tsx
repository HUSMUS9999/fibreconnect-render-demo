import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { api } from '../lib/api';
import { t, getCountryName, getStatusLabel } from '../lib/i18n';
import { 
  ClipboardList, AlertTriangle, CheckCircle2, Clock, TrendingUp, Users, 
  Globe, Activity, Star, Zap, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { CardHoverEffect, GlowCard, BentoGrid, BentoGridItem } from '../components/ui/card-hover-effect';
import { TextGenerateEffect } from '../components/ui/text-generate-effect';
import { AnimatedProgress } from '../components/ui/animated-helpers';
import { CustomSelect } from '../components/ui/custom-select';
import { useTheme } from '../lib/theme';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
const countryColors: Record<string, string> = { 'FR': '#3b82f6', 'DE': '#000000', 'BE': '#f59e0b', 'LU': '#ef4444' };

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

export default function Dashboard() {
  const { user, lang } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [countries, setCountries] = useState<any[]>([]);
  const [filterCountry, setFilterCountry] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [filterCountry]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        api.get(`/dashboard/stats${filterCountry ? `?country=${filterCountry}` : ''}`),
        api.get('/dashboard/countries'),
      ]);
      setStats(s);
      setCountries(c);
    } catch (e) {}
    setLoading(false);
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500 dark:text-gray-400 text-sm">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  const activeCount = stats.by_status?.filter((s: any) => 
    !['finalisee', 'annulee'].includes(s.status)
  ).reduce((sum: number, s: any) => sum + s.count, 0) || 0;

  const delayedCount = stats.by_status?.find((s: any) => s.status === 'en_retard')?.count || 0;

  const statusData = stats.by_status?.map((s: any) => ({
    name: getStatusLabel(s.status, lang),
    value: s.count,
    color: STATUS_COLORS[s.status] || '#6b7280',
  })) || [];

  const kpiItems = [
    {
      title: t('dashboard.total'),
      description: t('dashboard.total'),
      value: stats.total,
      icon: <ClipboardList className="w-5 h-5" />,
      color: "blue",
    },
    {
      title: t('dashboard.active'),
      description: t('dashboard.active'),
      value: activeCount,
      icon: <Activity className="w-5 h-5" />,
      color: "amber",
      subtitle: `${delayedCount} ${t('dashboard.delayed').toLowerCase()}`,
      subtitleColor: "red" as const,
    },
    {
      title: t('dashboard.sla_rate'),
      description: t('dashboard.sla_rate'),
      value: `${stats.sla_rate}%`,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: "emerald",
      trend: (stats.sla_rate >= 90 ? 'up' : 'down') as 'up' | 'down',
    },
    {
      title: "Note moyenne",
      description: "Note moyenne",
      value: stats.avg_rating ? `${stats.avg_rating}/5` : 'N/A',
      icon: <Star className="w-5 h-5" />,
      color: "purple",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <TextGenerateEffect
            words={t('nav.dashboard')}
            className="text-2xl text-gray-900 dark:text-white"
            duration={0.3}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {user?.role === 'super_admin' ? 'Vue globale Europe' : `${getCountryName(user?.country || 'FR', lang)}`}
          </p>
        </div>
        {user?.role === 'super_admin' && (
          <CustomSelect
            value={filterCountry}
            onChange={setFilterCountry}
            placeholder={`${t('common.all')} - Europe`}
            options={[
              { value: '', label: `${t('common.all')} - Europe`, icon: '🌍' },
              { value: 'FR', label: 'France', icon: '🇫🇷' },
              { value: 'DE', label: 'Allemagne', icon: '🇩🇪' },
              { value: 'BE', label: 'Belgique', icon: '🇧🇪' },
              { value: 'LU', label: 'Luxembourg', icon: '🇱🇺' },
            ]}
            className="w-48"
          />
        )}
      </div>

      {/* KPI Cards with hover effect */}
      <CardHoverEffect items={kpiItems} />

      {/* Country Overview */}
      {user?.role === 'super_admin' && !filterCountry && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {countries.map((c: any, idx: number) => (
              <motion.div
                key={c.code}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className="h-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 cursor-pointer hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300"
                onClick={() => setFilterCountry(c.code)}
              >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {c.code === 'FR' ? '\u{1F1EB}\u{1F1F7}' : c.code === 'DE' ? '\u{1F1E9}\u{1F1EA}' : c.code === 'BE' ? '\u{1F1E7}\u{1F1EA}' : '\u{1F1F1}\u{1F1FA}'}
                  </span>
                  <span className="font-semibold text-sm text-gray-900 dark:text-white">{getCountryName(c.code, lang)}</span>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-lg">{c.technicians} techs</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{c.total}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-600">{c.active}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Actives</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-emerald-600">{c.sla_rate.toFixed(0)}%</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">SLA</p>
                </div>
              </div>
              <div className="mt-3 h-8">
                {c.delayed > 0 ? (
                  <div className="h-8 px-2 bg-red-50 rounded-lg text-xs text-red-600 text-center font-medium flex items-center justify-center">
                    {c.delayed} en retard
                  </div>
                ) : null}
              </div>
              </motion.div>
          ))}
        </div>
      )}

      {/* Charts in Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-shadow duration-300"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Repartition par statut</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {statusData.map((entry: any, index: number) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  color: theme === 'dark' ? '#f3f4f6' : '#111827',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Daily trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-shadow duration-300"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Interventions (30 jours)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.daily_interventions || []}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#f0f0f0'} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }} tickFormatter={v => v?.slice(5)} />
              <YAxis tick={{ fontSize: 11, fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: theme === 'dark' ? '1px solid #374151' : '1px solid #e5e7eb',
                  backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                  color: theme === 'dark' ? '#f3f4f6' : '#111827',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
              />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Planning mode distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-shadow duration-300"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Mode de planification</h3>
          <div className="space-y-4">
            {(stats.planning_modes || []).map((pm: any) => {
              const total = stats.total || 1;
              const pct = ((pm.count / total) * 100);
              return (
                <div key={pm.planning_mode} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pm.planning_mode === 'auto' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                    <Zap className={`w-5 h-5 ${pm.planning_mode === 'auto' ? 'text-emerald-600' : 'text-amber-600'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">{pm.planning_mode === 'auto' ? 'Automatique' : 'Manuel'}</span>
                      <span className="text-gray-500">{pm.count} ({pct.toFixed(1)}%)</span>
                    </div>
                    <AnimatedProgress
                      value={pct}
                      barClassName={pm.planning_mode === 'auto' ? 'from-emerald-400 to-emerald-600' : 'from-amber-400 to-amber-600'}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Technician performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-shadow duration-300"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('dashboard.performance')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">
                  <th className="pb-3">Technicien</th>
                  <th className="pb-3 text-center">Total</th>
                  <th className="pb-3 text-center">Terminees</th>
                  <th className="pb-3 text-center">Retards</th>
                  <th className="pb-3 text-center">Note</th>
                </tr>
              </thead>
              <tbody>
                {(stats.technician_performance || []).slice(0, 8).map((tp: any, idx: number) => (
                  <motion.tr
                    key={tp.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.05 }}
                    className="border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="py-2.5">
                      <span className="font-medium text-gray-900 dark:text-white">{tp.first_name} {tp.last_name}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                        {tp.country === 'FR' ? '\u{1F1EB}\u{1F1F7}' : tp.country === 'DE' ? '\u{1F1E9}\u{1F1EA}' : tp.country === 'BE' ? '\u{1F1E7}\u{1F1EA}' : '\u{1F1F1}\u{1F1FA}'}
                      </span>
                    </td>
                    <td className="text-center text-gray-600 dark:text-gray-400">{tp.total_interventions}</td>
                    <td className="text-center">
                      <span className="text-emerald-600 font-medium">{tp.completed}</span>
                    </td>
                    <td className="text-center">
                      <span className={`font-medium ${tp.delayed > 0 ? 'text-red-600' : 'text-gray-400'}`}>{tp.delayed}</span>
                    </td>
                    <td className="text-center text-gray-600 dark:text-gray-400">{tp.avg_rating ? `${Number(tp.avg_rating).toFixed(1)}/5` : '-'}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
