import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { UserMobile, UserMobileDocument } from "./schemas";
import { Model } from "mongoose";
import { EntityRepository } from "../database/database.repository";
@Injectable()
export class UserMobileRepository extends EntityRepository<UserMobileDocument> {
  constructor(
    @InjectModel(UserMobile.name)
    userMobileModel: Model<UserMobileDocument>
  ) {
    super(userMobileModel);
  }
}
