"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
interface AFrameWrapperProps {
  children?: React.ReactNode;
}

// Create a global context to provide A-Frame loading status
export const AFrameContext = createContext<{
  isAFrameLoaded: boolean;
  aframeInstance: any;
}>({
  isAFrameLoaded: false,
  aframeInstance: null,
});
const AFrameWrapper: React.FC<AFrameWrapperProps> = ({ children }) => {
  // State will now be updated by the global script loading in layout.tsx
  const [isAFrameLoaded, setIsAFrameLoaded] = useState<boolean>(
    typeof window !== "undefined" && !!window.AFRAME,
  );
  const [aframeInstance, setAframeInstance] = useState<any>(
    typeof window !== "undefined" ? window.AFRAME : null,
  );

  // Effect to listen for A-Frame being loaded (if not already)
  useEffect(() => {
    if (isAFrameLoaded) return;

    const checkAFrame = () => {
      if (typeof window !== "undefined" && window.AFRAME) {
        console.log("A-Frame detected by AFrameWrapper");
        setAframeInstance(window.AFRAME);
        setIsAFrameLoaded(true);
        // Clear the interval once A-Frame is loaded
        clearInterval(intervalId);
      }
    };

    // Check immediately and set up an interval for backup
    checkAFrame();
    const intervalId = setInterval(checkAFrame, 100); // Check every 100ms

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [isAFrameLoaded]); // Re-run if isAFrameLoaded changes (though it shouldn't after first load)

  return (
    <AFrameContext.Provider
      value={{
        isAFrameLoaded,
        aframeInstance,
      }}
    >
      {children}
    </AFrameContext.Provider>
  );
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
