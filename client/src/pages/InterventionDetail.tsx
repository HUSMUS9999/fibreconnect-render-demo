import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { api } from '../lib/api';
import { t, getStatusLabel, getTypeLabel, getPriorityLabel, getActionLabel, getDelayCategoryLabel } from '../lib/i18n';
import { 
  ArrowLeft, MapPin, Calendar, Clock, User, Zap, AlertTriangle,
  CheckCircle2, XCircle, RefreshCw, Play, Square, FileText, Link2, History,
  Star, Copy, ExternalLink, Edit
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedModal } from '../components/ui/animated-modal';
import { CustomDateInput } from '../components/ui/custom-date-input';
import { CustomSelect } from '../components/ui/custom-select';
import { Timeline } from '../components/ui/timeline';
import { AnimatedProgress } from '../components/ui/animated-helpers';
import { MovingBorderButton } from '../components/ui/moving-border';

const STATUS_BADGE: Record<string, string> = {
  'en_attente': 'bg-gray-100 text-gray-700 border-gray-200',
  'planifiee_auto': 'bg-blue-50 text-blue-700 border-blue-200',
  'confirmee': 'bg-purple-50 text-purple-700 border-purple-200',
  'en_cours': 'bg-amber-50 text-amber-700 border-amber-200',
  'en_retard': 'bg-red-50 text-red-700 border-red-200',
  'reportee': 'bg-orange-50 text-orange-700 border-orange-200',
  'finalisee': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'annulee': 'bg-gray-50 text-gray-500 border-gray-200',
};

const STATUS_TIMELINE_COLORS: Record<string, string> = {
  'creation': 'bg-blue-500',
  'planification': 'bg-blue-500',
  'confirmation': 'bg-purple-500',
  'en_cours': 'bg-amber-500',
  'retard': 'bg-red-500',
  'finalisation': 'bg-emerald-500',
  'annulation': 'bg-gray-500',
};

