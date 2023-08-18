import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type ApplicationDocument = Application & Document;

@Schema()
export class Application extends Document {
  @Prop({ type: String, required: true })
  userId;

  @Prop({ type: Number, required: true })
  type;

  @Prop({ type: Date, required: true, default: Date.now })
  createdAt;

  @Prop({ type: Date, required: true, default: Date.now })
  updatedAt;

  @Prop({ type: Date })
  deletedAt;

  @Prop({ type: String })
  organizationAddress;

  @Prop({ type: String })
  referrer;

  @Prop({ type: Number })
  longitude;

  @Prop({ type: Number })
  latitude;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);
