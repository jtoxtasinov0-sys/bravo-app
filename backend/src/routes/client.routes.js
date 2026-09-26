// Mijoz (Mini App) yo'llari — /api/...
const router = require('express').Router();
const c = require('../controllers/cartController');
const { clientAuth } = require('../middlewares/auth.middleware');
const { uploader } = require('../utils/upload');

// async xatolarni Express'ga uzatish
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/config', h(c.getConfig));
router.get('/products', h(c.listProducts));
router.get('/products/:id', h(c.getProduct));
router.get('/stories', h(c.listStories));

router.get('/me', clientAuth, h(c.getMe));
router.patch('/me', clientAuth, h(c.updateMe));
router.post('/cart/calculate', clientAuth, h(c.calculate));
router.post('/orders', clientAuth, h(c.createOrder));
router.get('/orders/my', clientAuth, h(c.myOrders));
router.get('/orders/:id/payment', clientAuth, h(c.orderPayment));
router.post('/orders/:id/receipt', clientAuth, uploader('receipts').single('file'), h(c.uploadReceipt));

module.exports = router;
