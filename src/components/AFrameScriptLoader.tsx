"use client";

import Script from "next/script";
import React from "react";

const AFrameScriptLoader: React.FC = () => {
  return (
    <Script
      src="https://aframe.io/releases/1.4.0/aframe.min.js"
      strategy="beforeInteractive" // Load before page becomes interactive
      onLoad={() => {
        console.log("A-Frame script loaded via AFrameScriptLoader.");
        // Optional: Dispatch a custom event if needed elsewhere
        // window.dispatchEvent(new CustomEvent('aframe-loaded'));
      }}
      onError={(e) => {
        console.error("A-Frame script failed to load:", e);
      }}
    />
  );
};

export default AFrameScriptLoader;
