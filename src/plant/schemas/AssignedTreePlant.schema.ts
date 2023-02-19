import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { PlantStatus } from "../../common/constants";
export type AssignedTreePlantDocument = AssignedTreePlant & Document;

@Schema()
export class AssignedTreePlant extends Document {
  @Prop({ type: String })
  userId;

  @Prop({ type: String })
  signer;

  @Prop({ type: Number })
  nonce;

  @Prop({ type: Number, unique: true })
  treeId;

  @Prop({ type: String })
  treeSpecs;

  @Prop({ type: Number })
  birthDate;

  @Prop({ type: Number })
  countryCode;

  @Prop({ type: String })
  signature;

  @Prop({ type: Number, default: PlantStatus.PENDING })
  status;

  @Prop({ type: Date, default: Date.now })
  createdAt;

  @Prop({ type: Date, default: Date.now })
  updatedAt;
}

export const AssignedTreePlantSchema =
  SchemaFactory.createForClass(AssignedTreePlant);
