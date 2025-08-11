import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;
  if (!uri) return;
  try {
    await mongoose.connect(uri);
  } catch (err) {
    console.warn('Mongo connection failed');
  }
};
