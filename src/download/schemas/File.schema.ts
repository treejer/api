import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { PlantStatus } from "../../common/constants";

export type FileDocument = File & Document;

@Schema()
export class File extends Document {
  @Prop({
    type: String,
    required: true,
  })
  originalname;

  @Prop({
    type: String,
    required: true,
  })
  filename;

  @Prop({
    type: String,
  })
  encoding?;

  @Prop({
    type: String,
    required: true,
  })
  mimetype;

  @Prop({
    type: Number,
    required: true,
  })
  size;

  @Prop({
    type: String,
    required: true,
  })
  userId;

  @Prop({
    type: String,
    mongodb: { dataType: "ObjectId" },
  })
  targetId?;

  @Prop({
    type: Number,
    required: true,
  })
  module;

  @Prop({
    type: Date,
    required: true,
  })
  createdAt: Date;
}

export const FileSchema = SchemaFactory.createForClass(File);
