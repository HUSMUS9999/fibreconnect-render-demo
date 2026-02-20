import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { useTheme } from '../lib/theme';
import { t, humanizeKey } from '../lib/i18n';
import { api } from '../lib/api';
import {
  LayoutDashboard, ClipboardList, Calendar, Users, UserCog, 
  AlertTriangle, Bell, LogOut, Menu, X, Globe, ChevronDown,
  Wifi, Building2, Sun, Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  SidebarLogo,
  SidebarUserInfo,
} from './ui/sidebar';

const countryFlags: Record<string, string> = {
  'FR': '\u{1F1EB}\u{1F1F7}',
  'DE': '\u{1F1E9}\u{1F1EA}',
  'BE': '\u{1F1E7}\u{1F1EA}',
  'LU': '\u{1F1F1}\u{1F1FA}',
};

export default function Layout() {
  const { user, logout, lang, changeLang } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showLang, setShowLang] = useState(false);

  useEffect(() => {
    api.get('/dashboard/notifications').then(setNotifications).catch(() => {});
    const interval = setInterval(() => {
      api.get('/dashboard/notifications').then(setNotifications).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const unread = notifications.filter(n => !n.is_read).length;

  const navItems = [
    { path: '/', icon: <LayoutDashboard className="w-5 h-5" />, label: t('nav.dashboard'), roles: ['super_admin', 'admin_pays', 'superviseur', 'technicien'] },
    { path: '/interventions', icon: <ClipboardList className="w-5 h-5" />, label: t('nav.interventions'), roles: ['super_admin', 'admin_pays', 'superviseur', 'technicien'] },
    { path: '/planning', icon: <Calendar className="w-5 h-5" />, label: t('nav.planning'), roles: ['super_admin', 'admin_pays', 'superviseur'] },
    { path: '/technicians', icon: <UserCog className="w-5 h-5" />, label: t('nav.technicians'), roles: ['super_admin', 'admin_pays', 'superviseur'] },
    { path: '/clients', icon: <Building2 className="w-5 h-5" />, label: t('nav.clients'), roles: ['super_admin', 'admin_pays', 'superviseur'] },
    { path: '/users', icon: <Users className="w-5 h-5" />, label: t('nav.users'), roles: ['super_admin', 'admin_pays'] },
    { path: '/sla', icon: <AlertTriangle className="w-5 h-5" />, label: t('nav.sla'), roles: ['super_admin', 'admin_pays', 'superviseur'] },
  ];

  const filteredNav = navItems.filter(item => user && item.roles.includes(user.role));

  const markRead = async (id: string) => {
    await api.post(`/dashboard/notifications/${id}/read`, {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Animated Sidebar */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} animate={true}>
        <SidebarBody className="justify-between">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            {/* Logo */}
            <SidebarLogo
              icon={<Wifi className="w-5 h-5 text-white" />}
              title="FibreConnect"
              subtitle="Europe"
            />

            {/* Separator */}
            <div className="mx-4 my-2 h-px bg-gray-200/80 dark:bg-gray-800" />

            {/* Navigation */}
            <nav className="flex flex-col gap-0.5 py-2">
              {filteredNav.map(item => {
                const isActive = location.pathname === item.path || 
                  (item.path !== '/' && location.pathname.startsWith(item.path));
                return (
                  <SidebarLink
                    key={item.path}
                    link={{
                      label: item.label,
                      href: item.path,
                      icon: item.icon,
                    }}
                    isActive={isActive}
                  />
                );
              })}
            </nav>
          </div>

          {/* User info at bottom */}
          {user && (
            <SidebarUserInfo
              name={`${user.first_name} ${user.last_name}`}
              role={`${countryFlags[user.country]} ${t(`role.${user.role}`)}`}
              avatar={
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-blue-500/20">
                  {user.first_name[0]}{user.last_name[0]}
                </div>
              }
            />
          )}
        </SidebarBody>
      </Sidebar>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 flex items-center justify-between px-4 flex-shrink-0 z-20 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span>{countryFlags[user?.country || 'FR']}</span>
              <span>{t(`country.${user?.country || 'FR'}`)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors overflow-hidden"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                {theme === 'light' ? (
                  <motion.div
                    key="sun"
                    initial={{ y: -20, opacity: 0, rotate: -90 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 20, opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ y: -20, opacity: 0, rotate: -90 }}
                    animate={{ y: 0, opacity: 1, rotate: 0 }}
                    exit={{ y: 20, opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>

            {/* Language */}
            <div className="relative">
              <button 
                onClick={() => setShowLang(!showLang)} 
                className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="uppercase font-medium">{lang}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {showLang && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg dark:shadow-gray-900/50 py-1 z-50 min-w-[140px]"
                  >
                    {(['fr', 'de', 'en'] as const).map(l => (
                      <button
                        key={l}
                        onClick={() => { changeLang(l); setShowLang(false); }}
                        className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${lang === l ? 'text-blue-600 dark:text-blue-400 font-medium bg-blue-50/50 dark:bg-blue-500/10' : 'text-gray-700 dark:text-gray-300'}`}
                      >
                        {l === 'fr' ? 'Francais' : l === 'de' ? 'Deutsch' : 'English'}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unread > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium shadow-sm"
                  >
                    {unread}
                  </motion.span>
                )}
              </button>
              <AnimatePresence>
                {showNotifs && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl dark:shadow-gray-900/50 z-50 max-h-96 overflow-hidden"
                  >
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700 font-medium text-sm flex items-center justify-between text-gray-900 dark:text-gray-100">
                      <span>{t('nav.notifications')}</span>
                      {unread > 0 && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full">{unread} new</span>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-sm text-gray-400 text-center">Aucune notification</div>
                      ) : (
                        notifications.slice(0, 10).map((n, idx) => (
                          <motion.div
                            key={n.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            onClick={() => markRead(n.id)}
                            className={`p-3 border-b border-gray-50 dark:border-gray-700/50 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!n.is_read ? 'bg-blue-50/50 dark:bg-blue-500/5' : ''}`}
                          >
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {typeof n.title === 'string' && n.title.includes('_') ? humanizeKey(n.title) : n.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{n.message}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Logout */}
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-gray-950 transition-colors duration-300">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
