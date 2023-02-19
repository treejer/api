import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { Role } from "./../../common/constants";
export type UserDocument = User & Document;

@Schema()
export class User extends Document {
  @Prop({
    type: String,
    required: false,
    unique: true,
    immutable: true,
    sparse: true,
  })
  phoneNumber;

  @Prop({ type: String, unique: true })
  walletAddress;

  @Prop({ type: Number })
  nonce: Number;

  @Prop({ type: Number })
  plantingNonce;

  @Prop({ type: String })
  firstName;

  @Prop({ type: String })
  lastName;

  @Prop({ type: Date, default: Date.now })
  createdAt;

  @Prop({ type: Number, default: Role.USER })
  userRole;

  @Prop({ type: Date, default: Date.now })
  updatedAt;

  @Prop({
    type: String,
    validate: [
      (email) => {
        var re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        return re.test(email);
      },
      "Please fill a valid email address",
    ],
  })
  email;
}

export const UserSchema = SchemaFactory.createForClass(User);
