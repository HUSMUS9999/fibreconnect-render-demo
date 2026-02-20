import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export const CardHoverEffect = ({
  items,
  className,
}: {
  items: {
    title: string;
    description: string;
    value: string | number;
    icon?: React.ReactNode;
    color?: string;
    subtitle?: string;
    subtitleColor?: string;
    trend?: "up" | "down";
    onClick?: () => void;
  }[];
  className?: string;
}) => {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {items.map((item, idx) => (
        <div
          key={idx}
          className={cn(
            "relative group block h-full w-full",
            item.onClick ? "cursor-pointer" : ""
          )}
          onClick={item.onClick}
        >
          <GlowCard
            title={item.title}
            description={item.description}
            value={item.value}
            icon={item.icon}
            color={item.color}
            subtitle={item.subtitle}
            subtitleColor={item.subtitleColor}
            trend={item.trend}
          />
        </div>
      ))}
    </div>
  );
};

export const GlowCard = ({
  title,
  description,
  value,
  icon,
  color = "blue",
  subtitle,
  subtitleColor,
  trend,
  className,
  children,
}: {
  title?: string;
  description?: string;
  value?: string | number;
  icon?: React.ReactNode;
  color?: string;
  subtitle?: string;
  subtitleColor?: string;
  trend?: "up" | "down";
  className?: string;
  children?: React.ReactNode;
}) => {
  const gradientColors: Record<string, string> = {
    blue: "from-blue-500/20 via-transparent to-transparent",
    amber: "from-amber-500/20 via-transparent to-transparent",
    emerald: "from-emerald-500/20 via-transparent to-transparent",
    red: "from-red-500/20 via-transparent to-transparent",
    purple: "from-purple-500/20 via-transparent to-transparent",
    cyan: "from-cyan-500/20 via-transparent to-transparent",
  };

  const iconBgColors: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-500",
    amber: "bg-amber-500/10 text-amber-500",
    emerald: "bg-emerald-500/10 text-emerald-500",
    red: "bg-red-500/10 text-red-500",
    purple: "bg-purple-500/10 text-purple-500",
    cyan: "bg-cyan-500/10 text-cyan-500",
  };

  return (
    <motion.div
      className={cn(
        "relative h-full overflow-hidden rounded-2xl border border-gray-200/80 dark:border-white/[0.1] bg-white dark:bg-slate-900 shadow-sm group-hover:shadow-lg transition-shadow duration-300",
        className
      )}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      {/* Top gradient glow */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", gradientColors[color] || gradientColors.blue)} />
      
      <div className="relative p-5 h-full flex flex-col">
        {children ? (
          children
        ) : (
          <>
            <div className="flex items-start justify-between mb-3">
              {icon && (
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconBgColors[color] || iconBgColors.blue)}>
                  {icon}
                </div>
              )}
              {trend && (
                <div className={cn("flex items-center gap-0.5 text-xs px-2 py-1 rounded-full", 
                  trend === "up" ? "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/15" : "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/15"
                )}>
                  {trend === "up" ? "+" : "-"}
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description || title}</p>
              {subtitle ? (
                <p className={cn("text-xs mt-1", subtitleColor === "red" ? "text-red-500" : "text-gray-400")}>{subtitle}</p>
              ) : (
                <div className="h-4 mt-1" />
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  children,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) => {
  return (
    <motion.div
      className={cn(
        "row-span-1 rounded-2xl group/bento hover:shadow-xl transition duration-200 shadow-sm border border-gray-200 dark:border-white/[0.1] bg-white dark:bg-slate-900 p-4 flex flex-col overflow-hidden",
        className
      )}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      {header && <div className="flex-1 w-full min-h-[6rem] overflow-hidden">{header}</div>}
      <div className="mt-2">
        {icon && <div className="mb-2">{icon}</div>}
        {title && (
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1 truncate">
            {title}
          </h3>
        )}
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      {children}
    </motion.div>
  );
};
