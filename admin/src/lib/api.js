// Admin API: token localStorage'da saqlanadi (30 kun)
const PROD_API_URL = 'https://bravo-backend.onrender.com'; // zaxira: Render manzili boshqacha bo'lsa — shu yerni yoki VITE_API_URL ni o'zgartiring
export const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? PROD_API_URL : '') || '').replace(/\/$/, '');

const TOKEN_KEY = 'bravo_admin_token';
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};
export const setToken = (t) => {
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* */
  }
};

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => (onUnauthorized = fn);

async function request(method, path, body, isForm = false) {
  // ngrok-skip-browser-warning — ngrok bepul rejasidagi ogohlantirish sahifasini chetlash
  const headers = { Authorization: 'Bearer ' + (getToken() || ''), 'ngrok-skip-browser-warning': '1' };
  if (body && !isForm) headers['Content-Type'] = 'application/json';
  let res;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      res = await fetch(API_URL + '/api/admin' + path, {
        method,
        headers,
        body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
      });
      if (![502, 503, 504].includes(res.status)) break;
    } catch (e) {
      if (attempt === 2) throw new Error("Serverga ulanib bo'lmadi");
    }
    await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && !path.startsWith('/login')) {
    setToken(null);
    onUnauthorized();
  }
  if (!res.ok) throw new Error(data.error || `Xato ${res.status}`);
  return data;
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b),
  put: (p, b) => request('PUT', p, b),
  patch: (p, b) => request('PATCH', p, b),
  del: (p) => request('DELETE', p),
  upload: (folder, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return request('POST', '/upload/' + folder, fd, true);
  },
};

export const imgUrl = (u) => (!u ? '' : /^(https?:|data:|blob:)/.test(u) ? u : API_URL + u);

export const money = (n) => `${Number(n || 0).toLocaleString('ru-RU').replace(/[ ,]/g, ' ')} so'm`;

export const date = (d) =>
  new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
