"use client";

import React, { useEffect } from "react";
interface KeyboardShortcutsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onToggleMode: () => void;
  onToggleLock: () => void;
  onToggleHelp: () => void;
}
const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  onZoomIn,
  onZoomOut,
  onReset,
  onToggleMode,
  onToggleLock,
  onToggleHelp
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      switch (e.key) {
        case "+":
        case "=":
          onZoomIn();
          break;
        case "-":
          onZoomOut();
          break;
        case "r":
        case "R":
          onReset();
          break;
        case "m":
        case "M":
          onToggleMode();
          break;
        case "l":
        case "L":
          onToggleLock();
          break;
        case "?":
        case "h":
        case "H":
          onToggleHelp();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onZoomIn, onZoomOut, onReset, onToggleMode, onToggleLock, onToggleHelp]);
  return null; // This component doesn't render anything
};
export default KeyboardShortcuts;