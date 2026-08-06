"use client";

import { motion, AnimatePresence, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { easings, durations, fadeInUp, fadeInScale, pressable, pressableSmall } from "@/lib/motion";
import { ReactNode } from "react";

export { AnimatePresence };

export function MotionDiv({ className, ...props }: HTMLMotionProps<"div">) {
  return <motion.div className={className} {...props} />;
}

export function FadeIn({
  children,
  className,
  delay = 0,
  direction = "up",
  ...props
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "none";
} & HTMLMotionProps<"div">) {
  const y = direction === "up" ? 12 : direction === "down" ? -12 : 0;
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: direction === "up" ? 8 : -8 }}
      transition={{
        duration: durations.normal,
        ease: easings.easeOutExpo,
        delay,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
} & HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={{
        animate: {
          transition: {
            staggerChildren: 0.04,
            delayChildren: 0.02,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
} & HTMLMotionProps<"div">) {
  return (
    <motion.div
      variants={{
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 6 },
      }}
      transition={{ duration: durations.normal, ease: easings.easeOutExpo }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function MotionCard({
  children,
  className,
  hover = true,
  ...props
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
} & HTMLMotionProps<"div">) {
  return (
    <motion.div
      className={cn(
        "rounded-2xl bg-surface/90 backdrop-blur-xl border border-outline/80 shadow-sm",
        hover && "hover:shadow-md hover:border-primary/20",
        className
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -2, transition: { duration: 0.2, ease: easings.easeOutExpo } } : undefined}
      transition={{ duration: durations.normal, ease: easings.easeOutExpo }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function SpringButton({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}: {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const variantStyles = {
    primary: "bg-primary text-on-primary hover:bg-primary/90 shadow-sm shadow-primary/20",
    secondary: "bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline",
    outline: "bg-surface/80 text-on-surface border border-outline hover:bg-surface-container",
    ghost: "bg-transparent text-on-surface hover:bg-surface-container",
    danger: "bg-error text-on-error hover:bg-error/90 shadow-sm shadow-error/20",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs rounded-xl",
    md: "px-4 py-2.5 text-xs rounded-xl",
    lg: "px-6 py-3 text-sm rounded-xl",
  };

  return (
    <motion.button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
      transition={easings.springTight}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function GlassPanel({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
} & HTMLMotionProps<"div">) {
  return (
    <motion.div
      className={cn(
        "bg-surface/80 backdrop-blur-xl border border-outline/80 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function Modal({
  isOpen,
  onClose,
  children,
  className,
  title,
  description,
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  description?: string;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: durations.fast }}
        >
          <motion.div
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className={cn(
              "relative w-full max-w-lg bg-surface rounded-3xl border border-outline/90 shadow-2xl p-6 md:p-8 z-10",
              className
            )}
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            transition={{ duration: durations.normal, ease: easings.easeOutExpo }}
            onClick={(e) => e.stopPropagation()}
          >
            {(title || description) && (
              <div className="mb-5">
                {title && <h3 className="text-lg font-bold text-on-background">{title}</h3>}
                {description && <p className="text-xs text-on-surface-variant mt-1">{description}</p>}
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Drawer({
  isOpen,
  onClose,
  children,
  className,
  side = "right",
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  side?: "right" | "left";
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: durations.fast }}
        >
          <motion.div
            className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className={cn(
              "relative h-full bg-surface border-outline shadow-2xl overflow-y-auto z-10",
              side === "right" ? "ml-auto border-l" : "mr-auto border-r",
              className
            )}
            initial={{ x: side === "right" ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: side === "right" ? "100%" : "-100%" }}
            transition={{ duration: durations.slow, ease: easings.easeOutExpo }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number | string;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const numeric = typeof value === "string" ? parseFloat(value.replace(/[^0-9.]/g, "")) || 0 : value;
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: durations.fast, ease: easings.easeOutExpo }}
      className={className}
    >
      {prefix}
      {numeric}
      {suffix}
    </motion.span>
  );
}

export function PresenceFade({
  isOpen,
  children,
  className,
}: {
  isOpen: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: durations.fast }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
