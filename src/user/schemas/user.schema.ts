import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { Role } from "src/common/constants";

export type UserDocument = User & Document;

@Schema()
export class User extends Document {
  @Prop({ type: String, unique: true, required: true })
  walletAddress;

  @Prop({ type: Number, required: true })
  nonce: Number;

  @Prop({ type: Number, required: true })
  plantingNonce;

  @Prop({ type: Date, default: Date.now, required: true })
  createdAt;

  @Prop({ type: Number, default: Role.USER, required: true })
  userRole;

  @Prop({ type: Date, default: Date.now, required: true })
  updatedAt;

  @Prop({ type: Boolean, default: false, required: true })
  isVerified;

  @Prop({ type: String })
  firstName;

  @Prop({ type: String })
  lastName;

  @Prop({
    type: String,
    unique: true,
    immutable: true,
    sparse: true,
  })
  mobile;

  @Prop({
    type: Date,
  })
  mobileVerifiedAt;

  @Prop({
    type: Date,
  })
  mobileCodeRequestedAt;

  @Prop({
    type: Number,
    default: 0,
  })
  mobileCodeRequestsCountForToday;

  @Prop({
    type: Number,
  })
  mobileCode;

  @Prop({
    type: String,
  })
  mobileCountry;

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
  @Prop({
    type: Date,
  })
  emailVerifiedAt;

  @Prop({
    type: String,
  })
  emailToken;

  @Prop({
    type: Date,
  })
  emailTokenRequestedAt;

  @Prop({
    type: String,
  })
  idCard;
}

export const UserSchema = SchemaFactory.createForClass(User);
