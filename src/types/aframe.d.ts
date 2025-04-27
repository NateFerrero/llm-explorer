declare module 'aframe' {
  const AFRAME: any;
  export default AFRAME;
}

// Declare global AFRAME object
declare global {
  interface Window {
    AFRAME: any;
  }
}