export default function InterventionDetail() {
  const { id } = useParams();
  const { user, lang } = useAuth();
  const navigate = useNavigate();
  const [intervention, setIntervention] = useState<any>(null);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManualAssign, setShowManualAssign] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [showDelay, setShowDelay] = useState(false);
  const [manualForm, setManualForm] = useState({ technician_id: '', date: '', start_time: '09:00', end_time: '11:00', reason: '' });
  const [editForm, setEditForm] = useState({
    description: '', priority: 'normale', sla_hours: 48, deadline: '',
    address: '', city: '', postal_code: '', country: 'FR', latitude: '', longitude: ''
  });
  const [completeForm, setCompleteForm] = useState({ report: '' });
  const [delayForm, setDelayForm] = useState({ delay_reason: '', delay_category: 'autre' });

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [int, techs] = await Promise.all([
        api.get(`/interventions/${id}`),
        api.get('/auth/technicians'),
      ]);
      setIntervention(int);
      setTechnicians(techs);
      setEditForm({
        description: int.description || '',
        priority: int.priority || 'normale',
        sla_hours: int.sla_hours || 48,
        deadline: int.deadline ? int.deadline.split('T')[0] : '',
        address: int.address || '',
        city: int.city || '',
        postal_code: int.postal_code || '',
        country: int.country || 'FR',
        latitude: int.latitude || '',
        longitude: int.longitude || ''
      });
    } catch (e) {}
    setLoading(false);
  };

  const replan = async () => {
    try {
      await api.post(`/interventions/${id}/replan`, {});
      await loadData();
    } catch (e) {}
  };

  const cancel = async () => {
    if (!confirm('Confirmer l\'annulation ?')) return;
    try {
      await api.post(`/interventions/${id}/cancel`, { reason: 'Annulation manuelle' });
      await loadData();
    } catch (e) {}
  };

  const updateIntervention = async () => {
    try {
      await api.put(`/interventions/${id}`, editForm);
      setShowEdit(false);
      await loadData();
    } catch (e) {}
  };

  const startIntervention = async () => {
    try {
      await api.post(`/interventions/${id}/start`, {});
      await loadData();
    } catch (e) {}
  };

  const completeIntervention = async () => {
    try {
      await api.post(`/interventions/${id}/complete`, completeForm);
      setShowComplete(false);
      await loadData();
    } catch (e) {}
  };

  const manualAssign = async () => {
    try {
      await api.post(`/interventions/${id}/manual-assign`, manualForm);
      setShowManualAssign(false);
      await loadData();
    } catch (e) {}
  };

  const justifyDelay = async () => {
    try {
      await api.post(`/interventions/${id}/justify-delay`, delayForm);
      setShowDelay(false);
      await loadData();
    } catch (e) {}
  };

  if (loading || !intervention) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500 dark:text-gray-400 text-sm">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  const isAdmin = user && ['super_admin', 'admin_pays', 'superviseur'].includes(user.role);
  const isTech = user && user.role === 'technicien' && user.id === intervention.technician_id;

  // Build timeline items from history
  const timelineItems = (intervention.history || []).map((h: any) => ({
    title: getActionLabel(h.action, lang),
    description: h.notes || undefined,
    time: new Date(h.created_at).toLocaleString(),
    color: h.is_manual_override ? 'bg-amber-500' : 'bg-blue-500',
    content: h.is_manual_override ? (
      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">(Override manuel)</span>
    ) : undefined,
  }));

  const inputClasses = "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 focus:bg-white dark:focus:bg-gray-800 transition-all";
  const labelClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start gap-4"
      >
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold font-mono text-blue-600">{intervention.reference}</h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium border ${STATUS_BADGE[intervention.status]}`}>
                {getStatusLabel(intervention.status, lang)}
              </span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${
                intervention.planning_mode === 'auto' 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                  : 'bg-amber-50 text-amber-600 border-amber-200'
              }`}>
                {intervention.planning_mode === 'auto' ? 'Planification Auto' : 'Manuel'}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{getTypeLabel(intervention.type, lang)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {isTech && intervention.status === 'confirmee' && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={startIntervention}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Play className="w-4 h-4" />Demarrer
            </motion.button>
          )}
          {isTech && intervention.status === 'en_cours' && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setShowComplete(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Square className="w-4 h-4" />Terminer
            </motion.button>
          )}
          {isAdmin && !['finalisee', 'annulee'].includes(intervention.status) && (
            <>
              {['en_attente', 'planifiee_auto'].includes(intervention.status) && (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setShowEdit(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                >
                  <Edit className="w-4 h-4" />Modifier
                </motion.button>
              )}
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={replan}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />Replanifier (Auto)
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setShowManualAssign(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              >
                <User className="w-4 h-4" />Attribution manuelle
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={cancel}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
              >
                <XCircle className="w-4 h-4" />{t('common.cancel')}
              </motion.button>
            </>
          )}
          {intervention.status === 'en_retard' && isAdmin && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setShowDelay(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors shadow-sm"
            >
              <AlertTriangle className="w-4 h-4" />Justifier retard
            </motion.button>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Details de l'intervention</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">Type</span>
                <p className="font-medium text-gray-900 dark:text-white mt-1">{getTypeLabel(intervention.type, lang)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">Priorite</span>
                <p className="font-medium text-gray-900 dark:text-white mt-1">{getPriorityLabel(intervention.priority, lang)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">SLA</span>
                <p className="font-medium text-gray-900 dark:text-white mt-1">{intervention.sla_hours}h</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">Date limite</span>
                <p className="font-medium text-gray-900 dark:text-white mt-1">{intervention.deadline ? new Date(intervention.deadline).toLocaleString() : '-'}</p>
              </div>
              <div className="col-span-2 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                <span className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">Description</span>
                <p className="font-medium text-gray-900 dark:text-white mt-1">{intervention.description || '-'}</p>
              </div>
            </div>
          </motion.div>

          {/* Location */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500" />Localisation
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 text-xs">Adresse</span>
                <p className="font-medium mt-0.5">{intervention.address}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Ville</span>
                <p className="font-medium mt-0.5">{intervention.city}, {intervention.postal_code}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">Pays</span>
                <p className="font-medium mt-0.5">
                  {t(`country.${intervention.country}`)}
                </p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">GPS</span>
                <p className="font-medium mt-0.5">{intervention.latitude}, {intervention.longitude}</p>
              </div>
            </div>
          </motion.div>

          {/* Client Link */}
          {intervention.client_token && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-blue-500" />Lien client securise
              </h3>
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-center justify-between gap-3">
                <p className="text-xs text-blue-700 font-mono break-all flex-1">
                  {window.location.origin}/intervention/suivi/{intervention.client_token}
                </p>
                <button
                  onClick={() => navigator.clipboard.writeText(`${window.location.origin}/intervention/suivi/${intervention.client_token}`)}
                  className="p-2 rounded-lg text-blue-500 hover:bg-blue-100 transition-colors flex-shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Report */}
          {intervention.report && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />Rapport d'intervention
              </h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 dark:bg-gray-800 rounded-xl p-4">{intervention.report}</p>
              {intervention.client_rating && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-gray-500">Note client :</span>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= intervention.client_rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* History with Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-500" />{t('intervention.history')}
            </h3>
            {timelineItems.length > 0 ? (
              <Timeline items={timelineItems} />
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">Aucun historique</p>
            )}
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Client</h3>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-gray-900">{intervention.client_first_name} {intervention.client_last_name}</p>
              {intervention.company_name && <p className="text-gray-500">{intervention.company_name}</p>}
              {intervention.client_email && <p className="text-gray-500">{intervention.client_email}</p>}
              {intervention.client_phone && <p className="text-gray-500">{intervention.client_phone}</p>}
            </div>
          </motion.div>

          {/* Technician */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" />Technicien assigne
            </h3>
            {intervention.tech_first_name ? (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-500/20">
                    {intervention.tech_first_name[0]}{intervention.tech_last_name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{intervention.tech_first_name} {intervention.tech_last_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{intervention.tech_email}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Aucun technicien assigne</p>
            )}
          </motion.div>

          {/* Schedule */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm"
          >
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />Planification
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center py-1.5">
                <span className="text-gray-500">Date</span>
                <span className="font-medium text-gray-900">{intervention.scheduled_date || '-'}</span>
              </div>
              <div className="h-px bg-gray-100 dark:bg-gray-800" />
              <div className="flex justify-between items-center py-1.5">
                <span className="text-gray-500">Horaire</span>
                <span className="font-medium text-gray-900">
                  {intervention.scheduled_start_time && intervention.scheduled_end_time
                    ? `${intervention.scheduled_start_time} - ${intervention.scheduled_end_time}`
                    : '-'}
                </span>
              </div>
              <div className="h-px bg-gray-100 dark:bg-gray-800" />
              <div className="flex justify-between items-center py-1.5">
                <span className="text-gray-500">Mode</span>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${
                  intervention.planning_mode === 'auto'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : 'bg-amber-50 text-amber-600 border-amber-200'
                }`}>
                  {intervention.planning_mode === 'auto' ? 'Automatique' : 'Manuel'}
                </span>
              </div>
              {intervention.planning_score && (
                <>
                  <div className="h-px bg-gray-100 dark:bg-gray-800" />
                  <div className="py-1.5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-500">Score</span>
                      <span className="font-bold text-blue-600">{Number(intervention.planning_score).toFixed(1)}/100</span>
                    </div>
                    <AnimatedProgress value={Number(intervention.planning_score)} />
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Delay info */}
          {intervention.delay_reason && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-red-50 rounded-2xl border border-red-200 p-5"
            >
              <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />Retard
              </h3>
              <p className="text-sm text-red-700">{intervention.delay_reason}</p>
              {intervention.delay_category && (
                <span className="mt-2 inline-block text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded-lg border border-red-200">
                  {getDelayCategoryLabel(intervention.delay_category, lang)}
                </span>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Manual Assign Modal */}
      <AnimatedModal isOpen={showManualAssign} onClose={() => setShowManualAssign(false)} title="Attribution manuelle (secours)" size="md">
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-700 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>L'attribution manuelle ne doit etre utilisee qu'en cas de dysfonctionnement ou d'exception. Cette action sera tracee dans l'historique.</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className={labelClasses}>Technicien *</label>
            <CustomSelect
              value={manualForm.technician_id}
              onChange={val => setManualForm(p => ({ ...p, technician_id: val }))}
              placeholder="-- Selectionner --"
              options={technicians.filter(t => t.country === intervention.country).map(t => ({
                value: String(t.id), label: `${t.first_name} ${t.last_name} - ${t.city}`
              }))}
            />
          </div>
          <div>
            <label className={labelClasses}>Date *</label>
            <CustomDateInput
              value={manualForm.date}
              onChange={(val) => setManualForm(p => ({ ...p, date: val }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClasses}>Debut *</label>
              <input type="time" value={manualForm.start_time} onChange={e => setManualForm(p => ({ ...p, start_time: e.target.value }))} className={inputClasses} required />
            </div>
            <div>
              <label className={labelClasses}>Fin *</label>
              <input type="time" value={manualForm.end_time} onChange={e => setManualForm(p => ({ ...p, end_time: e.target.value }))} className={inputClasses} required />
            </div>
          </div>
          <div>
            <label className={labelClasses}>Raison de l'attribution manuelle *</label>
            <textarea value={manualForm.reason} onChange={e => setManualForm(p => ({ ...p, reason: e.target.value }))} className={inputClasses} rows={3} required placeholder="Raison obligatoire..." />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowManualAssign(false)} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">{t('common.cancel')}</button>
          <button onClick={manualAssign} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">Assigner manuellement</button>
        </div>
      </AnimatedModal>

      {/* Edit Intervention Modal */}
      <AnimatedModal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Modifier l'intervention" size="lg">
        <form onSubmit={(e) => { e.preventDefault(); updateIntervention(); }}>
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>Description</label>
              <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} className={inputClasses} rows={3} />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClasses}>Priorite</label>
                <CustomSelect
                  value={editForm.priority}
                  onChange={val => setEditForm(p => ({ ...p, priority: val }))}
                  options={[
                    { value: 'basse', label: 'Basse' },
                    { value: 'normale', label: 'Normale' },
                    { value: 'haute', label: 'Haute' },
                    { value: 'critique', label: 'Critique' },
                  ]}
                />
              </div>
              <div>
                <label className={labelClasses}>SLA (heures)</label>
                <input type="number" value={editForm.sla_hours} onChange={e => setEditForm(p => ({ ...p, sla_hours: Number(e.target.value) }))} className={inputClasses} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClasses}>Date limite</label>
                <CustomDateInput
                  value={editForm.deadline}
                  onChange={(val) => setEditForm(p => ({ ...p, deadline: val }))}
                  required
                />
              </div>
              <div>
                <label className={labelClasses}>Pays</label>
                <CustomSelect
                  value={editForm.country}
                  onChange={val => setEditForm(p => ({ ...p, country: val }))}
                  options={[
                    { value: 'FR', label: 'France', icon: '🇫🇷' },
                    { value: 'DE', label: 'Allemagne', icon: '🇩🇪' },
                    { value: 'BE', label: 'Belgique', icon: '🇧🇪' },
                    { value: 'LU', label: 'Luxembourg', icon: '🇱🇺' },
                  ]}
                />
              </div>
            </div>

            <div>
              <label className={labelClasses}>Adresse</label>
              <input value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} className={inputClasses} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClasses}>Ville</label>
                <input value={editForm.city} onChange={e => setEditForm(p => ({ ...p, city: e.target.value }))} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Code postal</label>
                <input value={editForm.postal_code} onChange={e => setEditForm(p => ({ ...p, postal_code: e.target.value }))} className={inputClasses} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClasses}>Latitude</label>
                <input type="number" step="any" value={editForm.latitude} onChange={e => setEditForm(p => ({ ...p, latitude: e.target.value }))} className={inputClasses} />
              </div>
              <div>
                <label className={labelClasses}>Longitude</label>
                <input type="number" step="any" value={editForm.longitude} onChange={e => setEditForm(p => ({ ...p, longitude: e.target.value }))} className={inputClasses} />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button type="button" onClick={() => setShowEdit(false)} className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">{t('common.cancel')}</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">{t('common.save')}</button>
          </div>
        </form>
      </AnimatedModal>

      {/* Complete Modal */}
      <AnimatedModal isOpen={showComplete} onClose={() => setShowComplete(false)} title="Finaliser l'intervention" size="md">
        <div className="space-y-4">
          <div>
            <label className={labelClasses}>Rapport d'intervention</label>
            <textarea value={completeForm.report} onChange={e => setCompleteForm(p => ({ ...p, report: e.target.value }))} className={inputClasses} rows={5} placeholder="Details de l'intervention realisee..." />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowComplete(false)} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">{t('common.cancel')}</button>
          <button onClick={completeIntervention} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm">Finaliser</button>
        </div>
      </AnimatedModal>

      {/* Delay Justification Modal */}
      <AnimatedModal isOpen={showDelay} onClose={() => setShowDelay(false)} title="Justification du retard" size="md">
        <div className="space-y-4">
          <div>
            <label className={labelClasses}>Categorie *</label>
            <CustomSelect
              value={delayForm.delay_category}
              onChange={val => setDelayForm(p => ({ ...p, delay_category: val }))}
              options={[
                { value: 'trafic', label: 'Trafic' },
                { value: 'client_absent', label: 'Client absent' },
                { value: 'probleme_technique', label: 'Probleme technique' },
                { value: 'meteo', label: 'Meteo' },
                { value: 'materiel', label: 'Materiel' },
                { value: 'autre', label: 'Autre' },
              ]}
            />
          </div>
          <div>
            <label className={labelClasses}>Justification detaillee *</label>
            <textarea value={delayForm.delay_reason} onChange={e => setDelayForm(p => ({ ...p, delay_reason: e.target.value }))} className={inputClasses} rows={4} required placeholder="Explication obligatoire..." />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={() => setShowDelay(false)} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">{t('common.cancel')}</button>
          <button onClick={justifyDelay} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors shadow-sm">Enregistrer la justification</button>
        </div>
      </AnimatedModal>
    </div>
  );
}
