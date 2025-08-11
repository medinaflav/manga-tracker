import { Schema, model, Document, Types } from 'mongoose';

export interface IOneTimeToken extends Document {
  token: string;
  userId: Types.ObjectId;
  purpose: 'telegram_link';
  expiresAt: Date;
  consumedAt?: Date;
}

const OneTimeTokenSchema = new Schema<IOneTimeToken>({
  token: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  purpose: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  consumedAt: { type: Date }
});

export default model<IOneTimeToken>('OneTimeToken', OneTimeTokenSchema);
