import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type LastStateDocument = LastState & Document;

@Schema()
export class LastState extends Document {
  @Prop({ type: Number, required: true, default: 1 })
  lastBlockNumber;

  @Prop({ type: Date, required: true, default: Date.now })
  updatedAt;
}

export const LastStateSchema = SchemaFactory.createForClass(LastState);
