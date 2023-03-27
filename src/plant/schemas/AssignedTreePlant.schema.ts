import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { PlantStatus } from "../../common/constants";
export type AssignedTreePlantDocument = AssignedTreePlant & Document;

@Schema()
export class AssignedTreePlant extends Document {
  @Prop({ type: String, required: true })
  signer;

  @Prop({ type: Number, required: true })
  nonce;

  @Prop({ type: Number, required: true })
  treeId;

  @Prop({ type: String, required: true })
  treeSpecs;

  @Prop({ type: Number, required: true })
  birthDate;

  @Prop({ type: Number, required: true })
  countryCode;

  @Prop({ type: String, required: true })
  signature;

  @Prop({ type: Number, required: true, default: PlantStatus.PENDING })
  status;

  @Prop({ type: Date, required: true, default: Date.now })
  createdAt;

  @Prop({ type: Date, required: true, default: Date.now })
  updatedAt;
}

export const AssignedTreePlantSchema =
  SchemaFactory.createForClass(AssignedTreePlant);
