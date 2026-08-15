import mongoose from 'mongoose';
import Product from '../Models/Product.js';

const validId = (id) => mongoose.Types.ObjectId.isValid(id);
const escaped = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const getProducts = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

    const conditions = [];
    if (req.query.search?.trim()) {
      const expression = { $regex: escaped(req.query.search.trim()), $options: 'i' };
      conditions.push({ $or: [{ name: expression }, { description: expression }] });
    }
    if (req.query.category?.trim()) {
      conditions.push({ category: { $regex: escaped(req.query.category.trim()), $options: 'i' } });
    }
    const filter = conditions.length === 0 ? {} : conditions.length === 1 ? conditions[0] : { $and: conditions };

    const [products, totalProducts] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Product.countDocuments(filter),
    ]);
    return res.json({
      success: true,
      message: 'Products fetched successfully',
      products,
      pagination: { currentPage: page, totalPages: Math.ceil(totalProducts / limit), totalProducts, limit },
    });
  } catch (error) { next(error); }
};

export const getProduct = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid product ID' });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    return res.json({ success: true, message: 'Product fetched successfully', product });
  } catch (error) { next(error); }
};

export const createProduct = async (req, res, next) => {
  try {
    const product = await Product.create({ ...req.body, createdBy: req.user._id });
    return res.status(201).json({ success: true, message: 'Product created successfully', product });
  } catch (error) { next(error); }
};

export const updateProduct = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid product ID' });
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    const fields = ['name', 'description', 'price', 'category', 'brand', 'quantity'];
    fields.forEach((field) => { if (req.body[field] !== undefined) product[field] = req.body[field]; });
    await product.save();
    return res.json({ success: true, message: 'Product updated successfully', product });
  } catch (error) { next(error); }
};

export const deleteProduct = async (req, res, next) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid product ID' });
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    return res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) { next(error); }
};

export const getStats = async (req, res, next) => {
  try {
    const stats = await Product.aggregate([
      { $match: {} },
      { $group: { _id: '$category', productCount: { $sum: 1 }, inventoryQuantity: { $sum: '$quantity' }, averagePrice: { $avg: '$price' }, minPrice: { $min: '$price' }, maxPrice: { $max: '$price' } } },
      { $sort: { productCount: -1, _id: 1 } },
      { $project: { _id: 0, category: '$_id', productCount: 1, inventoryQuantity: 1, averagePrice: { $round: ['$averagePrice', 2] }, minPrice: 1, maxPrice: 1 } }
    ]);
    const totals = await Product.aggregate([{ $group: { _id: null, totalProducts: { $sum: 1 }, totalInventoryQuantity: { $sum: '$quantity' }, averageProductPrice: { $avg: '$price' } } }, { $project: { _id: 0, totalProducts: 1, totalInventoryQuantity: 1, averageProductPrice: { $round: ['$averageProductPrice', 2] } } }]);
    return res.json({ success: true, message: 'Product statistics fetched successfully', stats: { overview: totals[0] || { totalProducts: 0, totalInventoryQuantity: 0, averageProductPrice: 0 }, byCategory: stats } });
  } catch (error) { next(error); }
};
