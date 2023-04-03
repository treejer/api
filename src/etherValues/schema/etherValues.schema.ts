import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { EtherDataResultDto } from "./../dto";

export type EtherValuesDocument = EtherValues & Document;

@Schema()
export class EtherValues extends Document {
  @Prop({ type: String, required: true })
  status;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: Object, required: true })
  result: EtherDataResultDto;

  @Prop({ type: Date, required: true, default: Date.now })
  storedAt;
}

export const EtherValuesSchema = SchemaFactory.createForClass(EtherValues);
