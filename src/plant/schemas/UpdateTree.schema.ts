import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { PlantStatus } from "../../common/constants";

export type UpdateTreeDocument = UpdateTree & Document;

@Schema()
export class UpdateTree extends Document {
  @Prop({ type: String })
  userId;

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

  @Prop({ type: Number, default: PlantStatus.PENDING })
  status;

  @Prop({ type: Date, default: Date.now })
  createdAt;

  @Prop({ type: Date, default: Date.now })
  updatedAt;
}

export const UpdateTreeSchema = SchemaFactory.createForClass(UpdateTree);
