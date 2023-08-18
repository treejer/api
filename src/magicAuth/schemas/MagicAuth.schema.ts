import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type MagicAuthDocument = MagicAuth & Document;

@Schema()
export class MagicAuth extends Document {
  @Prop({ type: String, required: true })
  userId;

  @Prop({ type: String })
  issuer?;

  @Prop({ type: String, required: true })
  walletAddress;

  @Prop({ type: String })
  email?;

  @Prop({ type: String })
  oauthProvider?;

  @Prop({ type: String })
  mobile?;

  @Prop({ type: Date, default: Date.now, required: true })
  createdAt;
}

export const MagicAuthSchema = SchemaFactory.createForClass(MagicAuth);
