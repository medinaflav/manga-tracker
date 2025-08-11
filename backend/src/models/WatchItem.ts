import { Schema, model, Document, Types } from 'mongoose';

export interface IWatchItem extends Document {
  userId: Types.ObjectId;
  mangaId: string;
  title: string;
  coverUrl: string;
  lastKnownChapter: number;
  notify: boolean;
  createdAt: Date;
}

const watchItemSchema = new Schema<IWatchItem>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  mangaId: { type: String, required: true },
  title: String,
  coverUrl: String,
  lastKnownChapter: { type: Number, default: 0 },
  notify: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const WatchItem = model<IWatchItem>('WatchItem', watchItemSchema);
