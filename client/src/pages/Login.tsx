import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { t } from '../lib/i18n';
import { Wifi, AlertCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { BackgroundGradientAnimation, SparklesCore } from '../components/ui/background-effects';
import { MovingBorderButton } from '../components/ui/moving-border';

export default function Login() {
  const [email, setEmail] = useState('admin@fibreeurope.com');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BackgroundGradientAnimation
      containerClassName="min-h-screen"
      className="flex items-center justify-center p-4 min-h-screen"
      gradientBackgroundStart="rgb(2, 6, 23)"
      gradientBackgroundEnd="rgb(15, 23, 42)"
      firstColor="59, 130, 246"
      secondColor="139, 92, 246"
      thirdColor="6, 182, 212"
    >
      {/* Sparkles overlay */}
      <SparklesCore
        particleCount={40}
        particleColor="#ffffff"
        minSize={0.4}
        maxSize={1.2}
        className="z-0"
      />

      <div className="w-full max-w-md relative z-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/30"
          >
            <Wifi className="w-8 h-8 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-3xl font-bold text-white"
          >
            FibreConnect
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-blue-200/70 mt-1"
          >
            Europe - Gestion des Interventions
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="flex justify-center gap-3 mt-3 text-2xl"
          >
            <span title="France">{'\u{1F1EB}\u{1F1F7}'}</span>
            <span title="Allemagne">{'\u{1F1E9}\u{1F1EA}'}</span>
            <span title="Belgique">{'\u{1F1E7}\u{1F1EA}'}</span>
            <span title="Luxembourg">{'\u{1F1F1}\u{1F1FA}'}</span>
          </motion.div>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          onSubmit={handleSubmit}
          className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-2xl p-8"
        >
          {/* Subtle glow at top of form */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
          
          <h2 className="text-xl font-semibold text-white mb-6">{t('auth.login')}</h2>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-300 text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('auth.email')}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="username"
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                placeholder="email@exemple.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">{t('auth.password')}</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-200"
                placeholder="********"
                required
              />
            </div>
            
            <MovingBorderButton
              type="submit"
              disabled={loading}
              containerClassName="w-full"
              className="w-full gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('common.loading')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {t('auth.login')}
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </MovingBorderButton>
          </div>

          <div className="mt-6 p-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
            <p className="text-xs font-medium text-gray-400 mb-2">Comptes de test :</p>
            <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
              <p><span className="text-gray-300 font-medium">Super Admin:</span> admin@fibreeurope.com / admin123</p>
              <p><span className="text-gray-300 font-medium">Admin FR:</span> admin@fibre-france.com / admin123</p>
              <p><span className="text-gray-300 font-medium">Tech Paris:</span> tech1.paris@fibre.com / admin123</p>
            </div>
          </div>
        </motion.form>
      </div>
    </BackgroundGradientAnimation>
  );
}
