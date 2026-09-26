// Rasm manzili: "/uploads/..." -> backend manzili bilan
import { API_URL } from './api';

export const imgUrl = (u) => {
  if (!u) return '/logo.svg';
  if (/^(https?:|data:|blob:)/.test(u)) return u;
  return API_URL + u;
};
