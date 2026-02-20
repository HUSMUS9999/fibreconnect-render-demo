import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  X,
  XCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CustomDateInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  time?: boolean;
  required?: boolean;
}

const WEEK_DAYS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

const isSameDay = (a: Date, b: Date) => (
  a.getFullYear() === b.getFullYear()
  && a.getMonth() === b.getMonth()
  && a.getDate() === b.getDate()
);

const toLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toLocalDateTime = (date: Date) => {
  const datePart = toLocalDate(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${datePart}T${hours}:${minutes}`;
};

const parseInputValue = (raw: string, withTime: boolean) => {
  if (!raw) return null;
  const parsed = withTime ? new Date(raw) : new Date(`${raw}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

export const CustomDateInput = ({
  value,
  onChange,
  label,
  placeholder = 'Select a date',
  className,
  disabled = false,
  time = false,
  required = false,
}: CustomDateInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMonth, setViewMonth] = useState(() => new Date());
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parsed = parseInputValue(value, time);
    if (!parsed) return;
    setSelectedDate(parsed);
    setViewMonth(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
  }, [value, time]);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const panelHeight = time ? 480 : 390;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    setOpenUpward(spaceBelow < panelHeight && spaceAbove > spaceBelow);
    setViewMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [isOpen, selectedDate, time]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const monthLabel = useMemo(() => {
    return viewMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }, [viewMonth]);

  const calendarDays = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const firstWeekDay = (firstOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: Array<Date | null> = [];
    for (let i = 0; i < 42; i += 1) {
      const day = i - firstWeekDay + 1;
      if (day < 1 || day > daysInMonth) {
        cells.push(null);
      } else {
        cells.push(new Date(year, month, day));
      }
    }
    return cells;
  }, [viewMonth]);

  const formatDate = (date: Date) => date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formatTime = (date: Date) => date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const commitDate = (date: Date) => {
    setSelectedDate(date);
    onChange(time ? toLocalDateTime(date) : toLocalDate(date));
    setIsOpen(false);
  };

  const withSelectedTime = (day: Date) => {
    const next = new Date(day);
    next.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
    return next;
  };

  const handleDaySelect = (day: Date) => {
    const next = withSelectedTime(day);
    if (time) {
      setSelectedDate(next);
      return;
    }
    commitDate(next);
  };

  const handleClear = () => {
    onChange('');
    const now = new Date();
    setSelectedDate(now);
    setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const changeMonth = (delta: number) => {
    setViewMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const shiftHours = (delta: number) => {
    setSelectedDate(prev => {
      const next = new Date(prev);
      next.setHours(next.getHours() + delta);
      return next;
    });
  };

  const shiftMinutes = (delta: number) => {
    setSelectedDate(prev => {
      const next = new Date(prev);
      next.setMinutes(next.getMinutes() + delta);
      return next;
    });
  };

  const applyQuickDate = (offsetDays: number) => {
    const next = new Date();
    next.setDate(next.getDate() + offsetDays);
    next.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
    commitDate(next);
  };

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <motion.div className="relative group">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            'relative w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm transition-all duration-300 overflow-hidden',
            disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer hover:border-gray-300 dark:hover:border-slate-600',
            isOpen && 'ring-2 ring-blue-500/30 border-blue-400/50 dark:border-blue-500/50'
          )}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 dark:from-blue-400/0 dark:via-blue-400/5 dark:to-blue-400/0"
            initial={{ x: '-100%' }}
            animate={{ x: isOpen ? '100%' : '-100%' }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          />

          <motion.div className="relative z-10 flex items-center gap-2 truncate">
            {value ? (
              <div className="flex flex-col gap-0.5 text-gray-700 dark:text-gray-300 text-left">
                <span className="text-sm font-medium">{time ? formatTime(selectedDate) : formatDate(selectedDate)}</span>
                {time && <span className="text-xs text-gray-400">{formatDate(selectedDate)}</span>}
              </div>
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )}
          </motion.div>

          <motion.div className="relative z-10 flex items-center gap-1">
            {value && (
              <motion.span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleClear();
                  }
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="w-4 h-4 text-gray-400 hover:text-gray-500"
              >
                <X className="w-4 h-4" />
              </motion.span>
            )}

            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </motion.div>
          </motion.div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'absolute left-0 right-0 z-50',
                  openUpward ? 'bottom-full mb-2' : 'top-full mt-2'
                )}
              >
                <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-gray-200/70 dark:border-slate-700/70 shadow-2xl overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent dark:via-blue-400/30" />

                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                        {time ? 'Selectionner date et heure' : 'Selectionner date'}
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="text-gray-400 hover:text-gray-500"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="rounded-xl border border-gray-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/70 p-3">
                      <div className="flex items-center justify-between mb-3">
                        <button
                          type="button"
                          onClick={() => changeMonth(-1)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-slate-800 transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 capitalize">{monthLabel}</p>
                        <button
                          type="button"
                          onClick={() => changeMonth(1)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-slate-800 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <div
                        className="grid gap-1 text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1"
                        style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
                      >
                        {WEEK_DAYS.map(day => (
                          <div key={day} className="h-7 flex items-center justify-center">{day}</div>
                        ))}
                      </div>

                      <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
                        {calendarDays.map((day, idx) => {
                          if (!day) {
                            return <div key={`empty-${idx}`} className="h-8" />;
                          }

                          const selected = isSameDay(day, selectedDate);
                          const today = isSameDay(day, new Date());

                          return (
                            <button
                              key={day.toISOString()}
                              type="button"
                              onClick={() => handleDaySelect(day)}
                              className={cn(
                                'h-8 rounded-lg text-xs font-medium transition-all duration-150',
                                selected
                                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800',
                                today && !selected && 'ring-1 ring-blue-400/70 dark:ring-blue-500/70'
                              )}
                            >
                              {day.getDate()}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(selectedDate)}</span>
                      </div>
                    </div>

                    {time && (
                      <div className="rounded-xl border border-gray-200/80 dark:border-slate-700/80 bg-white/70 dark:bg-slate-900/70 p-3 space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{formatTime(selectedDate)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-2">
                            <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Heure</p>
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => shiftHours(-1)}
                                className="px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300"
                              >
                                -
                              </button>
                              <span className="font-semibold text-gray-800 dark:text-gray-100">{String(selectedDate.getHours()).padStart(2, '0')}</span>
                              <button
                                type="button"
                                onClick={() => shiftHours(1)}
                                className="px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-2">
                            <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Minutes</p>
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => shiftMinutes(-5)}
                                className="px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300"
                              >
                                -
                              </button>
                              <span className="font-semibold text-gray-800 dark:text-gray-100">{String(selectedDate.getMinutes()).padStart(2, '0')}</span>
                              <button
                                type="button"
                                onClick={() => shiftMinutes(5)}
                                className="px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {[
                            { label: '09:00', h: 9, m: 0 },
                            { label: '13:00', h: 13, m: 0 },
                            { label: '18:00', h: 18, m: 0 },
                          ].map(slot => (
                            <button
                              key={slot.label}
                              type="button"
                              onClick={() => {
                                const next = new Date(selectedDate);
                                next.setHours(slot.h, slot.m, 0, 0);
                                setSelectedDate(next);
                              }}
                              className="flex-1 py-1.5 rounded-lg text-xs border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              {slot.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200/80 dark:border-slate-700/80">
                      <button
                        type="button"
                        onClick={() => applyQuickDate(0)}
                        className="px-3 py-2 rounded-lg text-sm bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        Aujourd'hui
                      </button>
                      <button
                        type="button"
                        onClick={() => applyQuickDate(1)}
                        className="px-3 py-2 rounded-lg text-sm bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        Demain
                      </button>

                      <div className="ml-auto flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsOpen(false)}
                          className="px-3 py-2 rounded-lg text-sm bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                        >
                          Annuler
                        </button>
                        {time && (
                          <button
                            type="button"
                            onClick={() => commitDate(selectedDate)}
                            className="px-3 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                          >
                            Appliquer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
