import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { api } from '../lib/api';
import { t, getStatusLabel, getTypeLabel, getPriorityLabel, getCountryName } from '../lib/i18n';
import { Plus, Search, Filter, Eye, Calendar, MapPin, User, Clock, ChevronDown, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TextGenerateEffect } from '../components/ui/text-generate-effect';
import { CustomSelect } from '../components/ui/custom-select';
import { AnimatedTabs } from '../components/ui/animated-tabs';
import { MovingBorderButton } from '../components/ui/moving-border';

const STATUS_BADGE: Record<string, string> = {
  'en_attente': 'bg-gray-100 text-gray-700 dark:text-gray-300 border-gray-200',
  'planifiee_auto': 'bg-blue-50 text-blue-700 border-blue-200',
  'confirmee': 'bg-purple-50 text-purple-700 border-purple-200',
  'en_cours': 'bg-amber-50 text-amber-700 border-amber-200',
  'en_retard': 'bg-red-50 text-red-700 border-red-200',
  'reportee': 'bg-orange-50 text-orange-700 border-orange-200',
  'finalisee': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'annulee': 'bg-gray-50 text-gray-500 border-gray-200',
};

const PRIORITY_BADGE: Record<string, string> = {
  'critique': 'bg-red-50 text-red-700 border-red-200',
  'haute': 'bg-orange-50 text-orange-700 border-orange-200',
  'normale': 'bg-blue-50 text-blue-700 border-blue-200',
  'basse': 'bg-gray-50 text-gray-600 dark:text-gray-400 border-gray-200',
};

const PRIORITY_DOT: Record<string, string> = {
  'critique': 'bg-red-500',
  'haute': 'bg-orange-500',
  'normale': 'bg-blue-500',
  'basse': 'bg-gray-400',
};

