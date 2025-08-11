import { Schema, model, Document, Types } from 'mongoose';

export interface IOneTimeToken extends Document {
  token: string;
  userId: Types.ObjectId;
  purpose: 'telegram_link';
  expiresAt: Date;
  consumedAt?: Date;
}

const tokenSchema = new Schema<IOneTimeToken>({
  token: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  purpose: { type: String, enum: ['telegram_link'], required: true },
  expiresAt: { type: Date, required: true },
  consumedAt: Date
});

export const OneTimeToken = model<IOneTimeToken>('OneTimeToken', tokenSchema);
