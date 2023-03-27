import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UserMobileDocument = UserMobile & Document;

@Schema()
export class UserMobile extends Document {
  @Prop({ type: String })
  userId;

  @Prop({ type: String })
  number;

  @Prop({ type: Date, default: new Date() })
  verifiedAt;

  @Prop({ type: Date, default: new Date() })
  createdAt;
}

export const UserMobileSchema = SchemaFactory.createForClass(UserMobile);
