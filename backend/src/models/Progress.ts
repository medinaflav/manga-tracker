import { Schema, model, Document, Types } from 'mongoose';

export interface IProgress extends Document {
  userId: Types.ObjectId;
  mangaId: string;
  chapter: number;
  page?: number;
  updatedAt: Date;
}

const progressSchema = new Schema<IProgress>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  mangaId: { type: String, required: true },
  chapter: { type: Number, required: true },
  page: Number,
  updatedAt: { type: Date, default: Date.now }
});

export const Progress = model<IProgress>('Progress', progressSchema);
