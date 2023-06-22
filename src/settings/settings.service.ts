import { Injectable } from "@nestjs/common";

import { SettingsRepository } from "./settings.repository";
import { ConfigService } from "@nestjs/config";
import { Settings } from "./schema";

@Injectable()
export class SettingsService {
  constructor(private settingsRepository: SettingsRepository) {}
  async updateSettingWithKey(id, setting) {
    await this.settingsRepository.replaceOne({ _id: id }, setting);
  }

  async getSetting(filter) {
    return await this.settingsRepository.findOne(filter);
  }
}
