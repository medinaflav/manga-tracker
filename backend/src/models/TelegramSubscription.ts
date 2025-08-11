import { Schema, model, Document, Types } from 'mongoose';

export interface ITelegramSubscription extends Document {
  userId: Types.ObjectId;
  chatId: number;
  active: boolean;
  linkedAt: Date;
}

const subscriptionSchema = new Schema<ITelegramSubscription>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  chatId: { type: Number, required: true },
  active: { type: Boolean, default: true },
  linkedAt: { type: Date, default: Date.now }
});

export const TelegramSubscription = model<ITelegramSubscription>('TelegramSubscription', subscriptionSchema);
