// Backend bilan aloqa. Server uxlab qolsa — 3 marta qayta urinadi
import { initData } from './telegram';

// Bo'sh bo'lsa — shu saytning o'zi (/api) ishlatiladi (lokal va ngrok uchun)
// Vercel'ga joylansa: .env.production da VITE_API_URL=https://xxx.onrender.com
const PROD_API_URL = 'https://bravo-backend.onrender.com'; // zaxira: Render manzili boshqacha bo'lsa — shu yerni yoki VITE_API_URL ni o'zgartiring
export const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? PROD_API_URL : '') || '').replace(/\/$/, '');

let wakingListener = null;
export const onWaking = (fn) => (wakingListener = fn);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function request(method, path, body, { retries = 3, isForm = false } = {}) {
  // ngrok bepul rejasidagi ogohlantirish sahifasi chiqmasligi uchun
  const headers = { 'X-Telegram-Init-Data': initData(), 'ngrok-skip-browser-warning': '1' };
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(API_URL + '/api' + path, {
        method,
        headers,
        body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
      });
      // 502/503/504 — server uyg'onmoqda
      if ([502, 503, 504].includes(res.status) && attempt < retries) throw new Error('waking');
      wakingListener?.(false);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = new Error(data.error || `Xato ${res.status}`);
        err.status = res.status;
        throw err;
      }
      return data;
    } catch (e) {
      if (e.status || attempt >= retries) {
        wakingListener?.(false);
        throw e;
      }
      wakingListener?.(true);
      await sleep(1500 * (attempt + 1));
    }
  }
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b, { retries: 1 }),
  patch: (p, b) => request('PATCH', p, b, { retries: 1 }),
  upload: (p, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return request('POST', p, fd, { retries: 1, isForm: true });
  },
};
