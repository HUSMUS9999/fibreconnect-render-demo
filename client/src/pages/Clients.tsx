import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { api } from '../lib/api';
import { t } from '../lib/i18n';
import { Building2, User, Plus, Search, MapPin, Mail, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { TextGenerateEffect } from '../components/ui/text-generate-effect';
import { AnimatedModal } from '../components/ui/animated-modal';
import { MovingBorderButton } from '../components/ui/moving-border';
import { CustomSelect } from '../components/ui/custom-select';
import { cn } from '../lib/utils';

export default function Clients() {
  const { user, lang } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterCountry, setFilterCountry] = useState(user?.role === 'admin_pays' || user?.role === 'superviseur' ? user.country : '');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    type: 'particulier', company_name: '', first_name: '', last_name: '',
    email: '', phone: '', address: '', city: '', postal_code: '', country: 'FR',
    latitude: '', longitude: '', language: 'fr',
  });

  useEffect(() => {
    if (user?.role === 'admin_pays' || user?.role === 'superviseur') {
      setFilterCountry(user.country);
      setForm(p => ({ ...p, country: user.country }));
    }
  }, [user?.role, user?.country]);

  useEffect(() => { loadData(); }, [filterCountry]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterCountry) params.set('country', filterCountry);
      if (search) params.set('search', search);
      setClients(await api.get(`/dashboard/clients?${params.toString()}`));
    } catch (e) {}
    setLoading(false);
  };

  const createClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/dashboard/clients', {
        ...form,
        country: (user?.role === 'admin_pays' || user?.role === 'superviseur') ? user?.country : form.country,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      });
      setShowCreate(false);
      loadData();
    } catch (e) {}
  };

  const inputClasses = "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white dark:focus:bg-gray-800 transition-all";
  const selectClasses = inputClasses;
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

  const countryOptions = [
    { value: "", label: "Tous", icon: <span className="text-base">🌍</span> },
    { value: "FR", label: "France", icon: <span className="text-base">🇫🇷</span> },
    { value: "DE", label: "Allemagne", icon: <span className="text-base">🇩🇪</span> },
    { value: "BE", label: "Belgique", icon: <span className="text-base">🇧🇪</span> },
    { value: "LU", label: "Luxembourg", icon: <span className="text-base">🇱🇺</span> },
  ];

  const typeOptions = [
    { value: "particulier", label: "Particulier", icon: <User className="w-4 h-4" /> },
    { value: "entreprise", label: "Entreprise", icon: <Building2 className="w-4 h-4" /> },
  ];

  const modalCountryOptions = countryOptions.filter(o => o.value !== ""); // Remove "Tous"

  const languageOptions = [
    { value: "fr", label: "Francais", icon: <span className="text-base">🇫🇷</span> },
    { value: "de", label: "Deutsch", icon: <span className="text-base">🇩🇪</span> },
    { value: "en", label: "English", icon: <span className="text-base">🇬🇧</span> },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <TextGenerateEffect words={t('nav.clients')} className="text-2xl text-gray-900 dark:text-white" duration={0.3} />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{clients.length} clients</p>
        </div>
        <div className="flex gap-2">
          {user?.role === 'super_admin' && (
            <div className="w-40">
              <CustomSelect
                value={filterCountry}
                onChange={setFilterCountry}
                options={countryOptions}
                placeholder="Pays"
              />
            </div>
          )}
          <MovingBorderButton onClick={() => setShowCreate(true)} containerClassName="h-10" className="px-4 py-2 gap-2 text-sm">
            <Plus className="w-4 h-4" />Nouveau client
          </MovingBorderButton>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm"
      >
        <form onSubmit={e => { e.preventDefault(); loadData(); }} className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white dark:focus:bg-gray-800 transition-all"
            placeholder={t('common.search')}
          />
        </form>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm"
        >
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 dark:bg-slate-800/80 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Client</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Localisation</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Langue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {clients.map((c, idx) => (
                <motion.tr
                  key={c.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white">{c.first_name} {c.last_name}</p>
                    {c.company_name && <p className="text-xs text-gray-500 dark:text-gray-400">{c.company_name}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${
                      c.type === 'entreprise' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                    }`}>
                      {c.type === 'entreprise' ? 'Entreprise' : 'Particulier'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {c.email && <p className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-gray-400" />{c.email}</p>}
                    {c.phone && <p className="flex items-center gap-1.5 mt-0.5"><Phone className="w-3 h-3 text-gray-400" />{c.phone}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      {c.city}, {t(`country.${c.country}`)}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs uppercase font-medium text-gray-500 bg-gray-50 dark:bg-gray-800 dark:text-gray-400 px-2 py-1 rounded-lg">{c.language}</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Create modal */}
      <AnimatedModal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nouveau client" size="md">
        <form onSubmit={createClient}>
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>Type</label>
              <CustomSelect
                value={form.type}
                onChange={val => setForm(p => ({ ...p, type: val }))}
                options={typeOptions}
              />
            </div>
            {form.type === 'entreprise' && (
              <div><label className={labelClasses}>Societe</label><input value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))} className={inputClasses} /></div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClasses}>Prenom *</label><input value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} className={inputClasses} required /></div>
              <div><label className={labelClasses}>Nom *</label><input value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} className={inputClasses} required /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClasses}>Email</label><input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputClasses} /></div>
              <div><label className={labelClasses}>Telephone</label><input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={inputClasses} /></div>
            </div>
            <div><label className={labelClasses}>Adresse *</label><input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className={inputClasses} required /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className={labelClasses}>Ville *</label><input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} className={inputClasses} required /></div>
              <div><label className={labelClasses}>Code postal *</label><input value={form.postal_code} onChange={e => setForm(p => ({ ...p, postal_code: e.target.value }))} className={inputClasses} required /></div>
              <div>
                <label className={labelClasses}>Pays *</label>
                {user?.role === 'super_admin' ? (
                  <CustomSelect
                    value={form.country}
                    onChange={val => setForm(p => ({ ...p, country: val }))}
                    options={modalCountryOptions}
                  />
                ) : (
                  <div className={cn(inputClasses, 'flex items-center')}>{user?.country || 'FR'}</div>
                )}
              </div>
            </div>
            <div><label className={labelClasses}>Langue</label>
              <CustomSelect
                value={form.language}
                onChange={val => setForm(p => ({ ...p, language: val }))}
                options={languageOptions}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">{t('common.cancel')}</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">{t('common.create')}</button>
          </div>
        </form>
      </AnimatedModal>
    </div>
  );
}
