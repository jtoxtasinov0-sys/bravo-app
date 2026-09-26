// Mini App asosiy oynasi: sahifalar va ochiladigan oynalarni boshqaradi
import { useEffect, useState } from 'react';
import { useStore } from './lib/store';
import { api, onWaking } from './lib/api';
import { useBack } from './lib/back';
import BottomNav from './components/BottomNav';
import ProductSheet from './components/ProductSheet';
import PaymentScreen from './components/PaymentScreen';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';

const INTRO_KEY = 'bravo_intro_done';

function Done({ order, onClose }) {
  const { t } = useStore();
  useBack(onClose);
  return (
    <div className="page page-overlay done">
      <div className="done-icon">✅</div>
      <h1>{t.orderDone}</h1>
      <p className="muted">#{order.id}</p>
      <p className="muted">{t.orderDoneHint}</p>
      <button className="btn btn-primary btn-block" onClick={onClose}>
        {t.done}
      </button>
    </div>
  );
}

export default function App() {
  const store = useStore();
  const { config, user, products, t, error, reload } = store;
  const [waking, setWaking] = useState(false);
  const [tab, setTab] = useState('home');
  const [category, setCategory] = useState(null);
  const [productId, setProductId] = useState(null);
  const [checkout, setCheckout] = useState(false);
  const [pay, setPay] = useState(null); // { order, payment }
  const [done, setDone] = useState(null);
  const [toast, setToast] = useState('');
  const [introDone, setIntroDone] = useState(() => {
    try {
      return localStorage.getItem(INTRO_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    onWaking(setWaking);
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [tab]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 1600);
  };

  if (error && !config) {
    return (
      <div className="center-screen">
        <div className="empty-icon">⚠️</div>
        <p>{t.error}</p>
        <p className="muted small">{error}</p>
        <button className="btn btn-primary" onClick={reload}>
          {t.retry}
        </button>
      </div>
    );
  }

  if (!config || !user) {
    return (
      <div className="center-screen">
        <img className="splash-logo" src="/logo.svg" alt="" />
        {waking && <p className="muted small">{t.waking}</p>}
      </div>
    );
  }

  if (!introDone && !user.seenIntro) {
    return (
      <Onboarding
        onDone={() => {
          try {
            localStorage.setItem(INTRO_KEY, '1');
          } catch {
            /* */
          }
          api.patch('/me', { seenIntro: true }).catch(() => {});
          setIntroDone(true);
        }}
      />
    );
  }

  const product = productId ? products.find((p) => p.id === productId) : null;

  const openPay = async (orderId) => {
    try {
      setPay(await api.get(`/orders/${orderId}/payment`));
    } catch (e) {
      showToast(e.message);
    }
  };

  return (
    <div className="app">
      {waking && <div className="waking">{t.waking}</div>}


      {tab === 'home' && (
        <Home
          onOpenProduct={setProductId}
          onOpenCategory={(c) => {
            setCategory(c);
            setTab('catalog');
          }}
        />
      )}
      {tab === 'catalog' && <Catalog category={category} setCategory={setCategory} onOpenProduct={setProductId} />}
      {tab === 'cart' && <Cart onCheckout={() => setCheckout(true)} onCatalog={() => setTab('catalog')} />}
      {tab === 'profile' && <Profile onPay={openPay} onCart={() => setTab('cart')} />}

      <BottomNav tab={tab} onTab={setTab} />

      {product && <ProductSheet product={product} onClose={() => setProductId(null)} onAdded={() => showToast(t.added)} />}

      {checkout && (
        <Checkout
          onBack={() => setCheckout(false)}
          onPlaced={(res) => {
            setCheckout(false);
            setTab('profile');
            if (res.order.paymentMethod !== 'cash' && (res.payment.card || res.payment.clickUrl)) setPay(res);
            else setDone(res.order);
          }}
        />
      )}
      {pay && <PaymentScreen order={pay.order} payment={pay.payment} onDone={() => { setPay(null); setTab('profile'); }} />}
      {done && <Done order={done} onClose={() => setDone(null)} />}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
