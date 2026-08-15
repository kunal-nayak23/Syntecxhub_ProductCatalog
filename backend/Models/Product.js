import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: [true, 'Product name is required'], minlength: 2, maxlength: 120 },
    description: { type: String, trim: true, required: [true, 'Description is required'], minlength: 5, maxlength: 2000 },
    price: { type: Number, required: [true, 'Price is required'], min: [0, 'Price cannot be negative'] },
    category: { type: String, trim: true, required: [true, 'Category is required'], minlength: 2, maxlength: 80 },
    brand: { type: String, trim: true, required: [true, 'Brand is required'], minlength: 2, maxlength: 80 },
    quantity: { type: Number, required: [true, 'Quantity is required'], min: [0, 'Quantity cannot be negative'], validate: { validator: Number.isInteger, message: 'Quantity must be a whole number' } },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

productSchema.index({ name: 1, category: 1 });
export default mongoose.model('Product', productSchema);

