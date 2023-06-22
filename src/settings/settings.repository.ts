import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Settings, SettingsDocument } from "./schema";
import { Model } from "mongoose";
import { EntityRepository } from "src/database/database.repository";

@Injectable()
export class SettingsRepository extends EntityRepository<SettingsDocument> {
  constructor(
    @InjectModel(Settings.name)
    settingsModel: Model<SettingsDocument>
  ) {
    super(settingsModel);
  }
}
