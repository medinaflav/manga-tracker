import { Schema, model, Document, Types } from 'mongoose';

export interface ITelegramSubscription extends Document {
  userId: Types.ObjectId;
  chatId: string;
  active: boolean;
  linkedAt: Date;
}

const TelegramSubscriptionSchema = new Schema<ITelegramSubscription>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  chatId: { type: String, required: true },
  active: { type: Boolean, default: true },
  linkedAt: { type: Date, default: Date.now }
});

export default model<ITelegramSubscription>('TelegramSubscription', TelegramSubscriptionSchema);
