import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";

export const BackgroundGradientAnimation = ({
  children,
  className,
  containerClassName,
  gradientBackgroundStart = "rgb(15, 23, 42)",
  gradientBackgroundEnd = "rgb(30, 41, 59)",
  firstColor = "59, 130, 246",
  secondColor = "139, 92, 246",
  thirdColor = "6, 182, 212",
  fourthColor = "16, 185, 129",
  fifthColor = "236, 72, 153",
  pointerColor = "59, 130, 246",
  size = "80%",
  blendingValue = "hard-light",
}: {
  children?: React.ReactNode;
  className?: string;
  containerClassName?: string;
  gradientBackgroundStart?: string;
  gradientBackgroundEnd?: string;
  firstColor?: string;
  secondColor?: string;
  thirdColor?: string;
  fourthColor?: string;
  fifthColor?: string;
  pointerColor?: string;
  size?: string;
  blendingValue?: string;
}) => {
  return (
    <div
      className={cn(
        "relative min-h-screen w-full overflow-hidden",
        containerClassName
      )}
      style={{
        background: `linear-gradient(135deg, ${gradientBackgroundStart}, ${gradientBackgroundEnd})`,
      }}
    >
      <svg className="hidden">
        <defs>
          <filter id="blurMe">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -8"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>
      <div className="absolute inset-0" style={{ filter: "url(#blurMe) blur(40px)" }}>
        {/* Animated gradient blobs */}
        <motion.div
          className="absolute rounded-full opacity-30"
          style={{
            background: `radial-gradient(circle at center, rgba(${firstColor}, 0.8) 0%, transparent 50%)`,
            width: size,
            height: size,
            top: "-10%",
            left: "-10%",
            mixBlendMode: blendingValue as any,
          }}
          animate={{
            x: [0, 100, 50, 0],
            y: [0, 50, 100, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute rounded-full opacity-30"
          style={{
            background: `radial-gradient(circle at center, rgba(${secondColor}, 0.8) 0%, transparent 50%)`,
            width: size,
            height: size,
            top: "10%",
            right: "-10%",
            mixBlendMode: blendingValue as any,
          }}
          animate={{
            x: [0, -100, -50, 0],
            y: [0, 100, 50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute rounded-full opacity-30"
          style={{
            background: `radial-gradient(circle at center, rgba(${thirdColor}, 0.8) 0%, transparent 50%)`,
            width: size,
            height: size,
            bottom: "-10%",
            left: "20%",
            mixBlendMode: blendingValue as any,
          }}
          animate={{
            x: [0, 50, -50, 0],
            y: [0, -100, -50, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute rounded-full opacity-20"
          style={{
            background: `radial-gradient(circle at center, rgba(${fourthColor}, 0.8) 0%, transparent 50%)`,
            width: "60%",
            height: "60%",
            bottom: "10%",
            right: "10%",
            mixBlendMode: blendingValue as any,
          }}
          animate={{
            x: [0, -80, 30, 0],
            y: [0, -60, 80, 0],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>
      {/* Noise overlay for texture */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />
      <div className={cn("relative z-10", className)}>
        {children}
      </div>
    </div>
  );
};

export const Meteors = ({ number = 20 }: { number?: number }) => {
  const meteors = new Array(number).fill(true);
  return (
    <>
      {meteors.map((_, idx) => (
        <span
          key={idx}
          className="animate-meteor absolute top-1/2 left-1/2 h-0.5 w-0.5 rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10] rotate-[215deg]"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100 - 40}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${Math.random() * 5 + 2}s`,
          }}
        >
          <div className="absolute top-1/2 -z-10 h-[1px] w-[50px] -translate-y-[50%] bg-gradient-to-r from-slate-500 to-transparent" />
        </span>
      ))}
    </>
  );
};

export const SparklesCore = ({
  className,
  background = "transparent",
  minSize = 0.4,
  maxSize = 1,
  particleCount = 50,
  particleColor = "#ffffff",
}: {
  className?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  particleCount?: number;
  particleColor?: string;
}) => {
  const particles = Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * (maxSize - minSize) + minSize,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 3,
  }));

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)} style={{ background }}>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size * 4}px`,
            height: `${particle.size * 4}px`,
            backgroundColor: particleColor,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};
