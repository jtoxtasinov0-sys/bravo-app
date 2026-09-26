// Umumiy holat: sozlamalar, foydalanuvchi, til, savatcha
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api';
import { DICT } from './i18n';
import { tgUser } from './telegram';

const Ctx = createContext(null);

const load = (k, d) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : d;
  } catch {
    return d;
  }
};
const save = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* xotira yopiq bo'lishi mumkin */
  }
};

// Savatcha elementi kaliti: mahsulot + rang
export const cartKey = (productId, color) => `${productId}|${color || ''}`;

export function StoreProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [user, setUser] = useState(null);
  const [demo, setDemo] = useState(false);
  const [products, setProducts] = useState([]);
  const [stories, setStories] = useState([]);
  const [lang, setLangState] = useState(() => load('bravo_lang', tgUser()?.language_code === 'ru' ? 'ru' : 'uz'));
  // Eski (optom) elementlar savatchadan olib tashlanadi
  const [cart, setCart] = useState(() => load('bravo_cart', []).filter((x) => x.sizeQty && x.mode !== 'wholesale'));
  const [error, setError] = useState(null);

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      const [cfg, me, prods, st] = await Promise.all([
        api.get('/config'),
        api.get('/me'),
        api.get('/products'),
        api.get('/stories').catch(() => []),
      ]);
      setConfig(cfg);
      setUser(me.user);
      setDemo(me.demo);
      setProducts(prods);
      setStories(st);
      if (!localStorage.getItem('bravo_lang') && me.user?.lang) setLangState(me.user.lang);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    save('bravo_cart', cart);
  }, [cart]);

  const setLang = (l) => {
    setLangState(l);
    save('bravo_lang', l);
    api.patch('/me', { lang: l }).catch(() => {});
  };

  const addToCart = (item) =>
    setCart((c) => {
      const key = cartKey(item.productId, item.color);
      const ex = c.find((x) => x.key === key);
      if (!ex) return [...c, { ...item, key }];
      return c.map((x) => {
        if (x.key !== key) return x;
        const sizeQty = { ...x.sizeQty };
        for (const [s, q] of Object.entries(item.sizeQty || {})) sizeQty[s] = (sizeQty[s] || 0) + q;
        return { ...x, sizeQty };
      });
    });

  const updateCartItem = (key, patch) => setCart((c) => c.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const removeFromCart = (key) => setCart((c) => c.filter((x) => x.key !== key));
  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((a, x) => a + Object.values(x.sizeQty || {}).reduce((s, q) => s + q, 0), 0);

  const t = DICT[lang] || DICT.uz;

  const value = {
    config,
    user,
    setUser,
    demo,
    products,
    stories,
    lang,
    setLang,
    t,
    cart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    cartCount,
    error,
    reload: loadAll,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);
