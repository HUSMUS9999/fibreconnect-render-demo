import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { clientApi } from '../lib/api';
import { t, setLanguage, getLanguage, Lang, getStatusLabel, getTypeLabel } from '../lib/i18n';
import { useTheme } from '../lib/theme';
import { cn } from '../lib/utils';
import { 
  CheckCircle2, Clock, Calendar, MapPin, User, Phone, Star,
  RefreshCw, XCircle, MessageSquare, Navigation, Globe, Wifi,
  Truck, AlertCircle, Sparkles, ArrowRight, Shield, ChevronRight,
  ExternalLink, Sun, Moon
} from 'lucide-react';
import { MovingBorderButton } from '../components/ui/moving-border';
import { AnimatedModal } from '../components/ui/animated-modal';
import { Shimmer, PageTransition, StaggerContainer, StaggerItem, AnimatedBadge } from '../components/ui/animated-helpers';
import { SparklesCore } from '../components/ui/background-effects';

const STATUS_STEP: Record<string, number> = {
  'en_attente': 0,
  'planifiee_auto': 1,
  'confirmee': 2,
  'en_cours': 3,
  'finalisee': 4,
  'annulee': -1,
  'en_retard': 3,
  'reportee': 1,
};

/* ------------------------------------------------------------------ */
/*  Tilt Card — subtle 3D perspective on hover (mouse-tracking)       */
/* ------------------------------------------------------------------ */
const TiltCard = ({
  children, className, glowColor = 'rgba(99,102,241,0.08)', ...props
}: {
  children: React.ReactNode; className?: string; glowColor?: string; [k: string]: any;
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [3, -3]), { damping: 20, stiffness: 200 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-3, 3]), { damping: 20, stiffness: 200 });

  const handleMouse = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }, [x, y]);
  const resetMouse = useCallback(() => { x.set(0); y.set(0); }, [x, y]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={handleMouse}
      onMouseLeave={resetMouse}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className={cn(
        "relative overflow-hidden",
        "bg-white/80 dark:bg-slate-900/55 backdrop-blur-xl rounded-2xl p-6",
        "border border-gray-200/60 dark:border-white/10",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        "hover:shadow-[0_8px_30px_rgba(0,0,0,0.06),0_0_0_1px_rgba(99,102,241,0.08)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.35),0_0_0_1px_rgba(99,102,241,0.12)]",
        "hover:border-indigo-200/60 dark:hover:border-indigo-400/30",
        "transition-[box-shadow,border-color] duration-500 ease-out",
        "group/card",
        className
      )}
      {...props}
    >
      {/* Shine sweep overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover/card:opacity-100"
        style={{ transition: 'opacity 0.3s' }}
      >
        <div className="absolute inset-0 animate-shine bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent" style={{ animationPlayState: 'paused' }} />
      </div>
      {/* Left accent glow on hover */}
      <div
        className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full bg-gradient-to-b from-blue-500 via-indigo-500 to-purple-500 opacity-0 group-hover/card:opacity-100 transition-opacity duration-500 scale-y-0 group-hover/card:scale-y-100 origin-center"
        style={{ transition: 'opacity 0.5s, transform 0.5s cubic-bezier(0.22,1,0.36,1)' }}
      />
      {children}
    </motion.div>
  );
};

/* ------------------------------------------------------------------ */
/*  Detail Row — hover left-accent bar + subtle bg highlight          */
/* ------------------------------------------------------------------ */
const DetailRow = ({
  label, value, icon: Icon, isLast = false, accentColor = 'blue',
}: {
  label: React.ReactNode; value: React.ReactNode; icon?: any; isLast?: boolean; accentColor?: string;
}) => (
  <motion.div
    whileHover={{ x: 4 }}
    transition={{ type: 'spring', damping: 25, stiffness: 400 }}
    className={cn(
      "relative flex justify-between items-center py-3 px-2 -mx-2 rounded-xl",
      "group/row cursor-default",
      "hover:bg-gradient-to-r hover:from-gray-50/80 hover:to-transparent dark:hover:from-white/5",
      "transition-colors duration-300",
      !isLast && "border-b border-gray-100/50 dark:border-white/10"
    )}
  >
    {/* Hover accent bar */}
    <div className={cn(
      "absolute left-0 top-2 bottom-2 w-[2px] rounded-full opacity-0 group-hover/row:opacity-100 transition-all duration-300 scale-y-0 group-hover/row:scale-y-100 origin-center",
      accentColor === 'blue' && "bg-blue-500",
      accentColor === 'indigo' && "bg-indigo-500",
      accentColor === 'emerald' && "bg-emerald-500",
    )} />
    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5 text-sm group-hover/row:text-gray-600 dark:group-hover/row:text-gray-200 transition-colors">
      {Icon && <Icon className="w-3.5 h-3.5 group-hover/row:text-blue-500 transition-colors duration-300" />}
      {label}
    </span>
    <span className="font-medium text-right text-gray-700 dark:text-gray-100 text-sm">{value}</span>
  </motion.div>
);

