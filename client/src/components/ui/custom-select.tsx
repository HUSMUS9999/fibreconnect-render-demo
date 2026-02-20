import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface Option {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export const CustomSelect = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className,
  icon,
  disabled = false,
}: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <motion.button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          "relative w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all duration-300 overflow-hidden group",
          "bg-gradient-to-r from-white via-gray-50/50 to-white dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900",
          "border border-gray-200/80 dark:border-slate-700/80",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          isOpen && "ring-2 ring-blue-500/30 border-blue-400/50 dark:border-blue-500/50"
        )}
      >
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 dark:from-blue-400/0 dark:via-blue-400/5 dark:to-blue-400/0"
          initial={{ x: '-100%' }}
          animate={{ 
            x: isHovered || isOpen ? '100%' : '-100%',
          }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />
        
        <motion.div
          className="absolute inset-0 rounded-xl opacity-0"
          animate={{
            opacity: isOpen ? 1 : 0,
            boxShadow: isOpen 
              ? '0 0 20px rgba(59, 130, 246, 0.15), inset 0 0 20px rgba(59, 130, 246, 0.05)' 
              : '0 0 0px rgba(59, 130, 246, 0)'
          }}
          transition={{ duration: 0.3 }}
        />
        
        <div className="relative flex items-center gap-2 text-gray-700 dark:text-gray-200 truncate z-10">
          {icon && <span className="text-gray-400 dark:text-gray-500">{icon}</span>}
          {selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              {selectedOption.icon && <span className="text-gray-500">{selectedOption.icon}</span>}
              <span className="font-medium">{selectedOption.label}</span>
            </div>
          ) : (
            <span className="text-gray-400 dark:text-gray-500">{placeholder}</span>
          )}
        </div>
        
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="relative z-10"
        >
          <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500" />
        </motion.div>
      </motion.button>

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
              initial={{ opacity: 0, y: -10, scale: 0.95, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, scale: 0.95, filter: "blur(4px)" }}
              transition={{ 
                duration: 0.2, 
                ease: [0.16, 1, 0.3, 1],
              }}
              className="absolute z-50 w-full mt-2 overflow-hidden rounded-xl"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent dark:from-blue-400/5 pointer-events-none" />
                
                <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50 shadow-2xl shadow-black/5 dark:shadow-black/20 rounded-xl overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent dark:via-blue-400/30" />
                  
                  <div className="p-1.5 max-h-60 overflow-y-auto">
                    {options.map((option, index) => (
                      <motion.button
                        key={option.value}
                        onClick={() => {
                          onChange(option.value);
                          setIsOpen(false);
                        }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ 
                          delay: index * 0.03,
                          duration: 0.15,
                          ease: "easeOut"
                        }}
                        whileHover={{ x: 4 }}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-all duration-200 relative overflow-hidden",
                          "hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent dark:hover:from-blue-900/20 dark:hover:to-transparent",
                          value === option.value
                            ? "bg-gradient-to-r from-blue-100/80 via-blue-50/50 to-transparent dark:from-blue-900/30 dark:via-blue-900/10 dark:to-transparent text-blue-700 dark:text-blue-300 font-medium"
                            : "text-gray-700 dark:text-gray-300"
                        )}
                      >
                        <div className="flex items-center gap-2.5 truncate relative z-10">
                          {option.icon && (
                            <motion.span
                              whileHover={{ scale: 1.2, rotate: 10 }}
                              className="text-base"
                            >
                              {option.icon}
                            </motion.span>
                          )}
                          <span>{option.label}</span>
                        </div>
                        
                        <AnimatePresence>
                          {value === option.value && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                            >
                              <Check className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    ))}
                    
                    {options.length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500 text-center">
                        No options available
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-200/50 to-transparent dark:via-slate-700/50" />
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
