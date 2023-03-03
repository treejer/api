import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type LastStateDocument = LastState & Document;

@Schema()
export class LastState extends Document {
  @Prop({ type: String })
  signer;
}

export const AssignedTreePlantSchema = SchemaFactory.createForClass(LastState);
