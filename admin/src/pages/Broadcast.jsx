// Rassilka: matn + ixtiyoriy rasm. Avval "Sinov" — faqat adminlarga
import { useEffect, useRef, useState } from 'react';
import { api, imgUrl } from '../lib/api';

export default function Broadcast() {
  const [text, setText] = useState('');
  const [image, setImage] = useState('');
  const [st, setSt] = useState(null);
  const [tested, setTested] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const poll = () => api.get('/broadcast').then(setSt).catch(() => {});
  useEffect(() => {
    poll();
    const t = setInterval(poll, 2000);
    return () => clearInterval(t);
  }, []);

  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      setImage((await api.upload('broadcast', file)).url);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const send = async (test) => {
    if (!test && !confirm('Xabar BARCHA mijozlarga yuboriladi. Davom etasizmi?')) return;
    try {
      setSt(await api.post('/broadcast', { text, image: image || null, test }));
      if (test) setTested(true);
    } catch (e) {
      alert(e.message);
    }
  };

  const pct = st && st.total ? Math.round(((st.sent + st.failed) / st.total) * 100) : 0;

  return (
    <div>
      <div className="page-head">
        <h1>Rassilka</h1>
      </div>
      <div className="two-col">
        <div className="card pad">
          <label className="field">
            <span>Xabar matni</span>
            <textarea rows={7} value={text} onChange={(e) => setText(e.target.value)} placeholder="Yangi kolleksiya keldi! 🔥" />
          </label>
          <div className="label">Rasm (ixtiyoriy)</div>
          <div className="row gap8">
            {image ? (
              <>
                <img className="bc-img" src={imgUrl(image)} alt="" />
                <button className="btn btn-light btn-sm" onClick={() => setImage('')}>
                  Olib tashlash
                </button>
              </>
            ) : (
              <button className="btn btn-light btn-sm" disabled={busy} onClick={() => fileRef.current?.click()}>
                {busy ? 'Yuklanmoqda…' : '+ Rasm tanlash'}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
          </div>
          <div className="row gap8 mt16">
            <button className="btn btn-light" disabled={!text.trim() || st?.running} onClick={() => send(true)}>
              🧪 Sinov (faqat adminlarga)
            </button>
            <button className="btn btn-primary" disabled={!text.trim() || !tested || st?.running} onClick={() => send(false)}>
              📣 Hammaga yuborish
            </button>
          </div>
          {!tested && <p className="muted small">Avval sinov yuboring — xabar qanday ko'rinishini tekshiring.</p>}
        </div>

        <div className="card pad">
          <h3>Holat</h3>
          {st && st.total > 0 ? (
            <>
              <div className="progress">
                <i style={{ width: pct + '%' }} />
              </div>
              <p>
                {st.running ? '⏳ Yuborilmoqda…' : '✅ Tugadi'} {st.test && '(sinov)'}
                <br />
                Yuborildi: <b>{st.sent}</b> · Xato: <b>{st.failed}</b> · Jami: <b>{st.total}</b>
              </p>
              <p className="muted small">Xato — odatda botni bloklagan foydalanuvchilar.</p>
            </>
          ) : (
            <p className="muted">Hali rassilka yuborilmagan.</p>
          )}
        </div>
      </div>
    </div>
  );
}
