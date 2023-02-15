import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UpdateTreeDocument = UpdateTree & Document;

@Schema()
export class UpdateTree extends Document {
  @Prop({ type: String })
  signer;

  @Prop({ type: Number })
  nonce;

  @Prop({ type: Number })
  treeId;

  @Prop({ type: String })
  treeSpecs;

  @Prop({ type: String })
  signature;

  @Prop({ type: Number, default: 0 })
  status;

  @Prop({ type: Date, default: Date.now })
  createdAt;

  @Prop({ type: Date, default: Date.now })
  updatedAt;
}

export const UpdateTreeSchema = SchemaFactory.createForClass(UpdateTree);
