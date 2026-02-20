import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export const AnimatedTabs = ({
  tabs,
  activeTab,
  onChange,
  className,
  tabClassName,
}: {
  tabs: { id: string; label: string; icon?: React.ReactNode; count?: number }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
  tabClassName?: string;
}) => {
  return (
    <div className={cn("flex items-center gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 flex items-center gap-2",
            activeTab === tab.id
              ? "text-gray-900 dark:text-white"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300",
            tabClassName
          )}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                activeTab === tab.id
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
                  : "bg-gray-200 text-gray-600 dark:bg-slate-600 dark:text-gray-400"
              )}>
                {tab.count}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
};

export const GlowingTabs = ({
  tabs,
  activeTab,
  onChange,
  className,
}: {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className="relative"
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="glowTab"
              className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg"
              transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
            />
          )}
          <span
            className={cn(
              "relative z-10 flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
              activeTab === tab.id
                ? "text-white"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            )}
          >
            {tab.icon}
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
};
