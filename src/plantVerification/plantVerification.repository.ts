import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { LastState, LastStateDocument } from "./schemas";
import { Model } from "mongoose";
import { EntityRepository } from "src/database/database.repository";

@Injectable()
export class LastStateRepository extends EntityRepository<LastStateDocument> {
  constructor(
    @InjectModel(LastState.name)
    lastStateModel: Model<LastStateDocument>,
  ) {
    super(lastStateModel);
  }
}
