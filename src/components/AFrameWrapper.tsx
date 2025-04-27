"use client";

import React, { useEffect, useState, createContext, useContext } from "react";
interface AFrameWrapperProps {
  children?: React.ReactNode;
}

// Create a global context to provide A-Frame loading status
export const AFrameContext = createContext<{
  isAFrameLoaded: boolean;
  aframeInstance: any;
}>({
  isAFrameLoaded: false,
  aframeInstance: null
});
const AFrameWrapper: React.FC<AFrameWrapperProps> = ({
  children
}) => {
  const [isAFrameLoaded, setIsAFrameLoaded] = useState<boolean>(false);
  const [aframeInstance, setAframeInstance] = useState<any>(null);
  useEffect(() => {
    // Prevent multiple loading attempts
    if (isAFrameLoaded) return;

    // Define a global variable to store the AFRAME object
    if (typeof window !== 'undefined') {
      // Create a script element to load A-Frame
      const script = document.createElement('script');
      script.src = 'https://aframe.io/releases/1.4.0/aframe.min.js';
      script.async = true;
      script.onload = () => {
        // When script is loaded, AFRAME global will be available
        if (typeof window.AFRAME !== 'undefined') {
          setAframeInstance(window.AFRAME);
          setIsAFrameLoaded(true);
          console.log("A-Frame loaded successfully via script tag");
        }
      };
      script.onerror = err => {
        console.error("Failed to load A-Frame via script tag:", err);

        // Fallback to dynamic import if script tag fails
        import("aframe").then(aframe => {
          setAframeInstance(aframe);
          setIsAFrameLoaded(true);
          console.log("A-Frame loaded successfully via dynamic import");
        }).catch(importErr => {
          console.error("Failed to load A-Frame via dynamic import:", importErr);
        });
      };
      document.head.appendChild(script);
      return () => {
        // Cleanup script tag if component unmounts during loading
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
      };
    }
  }, [isAFrameLoaded]);
  return <AFrameContext.Provider value={{
    isAFrameLoaded,
    aframeInstance
  }}>
      {children}
    </AFrameContext.Provider>;
};

// Custom hook to access A-Frame context
export const useAFrame = () => {
  const context = useContext(AFrameContext);
  if (context === undefined) {
    throw new Error("useAFrame must be used within an AFrameWrapper");
  }
  return context;
};

// Add TypeScript declaration for the global AFRAME object
declare global {
  interface Window {
    AFRAME: any;
  }
}
export default AFrameWrapper;