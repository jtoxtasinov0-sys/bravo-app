// Telegram "Orqaga" tugmasi uchun stek: eng ustdagi oyna yopiladi
import { useEffect, useRef } from 'react';
import { tg } from './telegram';

const stack = [];

function onClick() {
  const top = stack[stack.length - 1];
  if (top) top.current();
}

function sync() {
  if (!tg?.BackButton) return;
  if (stack.length) tg.BackButton.show();
  else tg.BackButton.hide();
}

if (tg?.BackButton) tg.BackButton.onClick(onClick);

// Komponent ochiq turganda "Orqaga" bosilsa — onBack chaqiriladi
export function useBack(onBack, active = true) {
  const ref = useRef(onBack);
  ref.current = onBack;
  useEffect(() => {
    if (!active) return;
    stack.push(ref);
    sync();
    return () => {
      const i = stack.indexOf(ref);
      if (i >= 0) stack.splice(i, 1);
      sync();
    };
  }, [active]);
}
