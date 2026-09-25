// Haptic feedback trigger for mobile touch interactions and app feel
export function triggerHaptic(type: 'light' | 'medium' | 'success' = 'light') {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) return;

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(8);
        break;
      case 'medium':
        navigator.vibrate(18);
        break;
      case 'success':
        navigator.vibrate([12, 40, 15]);
        break;
    }
  } catch {
    // Vibration ignored if blocked by permissions
  }
}
