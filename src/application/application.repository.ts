import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Application, ApplicationDocument } from "./schemas";
import { Model } from "mongoose";
import { EntityRepository } from "../database/database.repository";
@Injectable()
export class ApplicationRepository extends EntityRepository<ApplicationDocument> {
  constructor(
    @InjectModel(Application.name)
    userMobileModel: Model<ApplicationDocument>
  ) {
    super(userMobileModel);
  }
}
