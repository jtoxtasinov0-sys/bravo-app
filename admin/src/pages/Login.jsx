// Kirish: login/parol yoki Telegram ichidan ochilsa — avtomatik
import { useEffect, useState } from 'react';
import { api, setToken } from '../lib/api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [tgTrying, setTgTrying] = useState(false);

  // Telegram ichida bo'lsa — parolsiz kirishga urinamiz
  useEffect(() => {
    const initData = window.Telegram?.WebApp?.initData;
    if (!initData) return;
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
    setTgTrying(true);
    api
      .post('/login/telegram', { initData })
      .then((r) => {
        setToken(r.token);
        onLogin();
      })
      .catch((e) => setErr(e.message))
      .finally(() => setTgTrying(false));
  }, [onLogin]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const r = await api.post('/login', { username, password });
      setToken(r.token);
      onLogin();
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="login card" onSubmit={submit}>
        <img src={import.meta.env.BASE_URL + 'logo.svg'} alt="" className="login-logo" />
        <h1>Bravo — Admin panel</h1>
        {tgTrying && <p className="muted">Telegram orqali kirilmoqda…</p>}
        <label className="field">
          <span>Login</span>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </label>
        <label className="field">
          <span>Parol</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </label>
        {err && <div className="notice notice-err">{err}</div>}
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Kirilmoqda…' : 'Kirish'}
        </button>
      </form>
    </div>
  );
}
