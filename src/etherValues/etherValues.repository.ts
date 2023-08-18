import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { EtherValues, EtherValuesDocument } from "./schema";
import { Model } from "mongoose";
import { EntityRepository } from "src/database/database.repository";

@Injectable()
export class EtherValuesRepository extends EntityRepository<EtherValuesDocument> {
  constructor(
    @InjectModel(EtherValues.name)
    etherValuesModel: Model<EtherValuesDocument>
  ) {
    super(etherValuesModel);
  }
}
