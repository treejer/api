import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { File, FileDocument } from "./schemas";
import { Model } from "mongoose";
import { EntityRepository } from "src/database/database.repository";

@Injectable()
export class FileRepository extends EntityRepository<FileDocument> {
  constructor(
    @InjectModel(File.name)
    fileModel: Model<FileDocument>,
  ) {
    super(fileModel);
  }
}
