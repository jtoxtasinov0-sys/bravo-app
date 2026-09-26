// Admin panel yo'llari — /api/admin/...
const router = require('express').Router();
const a = require('../controllers/adminController');
const { adminAuth } = require('../middlewares/auth.middleware');
const { uploader } = require('../utils/upload');

const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.post('/login', h(a.login));
router.post('/login/telegram', h(a.loginTelegram));

// Pastdagi hamma yo'llar faqat kirgan admin uchun
router.use(adminAuth);

router.get('/meta', h(a.meta));
router.get('/stats', h(a.stats));

router.get('/orders', h(a.listOrders));
router.patch('/orders/:id', h(a.updateOrder));
router.delete('/orders/:id', h(a.deleteOrder));
router.post('/orders/clear', h(a.clearOrders));

router.get('/products', h(a.listProducts));
router.post('/products', h(a.createProduct));
router.put('/products/:id', h(a.updateProduct));
router.delete('/products/:id', h(a.deleteProduct));
router.put('/products/:id/stock', h(a.updateStock));

router.post('/upload/products', uploader('products').single('file'), a.uploaded('products'));
router.post('/upload/stories', uploader('stories').single('file'), a.uploaded('stories'));
router.post('/upload/broadcast', uploader('broadcast').single('file'), a.uploaded('broadcast'));

router.get('/stories', h(a.listStories));
router.post('/stories', h(a.createStory));
router.put('/stories/:id', h(a.updateStory));
router.delete('/stories/:id', h(a.deleteStory));

router.get('/users', h(a.listUsers));

router.post('/broadcast', h(a.startBroadcast));
router.get('/broadcast', h(a.broadcastStatus));

router.get('/settings', h(a.getSettings));
router.put('/settings', h(a.updateSettings));

module.exports = router;
