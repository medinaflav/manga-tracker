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

const WatchItemSchema = new Schema<IWatchItem>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  mangaId: { type: String, required: true },
  title: { type: String, required: true },
  coverUrl: { type: String, required: true },
  lastKnownChapter: { type: Number, default: 0 },
  notify: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default model<IWatchItem>('WatchItem', WatchItemSchema);
