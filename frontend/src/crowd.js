// One place that defines the four crowd levels (label + colour + symbol, so colour is never the only cue).
export const LEVELS = {
  LOW:         { label: 'Low',         color: '#1b7f3b', symbol: '●' },
  MODERATE:    { label: 'Moderate',    color: '#8a6d00', symbol: '●●' },
  HIGH:        { label: 'High',        color: '#c2570c', symbol: '●●●' },
  OVERCROWDED: { label: 'Overcrowded', color: '#b3261e', symbol: '●●●●' },
};
export const levelKey = (v) => String(v || '').toUpperCase();
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