export default function Interventions() {
  const { user, lang } = useAuth();
  const navigate = useNavigate();
  const [interventions, setInterventions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => { loadData(); }, [filterStatus, filterCountry, filterPriority, filterType, debouncedSearch]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (isSuperAdmin && filterCountry) params.set('country', filterCountry);
      if (filterPriority) params.set('priority', filterPriority);
      if (filterType) params.set('type', filterType);
      if (debouncedSearch) params.set('search', debouncedSearch);
      const data = await api.get(`/interventions?${params.toString()}`);
      setInterventions(data);
    } catch (e) {}
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(search);
    loadData();
  };

  const canCreate = user && ['super_admin', 'admin_pays', 'superviseur'].includes(user.role);

  // Status tabs for quick filter
  const statusTabs = [
    { id: '', label: 'Toutes', count: interventions.length },
    { id: 'en_attente', label: 'En attente' },
    { id: 'planifiee_auto', label: 'Planifiees' },
    { id: 'en_cours', label: 'En cours' },
    { id: 'en_retard', label: 'En retard' },
    { id: 'finalisee', label: 'Terminees' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <TextGenerateEffect
            words={t('nav.interventions')}
            className="text-2xl text-gray-900 dark:text-white"
            duration={0.3}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{interventions.length} interventions</p>
        </div>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={loadData}
            className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-400 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>
          {canCreate && (
            <Link to="/interventions/new">
              <MovingBorderButton containerClassName="h-10" className="px-4 py-2 gap-2 text-sm">
                <Plus className="w-4 h-4" />
                {t('intervention.new')}
              </MovingBorderButton>
            </Link>
          )}
        </div>
      </div>

      {/* Status tabs */}
      <AnimatedTabs
        tabs={statusTabs}
        activeTab={filterStatus}
        onChange={(id) => setFilterStatus(id)}
        className="overflow-x-auto"
      />

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('common.search')}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white dark:focus:bg-gray-800 transition-all"
            />
          </form>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 transition-all"
          >
            <Filter className="w-4 h-4" />
            {t('common.filter')}
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, scaleY: 0, y: -6 }}
              animate={{ opacity: 1, scaleY: 1, y: 0 }}
              exit={{ opacity: 0, scaleY: 0, y: -6 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="origin-top"
            >
              <div className={
                `grid grid-cols-1 ${isSuperAdmin ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800`
              }>
                <CustomSelect
                  value={filterStatus}
                  onChange={setFilterStatus}
                  placeholder="Tous les statuts"
                  options={[
                    { value: '', label: 'Tous les statuts', icon: '📋' },
                    ...['en_attente','planifiee_auto','confirmee','en_cours','en_retard','reportee','finalisee','annulee'].map(s => ({
                      value: s, label: getStatusLabel(s, lang)
                    }))
                  ]}
                />
                {isSuperAdmin && (
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
                  />
                )}
                <CustomSelect
                  value={filterPriority}
                  onChange={setFilterPriority}
                  placeholder="Toutes les priorites"
                  options={[
                    { value: '', label: 'Toutes les priorites', icon: '⚡' },
                    ...['critique','haute','normale','basse'].map(p => ({
                      value: p, label: getPriorityLabel(p, lang)
                    }))
                  ]}
                />
                <CustomSelect
                  value={filterType}
                  onChange={setFilterType}
                  placeholder="Tous les types"
                  options={[
                    { value: '', label: 'Tous les types', icon: '🔧' },
                    ...['installation_fibre','depannage','maintenance','raccordement','soudure','tirage_cable','audit_technique','mise_en_service'].map(tp => ({
                      value: tp, label: getTypeLabel(tp, lang)
                    }))
                  ]}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm"
      >
        {loading ? (
          <div className="p-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-gray-500 dark:text-gray-400 text-sm">{t('common.loading')}</span>
            </div>
          </div>
        ) : interventions.length === 0 ? (
          <div className="p-12 text-center text-gray-400">Aucune intervention trouvee</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">Reference</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">Lieu</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">Technicien</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">Priorite</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">Statut</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">Mode</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {interventions.map((int: any, idx: number) => (
                  <motion.tr
                    key={int.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-blue-50/30 dark:hover:bg-blue-500/10 cursor-pointer transition-colors group"
                    onClick={() => navigate(`/interventions/${int.id}`)}
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono font-semibold text-blue-600 group-hover:text-blue-700">{int.reference}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{getTypeLabel(int.type, lang)}</td>
                    <td className="px-4 py-3">
                      {(() => {
                        const person = `${int.client_first_name || ''} ${int.client_last_name || ''}`.trim();
                        const company = (int.company_name || '').trim();
                        const primary = company || person;

                        if (!primary) {
                          return <span className="text-gray-400 italic text-xs">{t('client.demo_name')}</span>;
                        }

                        return (
                          <>
                            <span className="text-gray-900 dark:text-gray-100 font-medium">{primary}</span>
                            {company && person && (
                              <span className="text-xs text-gray-400 dark:text-gray-500 block">{person}</span>
                            )}
                          </>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{int.city}, {getCountryName(int.country, lang)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {int.tech_first_name ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-[10px] font-bold">
                            {int.tech_first_name[0]}{int.tech_last_name[0]}
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">{int.tech_first_name} {int.tech_last_name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Non assigne</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {int.scheduled_date ? (
                        <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>{int.scheduled_date}</span>
                          {int.scheduled_start_time && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">{int.scheduled_start_time}</span>
                          )}
                        </div>
                      ) : <span className="text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                        <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[int.priority] || 'bg-gray-400'}`} />
                        {getPriorityLabel(int.priority, lang)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${STATUS_BADGE[int.status] || 'bg-gray-100 border-gray-200'}`}>
                        {getStatusLabel(int.status, lang)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium ${
                        int.planning_mode === 'auto' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-600 border border-amber-200'
                      }`}>
                        {int.planning_mode === 'auto' ? 'Auto' : 'Manuel'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Eye className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
