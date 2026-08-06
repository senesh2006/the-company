"use client";

import { ReactNode } from "react";
import { MotionConfig } from "framer-motion";

export function FramerProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 28,
      }}
    >
      {children}
    </MotionConfig>
  );
}
