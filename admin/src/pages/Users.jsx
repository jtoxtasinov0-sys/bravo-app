// Mijozlar: botdan / Mini App'dan foydalanganlar
import { useEffect, useMemo, useState } from 'react';
import { api, date } from '../lib/api';

export default function Users() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState('');
  useEffect(() => {
    api.get('/users').then(setItems);
  }, []);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((u) =>
      [u.firstName, u.lastName, u.username, u.phone, u.telegramId].some((x) => x && x.toLowerCase().includes(s))
    );
  }, [items, q]);

  return (
    <div>
      <div className="page-head">
        <h1>Mijozlar ({items.length})</h1>
      </div>
      <div className="filters">
        <input placeholder="Ism, username, telefon" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>Ism</th>
              <th>Username</th>
              <th>Telefon</th>
              <th>Til</th>
              <th>Buyurtmalar</th>
              <th>Qo'shilgan</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id}>
                <td>
                  {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                  {u.isAdmin && <span className="status st-blue tiny"> admin</span>}
                  <div className="small muted">ID: {u.telegramId}</div>
                </td>
                <td>
                  {u.username ? (
                    <a className="link" href={`https://t.me/${u.username}`} target="_blank" rel="noreferrer">
                      @{u.username}
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
                <td>{u.phone ? <a href={`tel:${u.phone}`}>{u.phone}</a> : '—'}</td>
                <td>{u.lang.toUpperCase()}</td>
                <td>{u._count?.orders || 0}</td>
                <td className="small nowrap">{date(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
