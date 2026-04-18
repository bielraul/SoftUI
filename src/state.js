export const state = {
  color: '#e6e9ef',
  size: 300,
  radius: 50,
  distance: 20,
  blur: 40,
  intensity: 0.15,
  shape: 'flat', // flat, concave, convex, pressed
  direction: 'bottom-right', // top-left, top-right, bottom-left, bottom-right
  isHighContrast: false,
  isCleanMode: false,
  fontSize: 16,
  user: null,
  userProfile: null,
  isAdmin: false,
  adminCriteria: [],
  adminConfigId: 'default-config',
  cloudDesigns: [],
  reduceMotion: false,
  isGrayscale: false,
  isUnderline: false,
  isBigCursor: false
};

export function updateState(newState) {
  Object.assign(state, newState);
}
