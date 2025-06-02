import mongoose from "mongoose";

const marketplaceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['furniture', 'electronics', 'home-decor', 'services', 'other']
    },
    price: {
      type: Number,
      required: true,
    },
    condition: {
      type: String,
      required: true,
      enum: ['new', 'like-new', 'good', 'fair', 'poor']
    },
    location: {
      type: String,
      required: true,
    },
    images: {
      type: Array,
      required: true,
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['available', 'sold', 'pending'],
      default: 'available'
    },
    contactInfo: {
      phone: String,
      email: String,
    },
    tags: [String],
  },
  { timestamps: true }
);

// Add text index for search functionality
marketplaceSchema.index({ title: 'text', description: 'text', tags: 'text' });

const Marketplace = mongoose.model("Marketplace", marketplaceSchema);

export default Marketplace; 