import { Router } from 'express';
import { createProduct, deleteProduct, getProduct, getProducts, getStats, updateProduct } from '../Controllers/productController.js';
import { protect } from '../Middleware/auth.js';
const router = Router();
router.get('/stats', getStats);
router.route('/').get(getProducts).post(protect, createProduct);
router.route('/:id').get(getProduct).put(protect, updateProduct).delete(protect, deleteProduct);
export default router;

