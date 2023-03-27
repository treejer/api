import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UserMobileDocument = UserMobile & Document;

@Schema()
export class UserMobile extends Document {
  @Prop({ type: String, required: true })
  userId;

  @Prop({ type: String, required: true })
  number;

  @Prop({ type: Date, default: new Date(), required: true })
  verifiedAt;

  @Prop({ type: Date, default: new Date(), required: true })
  createdAt;
}

export const UserMobileSchema = SchemaFactory.createForClass(UserMobile);
