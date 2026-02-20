import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { api } from '../lib/api';
import { t, getRoleLabel } from '../lib/i18n';
import { Users as UsersIcon, Plus, Shield, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { TextGenerateEffect } from '../components/ui/text-generate-effect';
import { AnimatedModal } from '../components/ui/animated-modal';
import { MovingBorderButton } from '../components/ui/moving-border';
import { CustomSelect } from '../components/ui/custom-select';

const ROLE_BADGE: Record<string, string> = {
  'super_admin': 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800',
  'admin_pays': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  'superviseur': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
  'technicien': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
};

export default function Users() {
  const { user, lang } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    email: '', password: 'default123', first_name: '', last_name: '',
    phone: '', role: 'technicien', country: 'FR', region: '', city: '',
    certifications: [] as string[], skills: [] as string[],
  });

  useEffect(() => { loadData(); }, [filterRole, filterCountry]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterRole) params.set('role', filterRole);
      if (filterCountry) params.set('country', filterCountry);
      if (search) params.set('search', search);
      setUsers(await api.get(`/auth/users?${params.toString()}`));
    } catch (e) {}
    setLoading(false);
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/auth/users', form);
      setShowCreate(false);
      loadData();
    } catch (e) {}
  };

  const inputClasses = "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white dark:focus:bg-gray-800 transition-all";
  const selectClasses = inputClasses;
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

  const roleOptions = [
    { value: "", label: "Tous les roles" },
    { value: "super_admin", label: "Super Admin" },
    { value: "admin_pays", label: "Admin Pays" },
    { value: "superviseur", label: "Superviseur" },
    { value: "technicien", label: "Technicien" },
  ];

  const countryOptions = [
    { value: "", label: "Tous les pays", icon: <span className="text-base">🌍</span> },
    { value: "FR", label: "France", icon: <span className="text-base">🇫🇷</span> },
    { value: "DE", label: "Allemagne", icon: <span className="text-base">🇩🇪</span> },
    { value: "BE", label: "Belgique", icon: <span className="text-base">🇧🇪</span> },
    { value: "LU", label: "Luxembourg", icon: <span className="text-base">🇱🇺</span> },
  ];

  const modalRoleOptions = roleOptions.filter(o => {
    if (o.value === "") return false;
    if (o.value === 'super_admin' && user?.role !== 'super_admin') return false;
    return true;
  });
  const modalCountryOptions = countryOptions.filter(o => o.value !== "");

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <TextGenerateEffect words={t('nav.users')} className="text-2xl text-gray-900 dark:text-white" duration={0.3} />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{users.length} utilisateurs</p>
        </div>
        <MovingBorderButton onClick={() => setShowCreate(true)} containerClassName="h-10" className="px-4 py-2 gap-2 text-sm">
          <Plus className="w-4 h-4" />Nouvel utilisateur
        </MovingBorderButton>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={e => { e.preventDefault(); loadData(); }} className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white dark:focus:bg-gray-800 transition-all" placeholder={t('common.search')} />
          </form>
          <div className="w-48">
            <CustomSelect
              value={filterRole}
              onChange={setFilterRole}
              options={roleOptions}
              placeholder="Roles"
            />
          </div>
          {user?.role === 'super_admin' && (
            <div className="w-48">
              <CustomSelect
                value={filterCountry}
                onChange={setFilterCountry}
                options={countryOptions}
                placeholder="Pays"
              />
            </div>
          )}
        </div>
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
            <thead className="bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Utilisateur</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Pays</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Region/Ville</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {users.map((u, idx) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        {u.first_name[0]}{u.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{u.first_name} {u.last_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${ROLE_BADGE[u.role]}`}>
                      <Shield className="w-3 h-3" />
                      {getRoleLabel(u.role, lang)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-lg">
                    {u.country === 'FR' ? '\u{1F1EB}\u{1F1F7}' : u.country === 'DE' ? '\u{1F1E9}\u{1F1EA}' : u.country === 'BE' ? '\u{1F1E7}\u{1F1EA}' : '\u{1F1F1}\u{1F1FA}'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{u.region || '-'} / {u.city || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${
                      u.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {u.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      <AnimatedModal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nouvel utilisateur" size="md">
        <form onSubmit={createUser}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClasses}>Prenom *</label><input value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} className={inputClasses} required /></div>
              <div><label className={labelClasses}>Nom *</label><input value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} className={inputClasses} required /></div>
            </div>
            <div><label className={labelClasses}>Email *</label><input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className={inputClasses} required /></div>
            <div><label className={labelClasses}>Mot de passe</label><input value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className={inputClasses} /></div>
            <div><label className={labelClasses}>Telephone</label><input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={inputClasses} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClasses}>Role *</label>
                <CustomSelect
                  value={form.role}
                  onChange={val => setForm(p => ({ ...p, role: val }))}
                  options={modalRoleOptions}
                />
              </div>
              <div><label className={labelClasses}>Pays *</label>
                <CustomSelect
                  value={form.country}
                  onChange={val => setForm(p => ({ ...p, country: val }))}
                  options={modalCountryOptions}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={labelClasses}>Region</label><input value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))} className={inputClasses} /></div>
              <div><label className={labelClasses}>Ville</label><input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} className={inputClasses} /></div>
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
