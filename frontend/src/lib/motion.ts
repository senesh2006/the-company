// Motion design tokens based on the Emil Kowalski / Apple design-engineering skill set.
// Springs are used for layout/value changes; custom easing is used for entrances/exits.

export const easings = {
  // The classic Apple "ease-out" feel: fast start, long, smooth deceleration.
  easeOutExpo: [0.16, 1, 0.3, 1] as const,
  // Snappier entrance for UI elements.
  easeOutQuart: [0.25, 1, 0.5, 1] as const,
  // For dismissing / exiting: accelerate out.
  easeInExpo: [0.7, 0, 0.84, 0] as const,
  // For shared-element transitions.
  easeInOutQuint: [0.83, 0, 0.17, 1] as const,
  // Bouncy but not toy-like.
  spring: { type: "spring", stiffness: 300, damping: 28 } as const,
  // Gentle spring for large layout shifts.
  springSoft: { type: "spring", stiffness: 220, damping: 26 } as const,
  // Tight spring for buttons / toggles.
  springTight: { type: "spring", stiffness: 400, damping: 30 } as const,
};

export const durations = {
  instant: 0.12,
  fast: 0.18,
  normal: 0.25,
  slow: 0.35,
  page: 0.4,
};

export const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
  transition: { duration: durations.normal, ease: easings.easeOutExpo },
};

export const fadeInScale = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
  transition: { duration: durations.normal, ease: easings.easeOutExpo },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: durations.normal, ease: easings.easeOutExpo },
};

export const pressable = {
  whileHover: { scale: 1.01 },
  whileTap: { scale: 0.97 },
  transition: easings.springTight,
};

export const pressableSmall = {
  whileHover: { scale: 1.03 },
  whileTap: { scale: 0.94 },
  transition: easings.springTight,
};
