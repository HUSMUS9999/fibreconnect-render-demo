import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";

interface SidebarLink {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = React.createContext<SidebarContextProps>({
  open: false,
  setOpen: () => {},
  animate: true,
});

export const useSidebar = () => React.useContext(SidebarContext);

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const { open, animate } = useSidebar();

  return (
    <motion.aside
      animate={{
        width: animate ? (open ? "256px" : "72px") : "256px",
      }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={cn(
        "relative flex flex-col h-screen overflow-hidden transition-colors duration-300",
        // Light mode: clean white sidebar
        "bg-white border-r border-gray-200/80",
        // Dark mode: dark sidebar
        "dark:bg-gray-900 dark:border-gray-800",
        className
      )}
    >
      {children}
    </motion.aside>
  );
};

export const SidebarLink = ({
  link,
  className,
  isActive,
  onClick,
}: {
  link: SidebarLink;
  className?: string;
  isActive?: boolean;
  onClick?: () => void;
}) => {
  const { open, animate } = useSidebar();

  return (
    <Link
      to={link.href}
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-3 py-2.5 px-3 mx-2 rounded-xl group transition-all duration-200",
        isActive
          ? "text-blue-700 dark:text-white"
          : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white",
        className
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active"
          className="absolute inset-0 bg-gradient-to-r from-blue-500/15 to-blue-400/10 dark:from-blue-600/80 dark:to-blue-500/50 rounded-xl border border-blue-200/50 dark:border-transparent"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      
      {/* Hover background */}
      {!isActive && (
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-gray-100 dark:bg-white/[0.05] transition-opacity duration-200" />
      )}

      <span className="relative z-10 flex-shrink-0 w-5 h-5">
        {link.icon}
      </span>

      <AnimatePresence>
        {open && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="relative z-10 text-sm font-medium whitespace-nowrap overflow-hidden"
          >
            {link.label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
};

export const SidebarLogo = ({
  icon,
  title,
  subtitle,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  className?: string;
}) => {
  const { open } = useSidebar();

  return (
    <div className={cn("flex items-center gap-3 px-3 py-5 mx-2", className)}>
      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
        {icon}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <h1 className="text-sm font-bold text-gray-900 dark:text-white whitespace-nowrap">{title}</h1>
            {subtitle && (
              <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{subtitle}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const SidebarUserInfo = ({
  name,
  role,
  avatar,
  className,
}: {
  name: string;
  role: string;
  avatar: React.ReactNode;
  className?: string;
}) => {
  const { open } = useSidebar();

  return (
    <div className={cn("flex items-center gap-3 px-3 py-4 mx-2 border-t border-gray-200/80 dark:border-gray-800", className)}>
      <div className="flex-shrink-0">{avatar}</div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate whitespace-nowrap">{name}</p>
            <p className="text-xs text-gray-500 truncate whitespace-nowrap">{role}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
