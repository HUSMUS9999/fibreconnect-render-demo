import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export const Timeline = ({
  items,
  className,
}: {
  items: {
    title: string;
    description?: string;
    time?: string;
    icon?: React.ReactNode;
    color?: string;
    content?: React.ReactNode;
  }[];
  className?: string;
}) => {
  return (
    <div className={cn("relative", className)}>
      {/* Line */}
      <div className="absolute left-[18px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-blue-500 via-purple-500 to-gray-200 dark:to-gray-700" />
      
      <div className="space-y-6">
        {items.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
            className="relative flex gap-4"
          >
            {/* Dot */}
            <div className="relative z-10 flex-shrink-0">
              <div className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm",
                item.color || "bg-blue-500"
              )}>
                {item.icon ? (
                  <span className="text-white w-4 h-4">{item.icon}</span>
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-white" />
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 pb-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {item.title}
                </h4>
                {item.time && (
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {item.time}
                  </span>
                )}
              </div>
              {item.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {item.description}
                </p>
              )}
              {item.content && (
                <div className="mt-2">{item.content}</div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