/* ------------------------------------------------------------------ */
/*  Action Button — with icon animation on hover                      */
/* ------------------------------------------------------------------ */
const ActionButton = ({
  onClick, disabled, icon: Icon, label, variant = 'default', iconAnimation = 'none',
}: {
  onClick: () => void; disabled?: boolean; icon: any; label: string;
  variant?: 'default' | 'danger'; iconAnimation?: 'none' | 'spin' | 'bounce' | 'shake';
}) => {
  const iconAnim = {
    none: {},
    spin: { rotate: 360 },
    bounce: { y: [0, -3, 0] },
    shake: { x: [0, -2, 2, -2, 0] },
  };
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative group/btn flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl font-medium text-sm transition-all duration-300 overflow-hidden",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
        variant === 'default' && [
          "bg-white hover:bg-gray-50/80 border border-gray-200 text-gray-700",
          "dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/10 dark:text-gray-100",
          "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
          "hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.25)]",
          "hover:border-gray-300 dark:hover:border-white/20",
        ],
        variant === 'danger' && [
          "bg-gradient-to-r from-red-50 to-red-50/50 border border-red-200/80 text-red-600",
          "hover:from-red-100 hover:to-red-50",
          "hover:border-red-300",
          "hover:shadow-[0_4px_12px_rgba(239,68,68,0.1)]",
          "dark:from-red-500/10 dark:to-red-500/5 dark:border-red-500/20 dark:text-red-200",
          "dark:hover:from-red-500/15 dark:hover:to-red-500/10",
        ],
      )}
    >
      {/* Shine sweep on hover */}
      <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

      <motion.span
        className="relative z-10"
        whileHover={iconAnimation !== 'none' ? iconAnim[iconAnimation] : undefined}
        transition={iconAnimation === 'spin' ? { duration: 0.6, ease: 'easeInOut' } : { duration: 0.3 }}
      >
        <Icon className="w-4 h-4" />
      </motion.span>
      <span className="relative z-10">{label}</span>

      {/* Arrow hint on hover */}
      <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover/btn:opacity-50 group-hover/btn:translate-x-0 transition-all duration-300 relative z-10" />
    </motion.button>
  );
};

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */
export default function ClientPortal() {
  const { token } = useParams<{ token: string }>();
  const { theme, toggleTheme } = useTheme();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Lang>(getLanguage());
  const [showReschedule, setShowReschedule] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [slots, setSlots] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  useEffect(() => { loadData(); }, [token]);

  // Auto-dismiss success message
  useEffect(() => {
    if (actionMsg) {
      const timer = setTimeout(() => setActionMsg(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [actionMsg]);

  const loadData = async () => {
    setLoading(true);
    try {
      const d = await clientApi.get(`/client/suivi/${token}`);
      setData(d);
      if (d.language) { setLanguage(d.language as Lang); setLang(d.language as Lang); }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const changeLang = (l: Lang) => { setLanguage(l); setLang(l); };

  const confirmDate = async () => {
    setActionLoading(true);
    try {
      await clientApi.post(`/client/suivi/${token}/confirm`, {});
      setActionMsg(t('common.success', lang));
      await loadData();
    } catch (e) {}
    setActionLoading(false);
  };

  const loadSlots = async () => {
    try {
      const s = await clientApi.get(`/client/suivi/${token}/available-slots`);
      setSlots(s);
      setShowReschedule(true);
    } catch (e) {}
  };

  const reschedule = async () => {
    if (!selectedSlot) return;
    setActionLoading(true);
    const [date, time] = selectedSlot.split('|');
    try {
      await clientApi.post(`/client/suivi/${token}/reschedule`, { preferred_date: date, preferred_time: time, comment });
      setShowReschedule(false);
      setActionMsg(t('common.success', lang));
      await loadData();
    } catch (e) {}
    setActionLoading(false);
  };

  const cancelIntervention = async () => {
    if (!confirm(lang === 'fr' ? 'Confirmer l\'annulation ?' : lang === 'de' ? 'Stornierung bestätigen?' : 'Confirm cancellation?')) return;
    setActionLoading(true);
    try {
      await clientApi.post(`/client/suivi/${token}/cancel`, { reason: 'Annulé par le client' });
      await loadData();
    } catch (e) {}
    setActionLoading(false);
  };

  const submitComment = async () => {
    setActionLoading(true);
    try {
      await clientApi.post(`/client/suivi/${token}/comment`, { comment });
      setShowComment(false);
      setComment('');
      setActionMsg(t('common.success', lang));
    } catch (e) {}
    setActionLoading(false);
  };

  const submitRating = async () => {
    setActionLoading(true);
    try {
      await clientApi.post(`/client/suivi/${token}/rate`, { rating, comment: ratingComment });
      setShowRating(false);
      setActionMsg(t('common.success', lang));
      await loadData();
    } catch (e) {}
    setActionLoading(false);
  };

  /* ---- Loading skeleton ---- */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-gray-950 dark:via-slate-950/40 dark:to-slate-900/40">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Shimmer className="w-12 h-12 rounded-2xl" />
              <div className="space-y-2"><Shimmer className="w-32 h-5" /><Shimmer className="w-24 h-3" /></div>
            </div>
            <div className="flex gap-2">{[1,2,3].map(i=><Shimmer key={i} className="w-10 h-8 rounded-lg" />)}</div>
          </div>
          <div className="flex flex-col items-center gap-2"><Shimmer className="w-20 h-4" /><Shimmer className="w-48 h-8" /></div>
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-transparent dark:border-white/10">
            <div className="flex items-center justify-between">
              {[1,2,3,4,5].map(i=>(
                <React.Fragment key={i}>
                  <div className="flex flex-col items-center gap-2"><Shimmer className="w-11 h-11 rounded-full" /><Shimmer className="w-14 h-3" /></div>
                  {i<5 && <Shimmer className="flex-1 h-1 mx-2" />}
                </React.Fragment>
              ))}
            </div>
          </div>
          {[1,2].map(i=>(
            <div key={i} className="bg-white/60 dark:bg-white/5 backdrop-blur-lg rounded-2xl p-6 space-y-4 border border-transparent dark:border-white/10">
              <Shimmer className="w-48 h-5" /><Shimmer className="w-full h-4" /><Shimmer className="w-full h-4" /><Shimmer className="w-3/4 h-4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---- Error state ---- */
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/20 to-slate-50 dark:from-gray-950 dark:via-red-950/20 dark:to-gray-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="bg-white/90 dark:bg-slate-900/70 backdrop-blur-xl border border-red-100 dark:border-red-500/20 rounded-2xl shadow-xl shadow-red-500/5 max-w-md w-full p-8 text-center"
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="w-20 h-20 mx-auto mb-5 bg-red-50 rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
          </motion.div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('common.error', lang)}</h2>
          <p className="text-gray-500 dark:text-gray-300 mb-6">{error}</p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-shadow"
          >
            {lang === 'fr' ? 'Réessayer' : lang === 'de' ? 'Erneut versuchen' : 'Try again'}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (!data) return null;

  const step = STATUS_STEP[data.status] ?? 0;
  const isCancelled = data.status === 'annulee';
  const isCompleted = data.status === 'finalisee';
  const isInProgress = data.status === 'en_cours';

  const steps = [
    { label: lang === 'fr' ? 'Créée' : lang === 'de' ? 'Erstellt' : 'Created', icon: Clock },
    { label: lang === 'fr' ? 'Planifiée' : lang === 'de' ? 'Geplant' : 'Planned', icon: Calendar },
    { label: lang === 'fr' ? 'Confirmée' : lang === 'de' ? 'Bestätigt' : 'Confirmed', icon: CheckCircle2 },
    { label: lang === 'fr' ? 'En cours' : lang === 'de' ? 'In Bearbeitung' : 'In progress', icon: Truck },
    { label: lang === 'fr' ? 'Terminée' : lang === 'de' ? 'Abgeschlossen' : 'Completed', icon: Star },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/20 to-indigo-50/30 dark:from-gray-950 dark:via-slate-950/40 dark:to-slate-900/50 relative">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200/15 dark:bg-blue-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ x: [0, -20, 0], y: [0, 30, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-200/15 dark:bg-indigo-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-100/8 dark:bg-fuchsia-500/5 rounded-full blur-3xl"
        />
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.015] dark:hidden" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />
        <div className="absolute inset-0 opacity-[0.05] hidden dark:block" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.14) 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />
      </div>

      {/* ============ HEADER ============ */}
      <header className="relative z-10 bg-white/60 dark:bg-gray-950/50 backdrop-blur-xl border-b border-gray-200/40 dark:border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="no-underline">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3 group/logo cursor-pointer"
            >
              <motion.div
                whileHover={{ scale: 1.08, rotate: -3 }}
                transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                className="relative w-11 h-11 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover/logo:shadow-blue-500/40 transition-shadow duration-300"
              >
                <Wifi className="w-5 h-5 text-white" />
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-dot-pulse" />
              </motion.div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-600 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent group-hover/logo:from-blue-700 group-hover/logo:via-indigo-600 group-hover/logo:to-purple-600 dark:group-hover/logo:from-blue-300 dark:group-hover/logo:via-indigo-300 dark:group-hover/logo:to-fuchsia-300 transition-all duration-500">
                  FibreConnect
                </h1>
                <p className="text-xs text-gray-400 dark:text-gray-400 group-hover/logo:text-gray-500 dark:group-hover/logo:text-gray-300 transition-colors">{t('client.welcome', lang)}</p>
              </div>
            </motion.div>
          </Link>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center gap-2"
          >
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="relative h-9 w-9 flex items-center justify-center rounded-xl border border-gray-200/60 dark:border-white/10 bg-white/70 dark:bg-white/5 backdrop-blur-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white hover:bg-white/90 dark:hover:bg-white/10 transition-colors"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                {theme === 'light' ? (
                  <motion.div
                    key="sun"
                    initial={{ y: -12, opacity: 0, rotate: -90 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 12, opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Sun className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ y: -12, opacity: 0, rotate: -90 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 12, opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Moon className="w-4 h-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {/* Language toggle */}
            <div className="flex items-center gap-1.5 bg-gray-100/70 dark:bg-white/5 backdrop-blur-sm rounded-xl p-1 border border-gray-200/50 dark:border-white/10">
              <Globe className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 ml-1.5" />
              {(['fr', 'de', 'en'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => changeLang(l)}
                  className="relative text-xs px-2.5 py-1.5 rounded-lg font-medium transition-all duration-200"
                >
                  {lang === l && (
                    <motion.div
                      layoutId="activeLang"
                      className="absolute inset-0 bg-white dark:bg-white/10 shadow-sm shadow-gray-200/50 dark:shadow-none rounded-lg border border-gray-100 dark:border-white/10"
                      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    />
                  )}
                  <span className={cn(
                    "relative z-10 transition-colors duration-200",
                    lang === l ? 'text-blue-600 dark:text-blue-300 font-semibold' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  )}>
                    {l.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </header>

      {/* ============ MAIN ============ */}
      <PageTransition>
        <main className="relative z-10 max-w-3xl mx-auto px-4 py-8 space-y-7">
          <StaggerContainer className="space-y-7" staggerDelay={0.1}>

            {/* ---- Reference ---- */}
            <StaggerItem>
              <motion.div className="text-center space-y-1">
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 tracking-widest uppercase font-medium"
                >
                  <Shield className="w-3 h-3" />
                  {lang === 'fr' ? 'Référence' : lang === 'de' ? 'Referenz' : 'Reference'}
                </motion.span>
                <motion.h2
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.7, type: 'spring', damping: 14 }}
                  className="text-3xl font-bold font-mono bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent"
                >
                  {data.reference}
                </motion.h2>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="h-[2px] w-24 mx-auto bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent"
                />
              </motion.div>
            </StaggerItem>

            {/* ---- Action message ---- */}
            <AnimatePresence>
              {actionMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="relative bg-emerald-50/80 dark:bg-emerald-500/10 backdrop-blur-sm border border-emerald-200/60 dark:border-emerald-500/20 rounded-2xl p-4 text-emerald-700 dark:text-emerald-200 text-sm text-center flex items-center justify-center gap-2 overflow-hidden"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.1 }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </motion.div>
                  <span className="font-medium">{actionMsg}</span>
                  {/* Auto-dismiss progress bar */}
                  <motion.div
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: 0 }}
                    transition={{ duration: 4, ease: 'linear' }}
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400/40 origin-left"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* ---- Progress Steps ---- */}
            {!isCancelled && (
              <StaggerItem>
                <TiltCard glowColor="rgba(59,130,246,0.06)">
                  <div className="flex items-center justify-between">
                    {steps.map((s, i) => {
                      const Icon = s.icon;
                      const isActive = i <= step;
                      const isCurrent = i === step;
                      const isHovered = hoveredStep === i;
                      return (
                        <React.Fragment key={i}>
                          <motion.div
                            className="flex flex-col items-center cursor-default"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: i * 0.1, type: 'spring', damping: 15 }}
                            onMouseEnter={() => setHoveredStep(i)}
                            onMouseLeave={() => setHoveredStep(null)}
                          >
                            <motion.div
                              animate={isHovered ? { scale: 1.15, y: -2 } : { scale: 1, y: 0 }}
                              transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                               className={cn(
                                 "relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500",
                                 isCurrent
                                   ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                                   : isActive
                                     ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20'
                                     : 'bg-gray-100 text-gray-400 hover:bg-gray-200/80 dark:bg-white/5 dark:text-gray-500 dark:hover:bg-white/10',
                             )}>
                              <Icon className="w-5 h-5 relative z-10" />
                              {/* Pulse ring on current */}
                              {isCurrent && (
                                <motion.div
                                  className="absolute inset-0 rounded-full border-2 border-blue-400/50"
                                  animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                                />
                              )}
                              {/* Completed checkmark overlay */}
                              {isActive && !isCurrent && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: 0.3 + i * 0.1, type: 'spring' }}
                                  className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                                >
                                  <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                                </motion.div>
                              )}
                            </motion.div>

                            <motion.span
                              animate={isHovered ? { y: 2 } : { y: 0 }}
                              className={cn(
                                "text-xs mt-2.5 font-medium transition-colors duration-300",
                                isActive ? 'text-blue-600 dark:text-blue-300' : 'text-gray-400 dark:text-gray-500',
                                isHovered && !isActive && 'text-gray-500 dark:text-gray-300',
                              )}
                            >
                              {s.label}
                            </motion.span>
                          </motion.div>

                          {/* Connector bar */}
                          {i < steps.length - 1 && (
                            <div className="flex-1 h-[3px] mx-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden relative">
                              <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                                initial={{ width: '0%' }}
                                animate={{ width: i < step ? '100%' : '0%' }}
                                transition={{ duration: 0.8, delay: 0.3 + i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                              />
                              {/* Shimmer on completed bars */}
                              {i < step && (
                                <motion.div
                                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent dark:via-white/10"
                                  animate={{ x: ['-100%', '100%'] }}
                                  transition={{ duration: 3, repeat: Infinity, ease: 'linear', delay: i * 0.5 }}
                                />
                              )}
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </TiltCard>
              </StaggerItem>
            )}

            {/* ---- Cancelled banner ---- */}
            {isCancelled && (
              <StaggerItem>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative bg-gradient-to-br from-red-50/90 to-red-100/50 dark:from-red-500/10 dark:to-red-500/5 backdrop-blur-lg border border-red-200/50 dark:border-red-500/20 rounded-2xl p-8 text-center shadow-lg shadow-red-500/5 overflow-hidden"
                >
                  <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(239,68,68,0.1) 10px, rgba(239,68,68,0.1) 20px)',
                  }} />
                  <motion.div
                    animate={{ rotate: [0, -5, 5, -5, 0] }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                  >
                    <div className="w-16 h-16 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
                      <XCircle className="w-8 h-8 text-red-400" />
                    </div>
                  </motion.div>
                  <h3 className="text-lg font-bold text-red-800 dark:text-red-200">
                    {lang === 'fr' ? 'Intervention annulée' : lang === 'de' ? 'Intervention storniert' : 'Intervention cancelled'}
                  </h3>
                </motion.div>
              </StaggerItem>
            )}

            {/* ---- Intervention Details ---- */}
            <StaggerItem>
              <TiltCard>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2.5">
                  <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full" />
                  {lang === 'fr' ? 'Détails de l\'intervention' : lang === 'de' ? 'Interventionsdetails' : 'Intervention details'}
                </h3>
                <div className="space-y-0.5">
                  <DetailRow
                    label={t('intervention.type', lang)}
                    value={
                      <AnimatedBadge className="bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 px-3 py-1 border border-blue-100/50 dark:border-blue-500/20">
                        {getTypeLabel(data.type, lang)}
                      </AnimatedBadge>
                    }
                  />
                  {data.description && (
                    <DetailRow
                      label="Description"
                      value={<span className="max-w-[60%] text-right">{data.description}</span>}
                    />
                  )}
                  <DetailRow
                    label={t('intervention.status', lang)}
                    accentColor="indigo"
                    value={
                      <AnimatedBadge className={cn(
                        "px-3 py-1 border",
                        data.status === 'finalisee' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-200 border-emerald-100/50 dark:border-emerald-500/20' :
                        data.status === 'en_retard' ? 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-200 border-red-100/50 dark:border-red-500/20' :
                        data.status === 'en_cours' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-200 border-amber-100/50 dark:border-amber-500/20' :
                        'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-100/50 dark:border-blue-500/20'
                      )}>
                        {getStatusLabel(data.status, lang)}
                      </AnimatedBadge>
                    }
                  />
                  <DetailRow
                    icon={Calendar}
                    label={t('intervention.date', lang)}
                    value={
                      <span>
                        {data.scheduled_date || '-'}
                        {data.scheduled_start_time && (
                          <span className="text-gray-400 dark:text-gray-600 mx-1">|</span>
                        )}
                        {data.scheduled_start_time && (
                          <span className="text-blue-600 dark:text-blue-300 font-semibold">
                            {data.scheduled_start_time} - {data.scheduled_end_time}
                          </span>
                        )}
                      </span>
                    }
                  />
                  <DetailRow
                    icon={MapPin}
                    label={t('intervention.address', lang)}
                    value={`${data.address}, ${data.city}`}
                    isLast
                    accentColor="emerald"
                  />
                </div>
              </TiltCard>
            </StaggerItem>

            {/* ---- Technician Info ---- */}
            {data.technician && (
              <StaggerItem>
                <TiltCard>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2.5">
                    <div className="w-1.5 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full" />
                    {t('intervention.technician', lang)}
                  </h3>
                  <div className="flex items-center gap-4 group/tech">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                      className="relative w-14 h-14 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-indigo-500/25 group-hover/tech:shadow-indigo-500/40 transition-shadow duration-300 cursor-default"
                    >
                      {data.technician.first_name[0]}{data.technician.last_name[0]}
                      {/* Hover ring */}
                      <motion.div
                        className="absolute inset-[-3px] rounded-2xl border-2 border-indigo-400/0 group-hover/tech:border-indigo-400/30 transition-all duration-300"
                      />
                    </motion.div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white group-hover/tech:text-indigo-700 dark:group-hover/tech:text-indigo-300 transition-colors duration-300">
                        {data.technician.first_name} {data.technician.last_name}
                      </p>
                      {data.technician.phone && (
                        <motion.a
                          href={`tel:${data.technician.phone}`}
                          whileHover={{ x: 3 }}
                          className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 transition-colors mt-1 group/phone"
                        >
                          <Phone className="w-3.5 h-3.5 group-hover/phone:animate-[shake_0.3s_ease-in-out]" />
                          <span className="border-b border-transparent group-hover/phone:border-blue-400 transition-[border-color] duration-200">
                            {data.technician.phone}
                          </span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover/phone:opacity-50 transition-opacity" />
                        </motion.a>
                      )}
                    </div>
                  </div>

                  {/* Real-time tracking */}
                  {isInProgress && data.technician.current_latitude && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, type: 'spring' }}
                      className="mt-5 p-4 bg-gradient-to-br from-emerald-50/90 to-teal-50/70 dark:from-emerald-500/10 dark:to-teal-500/5 backdrop-blur-sm border border-emerald-200/50 dark:border-emerald-500/20 rounded-2xl"
                    >
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="relative w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                          <Navigation className="w-4 h-4 text-emerald-600" />
                          <motion.div
                            className="absolute inset-0 rounded-full bg-emerald-400/30"
                            animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          />
                        </div>
                        <span className="font-semibold text-emerald-800">{t('client.tech_on_way', lang)}</span>
                      </div>
                      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-emerald-100/50 dark:border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-300">{t('client.eta', lang)}</span>
                          <div className="text-right">
                            <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">~15 min</span>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-dot-pulse" />
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                            GPS: {data.technician.current_latitude?.toFixed(4)}, {data.technician.current_longitude?.toFixed(4)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </TiltCard>
              </StaggerItem>
            )}

            {/* ---- Actions ---- */}
            {!isCancelled && !isCompleted && (
              <StaggerItem>
                <TiltCard>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2.5">
                    <div className="w-1.5 h-6 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full" />
                    Actions
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.status === 'planifiee_auto' && (
                      <MovingBorderButton onClick={confirmDate} disabled={actionLoading} containerClassName="w-full">
                        <span className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          {t('client.confirm_date', lang)}
                        </span>
                      </MovingBorderButton>
                    )}
                    {['planifiee_auto', 'confirmee'].includes(data.status) && (
                      <ActionButton
                        onClick={loadSlots}
                        disabled={actionLoading}
                        icon={RefreshCw}
                        label={t('client.reschedule', lang)}
                        iconAnimation="spin"
                      />
                    )}
                    <ActionButton
                      onClick={() => setShowComment(true)}
                      icon={MessageSquare}
                      label={t('client.add_comment', lang)}
                      iconAnimation="bounce"
                    />
                    {['planifiee_auto', 'confirmee'].includes(data.status) && (
                      <ActionButton
                        onClick={cancelIntervention}
                        disabled={actionLoading}
                        icon={XCircle}
                        label={t('client.cancel_intervention', lang)}
                        variant="danger"
                        iconAnimation="shake"
                      />
                    )}
                  </div>
                </TiltCard>
              </StaggerItem>
            )}

            {/* ---- Rating form (post completion) ---- */}
            {isCompleted && !data.client_rating && (
              <StaggerItem>
                <TiltCard className="relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <SparklesCore particleCount={20} particleColor={theme === 'dark' ? '#a78bfa' : '#8b5cf6'} minSize={0.3} maxSize={0.8} />
                  </div>
                  <div className="relative z-10">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2.5">
                      <div className="w-1.5 h-6 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
                      {t('client.rate_service', lang)}
                    </h3>
                    <div className="flex justify-center gap-3 mb-6">
                      {[1, 2, 3, 4, 5].map(r => (
                        <motion.button
                          key={r}
                          onClick={() => setRating(r)}
                          whileHover={{ scale: 1.25, y: -4, rotate: r <= rating ? 12 : 0 }}
                          whileTap={{ scale: 0.85 }}
                          className={cn(
                            "w-13 h-13 rounded-2xl text-2xl flex items-center justify-center transition-all duration-300",
                            r <= rating
                              ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-400/30 hover:shadow-amber-400/50'
                              : 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-gray-600 hover:bg-gray-200 dark:hover:bg-white/10 hover:text-gray-400 dark:hover:text-gray-500'
                          )}
                          style={{ width: '3.25rem', height: '3.25rem' }}
                        >
                          {r <= rating ? '\u2605' : '\u2606'}
                        </motion.button>
                      ))}
                    </div>
                    <div className="text-center text-sm text-gray-500 dark:text-gray-300 mb-4 font-medium">
                      {rating}/5 - {
                        rating >= 5 ? (lang === 'fr' ? 'Excellent !' : lang === 'de' ? 'Ausgezeichnet!' : 'Excellent!') :
                        rating >= 4 ? (lang === 'fr' ? 'Très bien' : lang === 'de' ? 'Sehr gut' : 'Very good') :
                        rating >= 3 ? (lang === 'fr' ? 'Bien' : lang === 'de' ? 'Gut' : 'Good') :
                        rating >= 2 ? (lang === 'fr' ? 'Moyen' : lang === 'de' ? 'Mittel' : 'Average') :
                        (lang === 'fr' ? 'Mauvais' : lang === 'de' ? 'Schlecht' : 'Poor')
                      }
                    </div>
                    <textarea
                      value={ratingComment}
                      onChange={e => setRatingComment(e.target.value)}
                      className="w-full px-4 py-3 bg-white/70 dark:bg-white/5 dark:text-gray-100 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all resize-none hover:border-gray-300 dark:hover:border-white/20"
                      rows={3}
                      placeholder={lang === 'fr' ? 'Votre commentaire (optionnel)' : lang === 'de' ? 'Ihr Kommentar (optional)' : 'Your comment (optional)'}
                    />
                    <MovingBorderButton onClick={submitRating} disabled={actionLoading} containerClassName="w-full mt-4">
                      <span className="flex items-center gap-2">
                        <Star className="w-4 h-4" />
                        {t('client.rate_service', lang)}
                      </span>
                    </MovingBorderButton>
                  </div>
                </TiltCard>
              </StaggerItem>
            )}

            {/* ---- Existing rating display ---- */}
            {data.client_rating && (
              <StaggerItem>
                <TiltCard className="text-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-15 pointer-events-none">
                    <SparklesCore particleCount={12} particleColor={theme === 'dark' ? '#fbbf24' : '#f59e0b'} minSize={0.3} maxSize={0.7} />
                  </div>
                  <div className="relative z-10">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('client.rate_service', lang)}</h3>
                    <div className="flex justify-center gap-2.5 mb-3">
                      {Array.from({ length: 5 }, (_, i) => (
                        <motion.span
                          key={i}
                          initial={{ opacity: 0, scale: 0, rotate: -180 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          whileHover={{ scale: 1.3, rotate: 15 }}
                          transition={{ delay: i * 0.1, type: 'spring', damping: 12 }}
                          className={cn(
                            "text-3xl cursor-default select-none",
                            i < data.client_rating ? 'text-amber-400 drop-shadow-sm' : 'text-gray-300'
                          )}
                        >
                          {i < data.client_rating ? '\u2605' : '\u2606'}
                        </motion.span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-300 font-medium">{data.client_rating}/5</p>
                    {data.client_comment && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-4 text-sm text-gray-600 dark:text-gray-200 italic bg-gray-50/60 dark:bg-white/5 rounded-xl p-4 border border-gray-100/50 dark:border-white/10 relative"
                      >
                        <span className="absolute top-2 left-3 text-2xl text-gray-200 dark:text-gray-700 font-serif">"</span>
                        <span className="relative z-10 ml-4">{data.client_comment}</span>
                        <span className="absolute bottom-1 right-3 text-2xl text-gray-200 dark:text-gray-700 font-serif">"</span>
                      </motion.div>
                    )}
                  </div>
                </TiltCard>
              </StaggerItem>
            )}
          </StaggerContainer>
        </main>
      </PageTransition>

      {/* ============ MODALS ============ */}
      {/* Reschedule Modal */}
      <AnimatedModal
        isOpen={showReschedule}
        onClose={() => setShowReschedule(false)}
        title={t('client.reschedule', lang)}
        size="sm"
      >
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {slots.map((s, i) => (
            <motion.label
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ x: 3 }}
              className={cn(
                "flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 group/slot",
                selectedSlot === `${s.date}|${s.start}`
                  ? 'border-blue-400 bg-blue-50/80 dark:bg-blue-500/10 dark:border-blue-500/30 shadow-sm shadow-blue-500/5'
                  : 'border-gray-200 dark:border-white/10 hover:bg-gray-50/80 dark:hover:bg-white/5 hover:border-gray-300 dark:hover:border-white/20 hover:shadow-sm'
              )}
            >
              <input
                type="radio" name="slot" value={`${s.date}|${s.start}`}
                checked={selectedSlot === `${s.date}|${s.start}`}
                onChange={e => setSelectedSlot(e.target.value)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900 dark:text-white">{s.date}</p>
                <p className="text-xs text-gray-500 dark:text-gray-300">{s.start} - {s.end}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 opacity-0 group-hover/slot:opacity-100 transition-opacity" />
            </motion.label>
          ))}
        </div>
        <textarea
          value={comment} onChange={e => setComment(e.target.value)}
          className="w-full mt-4 px-4 py-3 bg-white/70 dark:bg-white/5 dark:text-gray-100 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all resize-none hover:border-gray-300 dark:hover:border-white/20"
          rows={2}
          placeholder={lang === 'fr' ? 'Commentaire (optionnel)' : 'Comment (optional)'}
        />
        <div className="flex gap-3 mt-4">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowReschedule(false)}
            className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl font-medium text-sm text-gray-700 dark:text-gray-200 transition-colors"
          >{t('common.cancel', lang)}</motion.button>
          <MovingBorderButton onClick={reschedule} disabled={!selectedSlot || actionLoading} containerClassName="flex-1">
            {t('common.confirm', lang)}
          </MovingBorderButton>
        </div>
      </AnimatedModal>

      {/* Comment Modal */}
      <AnimatedModal
        isOpen={showComment}
        onClose={() => setShowComment(false)}
        title={t('client.add_comment', lang)}
        size="sm"
      >
        <textarea
          value={comment} onChange={e => setComment(e.target.value)}
          className="w-full px-4 py-3 bg-white/70 dark:bg-white/5 dark:text-gray-100 border border-gray-200 dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all resize-none hover:border-gray-300 dark:hover:border-white/20"
          rows={4}
          placeholder={lang === 'fr' ? 'Votre message...' : lang === 'de' ? 'Ihre Nachricht...' : 'Your message...'}
        />
        <div className="flex gap-3 mt-4">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => setShowComment(false)}
            className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl font-medium text-sm text-gray-700 dark:text-gray-200 transition-colors"
          >{t('common.cancel', lang)}</motion.button>
          <MovingBorderButton onClick={submitComment} disabled={!comment || actionLoading} containerClassName="flex-1">
            {t('common.save', lang)}
          </MovingBorderButton>
        </div>
      </AnimatedModal>

      {/* ============ FOOTER ============ */}
      <footer className="relative z-10 text-center py-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="inline-flex items-center gap-3"
        >
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-gray-300 dark:to-white/20" />
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium tracking-wide">
            FibreConnect Europe
          </p>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-gray-300 dark:to-white/20" />
        </motion.div>
        <div className="flex justify-center gap-1.5 mt-2">
          {['DE', 'BE', 'FR', 'LU'].map((c, i) => (
            <motion.span
              key={c}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.1 + i * 0.08, type: 'spring' }}
              whileHover={{ scale: 1.15, y: -1 }}
              className="text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-gray-100/60 dark:bg-white/5 px-2 py-0.5 rounded cursor-default hover:text-blue-500 dark:hover:text-blue-300 hover:bg-blue-50/60 dark:hover:bg-blue-500/10 transition-colors duration-200"
            >
              {c}
            </motion.span>
          ))}
        </div>
      </footer>
    </div>
  );
}
