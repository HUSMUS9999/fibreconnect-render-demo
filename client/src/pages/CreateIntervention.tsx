import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { api } from '../lib/api';
import { t, getTypeLabel, getPriorityLabel } from '../lib/i18n';
import { ArrowLeft, Zap, CheckCircle2, AlertCircle, ExternalLink, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { MovingBorderButton } from '../components/ui/moving-border';
import { CustomSelect } from '../components/ui/custom-select';
import { CustomDateInput } from '../components/ui/custom-date-input';
import { TextGenerateEffect } from '../components/ui/text-generate-effect';
import { AnimatedProgress } from '../components/ui/animated-helpers';

export default function CreateIntervention() {
  const { user, lang } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    type: 'installation_fibre',
    description: '',
    client_id: '',
    address: '',
    city: '',
    postal_code: '',
    country: user?.country || 'FR',
    latitude: '',
    longitude: '',
    priority: 'normale',
    sla_hours: '48',
    deadline: '',
  });

  useEffect(() => {
    api.get('/dashboard/clients').then(setClients).catch(() => {});
  }, []);

  const handleClientSelect = (clientId: string) => {
    const client = clients.find(c => String(c.id) === clientId);
    if (client) {
      setForm(prev => ({
        ...prev,
        client_id: clientId,
        address: client.address,
        city: client.city,
        postal_code: client.postal_code,
        country: client.country,
        latitude: client.latitude?.toString() || '',
        longitude: client.longitude?.toString() || '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await api.post('/interventions', {
        ...form,
        sla_hours: parseInt(form.sla_hours),
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        deadline: form.deadline || undefined,
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const inputClasses = "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white dark:focus:bg-gray-800 transition-all";
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

  if (result) {
    return (
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Intervention creee avec succes</h2>
          <p className="text-gray-500 mb-6">
            Reference : <span className="font-mono font-bold text-blue-600">{result.intervention?.reference}</span>
          </p>

          {result.planning?.success ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6 text-left"
            >
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-emerald-800">Planification automatique reussie</h3>
              </div>
              <div className="space-y-2 text-sm text-emerald-700">
                <p>Technicien : <strong>{result.planning.technician_name}</strong></p>
                <p>Date : <strong>{result.planning.scheduled_date}</strong></p>
                <p>Horaire : <strong>{result.planning.scheduled_start_time} - {result.planning.scheduled_end_time}</strong></p>
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span>Score de planification</span>
                    <strong>{result.planning.planning_score?.toFixed(1)}/100</strong>
                  </div>
                  <AnimatedProgress
                    value={result.planning.planning_score || 0}
                    barClassName="from-emerald-400 to-emerald-600"
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 text-left"
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-amber-800">Planification automatique impossible</h3>
              </div>
              <p className="text-sm text-amber-700">{result.planning?.reason}</p>
              <p className="text-sm text-amber-600 mt-1">Attribution manuelle requise.</p>
            </motion.div>
          )}

          {result.client_link && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-blue-50/50 border border-blue-200 rounded-2xl p-5 mb-6 text-left"
            >
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Lien client securise
              </h3>
              <div className="flex items-center gap-2">
                <p className="text-xs text-blue-600 break-all font-mono flex-1">
                  {window.location.origin}{result.client_link}
                </p>
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}${result.client_link}`)}
                  className="p-2 rounded-lg text-blue-500 hover:bg-blue-100 transition-colors flex-shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          <div className="flex justify-center gap-3">
            <button onClick={() => navigate('/interventions')} className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Voir toutes les interventions
            </button>
            <button onClick={() => { setResult(null); setForm(prev => ({ ...prev, description: '', client_id: '' })); }} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
              Creer une autre intervention
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <TextGenerateEffect words={t('intervention.new')} className="text-2xl text-gray-900 dark:text-white" duration={0.3} />
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Type & Priority */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Type et priorite</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>{t('intervention.type')} *</label>
              <CustomSelect
                value={form.type}
                onChange={val => setForm(p => ({ ...p, type: val }))}
                options={['installation_fibre','depannage','maintenance','raccordement','soudure','tirage_cable','audit_technique','mise_en_service'].map(tp => ({
                  value: tp, label: getTypeLabel(tp, lang)
                }))}
              />
            </div>
            <div>
              <label className={labelClasses}>{t('intervention.priority')} *</label>
              <CustomSelect
                value={form.priority}
                onChange={val => setForm(p => ({ ...p, priority: val }))}
                options={['critique','haute','normale','basse'].map(p => ({
                  value: p, label: getPriorityLabel(p, lang)
                }))}
              />
            </div>
          </div>
          <div className="mt-4">
            <label className={labelClasses}>{t('intervention.description')}</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className={inputClasses}
              rows={3}
              placeholder="Description detaillee de l'intervention..."
            />
          </div>
        </motion.div>

        {/* Client */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('intervention.client')}</h3>
          <div>
            <label className={labelClasses}>Selectionner un client existant</label>
            <CustomSelect
              value={form.client_id}
              onChange={handleClientSelect}
              placeholder="-- Selectionner --"
              options={clients.map(c => ({
                value: String(c.id),
                label: `${c.company_name ? `${c.company_name} - ` : ''}${c.first_name} ${c.last_name} (${c.city}, ${c.country})`
              }))}
            />
          </div>
        </motion.div>

        {/* Address */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Localisation</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClasses}>{t('intervention.address')} *</label>
              <input
                type="text"
                value={form.address}
                onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                className={inputClasses}
                required
                placeholder="15 Rue de Rivoli"
              />
            </div>
            <div>
              <label className={labelClasses}>{t('intervention.city')} *</label>
              <input type="text" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} className={inputClasses} required />
            </div>
            <div>
              <label className={labelClasses}>Code postal *</label>
              <input type="text" value={form.postal_code} onChange={e => setForm(p => ({ ...p, postal_code: e.target.value }))} className={inputClasses} required />
            </div>
            <div>
              <label className={labelClasses}>{t('intervention.country')} *</label>
              <CustomSelect
                value={form.country}
                onChange={val => setForm(p => ({ ...p, country: val }))}
                options={[
                  { value: 'FR', label: 'France', icon: '🇫🇷' },
                  { value: 'DE', label: 'Allemagne', icon: '🇩🇪' },
                  { value: 'BE', label: 'Belgique', icon: '🇧🇪' },
                  { value: 'LU', label: 'Luxembourg', icon: '🇱🇺' },
                ]}
              />
            </div>
            <div>
              <label className={labelClasses}>Latitude</label>
              <input type="number" step="any" value={form.latitude} onChange={e => setForm(p => ({ ...p, latitude: e.target.value }))} className={inputClasses} placeholder="48.8566" />
            </div>
            <div>
              <label className={labelClasses}>Longitude</label>
              <input type="number" step="any" value={form.longitude} onChange={e => setForm(p => ({ ...p, longitude: e.target.value }))} className={inputClasses} placeholder="2.3522" />
            </div>
          </div>
        </motion.div>

        {/* SLA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm"
        >
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">SLA & Delai</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>{t('intervention.sla')}</label>
              <input type="number" value={form.sla_hours} onChange={e => setForm(p => ({ ...p, sla_hours: e.target.value }))} className={inputClasses} min="1" />
            </div>
            <div>
              <label className={labelClasses}>{t('intervention.deadline')}</label>
              <CustomDateInput
                value={form.deadline}
                onChange={(val) => setForm(p => ({ ...p, deadline: val }))}
                time
                required
              />
            </div>
          </div>
        </motion.div>

        {/* Submit */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-end gap-3"
        >
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            {t('common.cancel')}
          </button>
          <MovingBorderButton type="submit" disabled={loading} className="gap-2 px-6">
            <Zap className="w-4 h-4" />
            {loading ? t('common.loading') : 'Creer & Planifier automatiquement'}
          </MovingBorderButton>
        </motion.div>
      </form>
    </div>
  );
}
