import React, { useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export const MovingBorder = ({
  children,
  duration = 2000,
  className,
  containerClassName,
  borderClassName,
  as: Component = "button",
  ...otherProps
}: {
  children: React.ReactNode;
  duration?: number;
  className?: string;
  containerClassName?: string;
  borderClassName?: string;
  as?: any;
  [key: string]: any;
}) => {
  return (
    <Component
      className={cn(
        "relative overflow-hidden bg-transparent p-[1px] text-xl",
        containerClassName
      )}
      {...otherProps}
    >
      <div
        className={cn(
          "absolute inset-0 rounded-lg",
          borderClassName
        )}
        style={{
          background:
            "linear-gradient(var(--border-angle, 0deg), #3b82f6, #8b5cf6, #06b6d4, #3b82f6)",
          backgroundSize: "300% 300%",
          animation: `moving-border ${duration}ms linear infinite`,
        }}
      />
      <div
        className={cn(
          "relative flex h-full w-full items-center justify-center rounded-lg bg-slate-900/90 backdrop-blur-xl",
          className
        )}
      >
        {children}
      </div>
    </Component>
  );
};

export function MovingBorderButton({
  children,
  className,
  containerClassName,
  duration = 2000,
  onClick,
  type = "button",
  disabled = false,
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  duration?: number;
  onClick?: (e: React.MouseEvent) => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative group inline-flex h-12 overflow-hidden rounded-xl p-[2px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed",
        containerClassName
      )}
    >
      <span
        className="absolute inset-[-1000%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#3b82f6_0%,#8b5cf6_25%,#06b6d4_50%,#3b82f6_100%)]"
      />
      <span
        className={cn(
          "inline-flex h-full w-full cursor-pointer items-center justify-center rounded-xl bg-slate-900 px-6 py-2 text-sm font-medium text-white backdrop-blur-3xl transition-all duration-300 group-hover:bg-slate-800",
          className
        )}
      >
        {children}
      </span>
    </button>
  );
}
