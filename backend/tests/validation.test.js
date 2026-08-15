import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import Product from '../Models/Product.js';
import { getProduct } from '../Controllers/productController.js';

test('product validation rejects negative price and quantity', async () => {
  const product = new Product({ name: 'Phone', description: 'A useful mobile device', price: -1, category: 'Electronics', brand: 'Acme', quantity: -2, createdBy: '507f1f77bcf86cd799439011' });
  await assert.rejects(product.validate(), /Price cannot be negative/);
});

test('product validation accepts valid product data', async () => {
  const product = new Product({ name: 'Phone', description: 'A useful mobile device', price: 99.99, category: 'Electronics', brand: 'Acme', quantity: 5, createdBy: '507f1f77bcf86cd799439011' });
  await product.validate();
});

test('invalid product IDs return a safe 400 response', async () => {
  let response;
  await getProduct({ params: { id: 'not-an-object-id' } }, { status: (code) => ({ json: (body) => { response = { code, body }; } }) }, () => {});
  assert.equal(response.code, 400);
  assert.equal(response.body.success, false);
});
