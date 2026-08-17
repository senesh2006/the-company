"use client";

import React, { useState } from "react";
import { Maximize2, X, Image as ImageIcon } from "lucide-react";

export interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  base64?: string;
  mediaType?: string;
  uint8Array?: Uint8Array;
  src?: string;
  alt?: string;
  className?: string;
  caption?: string;
  allowZoom?: boolean;
}

export function Image({
  base64,
  mediaType = "image/jpeg",
  uint8Array,
  src: rawSrc,
  alt = "AI generated deliverable",
  className = "",
  caption,
  allowZoom = true,
  ...props
}: ImageProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [hasError, setHasError] = useState(false);

  let computedSrc = rawSrc || "";

  if (base64) {
    if (base64.startsWith("data:")) {
      computedSrc = base64;
    } else {
      computedSrc = `data:${mediaType};base64,${base64}`;
    }
  } else if (uint8Array && uint8Array.length > 0) {
    try {
      const blob = new Blob([uint8Array as any], { type: mediaType });
      computedSrc = URL.createObjectURL(blob);
    } catch {
      // Fallback
    }
  }

  if (!computedSrc || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-6 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 ${className}`}
      >
        <ImageIcon className="w-8 h-8 text-slate-400 mb-1" />
        <span className="text-[11px] font-mono">Image artifact unavailable</span>
      </div>
    );
  }

  return (
    <>
      <div className="relative group inline-block max-w-full overflow-hidden rounded-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={computedSrc}
          alt={alt}
          onError={() => setHasError(true)}
          className={`object-cover rounded-xl transition-transform duration-300 group-hover:scale-[1.01] ${className}`}
          {...props}
        />

        {allowZoom && (
          <button
            type="button"
            onClick={() => setIsZoomed(true)}
            className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-900/90 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
            title="Expand image"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Lightbox Zoom Modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white shadow-lg transition-colors z-10"
            >
              <X className="w-4 h-4" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={computedSrc}
              alt={alt}
              className="max-h-[82vh] w-auto rounded-xl object-contain"
            />
            {caption && (
              <p className="text-xs text-slate-600 dark:text-slate-300 text-center p-2 font-mono">
                {caption}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
