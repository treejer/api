import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { ForceUpdateDataDto } from "../dto";

export type SettingsDocument = Settings & Document;

@Schema()
export class Settings extends Document {
  @Prop({ type: Object, required: true })
  forceUpdate: ForceUpdateDataDto;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);
