import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { MagicAuth, MagicAuthDocument } from "./schemas";
import { Model } from "mongoose";
import { EntityRepository } from "src/database/database.repository";

@Injectable()
export class MagicAuthRepository extends EntityRepository<MagicAuthDocument> {
  constructor(
    @InjectModel(MagicAuth.name)
    magicAuthModel: Model<MagicAuthDocument>
  ) {
    super(magicAuthModel);
  }
}
