// Telegram WebApp bilan ishlash (brauzerda ochilsa ham xato bermaydi)
export const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;

export const inTelegram = () => !!(tg && tg.initData);
export const initData = () => (tg && tg.initData) || '';
export const tgUser = () => tg?.initDataUnsafe?.user || null;

export function initTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();
  try {
    tg.setHeaderColor('#ffffff');
    tg.setBackgroundColor('#ffffff');
    tg.disableVerticalSwipes?.();
  } catch {
    /* eski versiyalar */
  }
}

// Titrash (haptic)
export const haptic = {
  tap: () => tg?.HapticFeedback?.impactOccurred('light'),
  success: () => tg?.HapticFeedback?.notificationOccurred('success'),
  error: () => tg?.HapticFeedback?.notificationOccurred('error'),
  select: () => tg?.HapticFeedback?.selectionChanged(),
};


export function openLink(url) {
  if (tg?.openLink) tg.openLink(url);
  else window.open(url, '_blank');
}

export function openTgLink(url) {
  if (tg?.openTelegramLink) tg.openTelegramLink(url);
  else window.open(url, '_blank');
}
