import { Schema, model, Document, Types } from 'mongoose';

export interface IProgress extends Document {
  userId: Types.ObjectId;
  mangaId: string;
  chapter: number;
  page?: number;
  updatedAt: Date;
}

const ProgressSchema = new Schema<IProgress>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  mangaId: { type: String, required: true },
  chapter: { type: Number, required: true },
  page: { type: Number },
  updatedAt: { type: Date, default: Date.now }
});

export default model<IProgress>('Progress', ProgressSchema);
