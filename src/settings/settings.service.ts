import { Injectable, NotFoundException } from "@nestjs/common";

import { SettingsRepository } from "./settings.repository";
import { ConfigService } from "@nestjs/config";
import { Settings } from "./schema";
import { SettingErrorMessage } from "src/common/constants";

@Injectable()
export class SettingsService {
  constructor(private settingsRepository: SettingsRepository) {}
  async updateSettingWithKey(_id, setting) {
    if (!(await this.settingsRepository.findOne({ _id }))) {
      throw new NotFoundException(SettingErrorMessage.SETTING_NOT_EXIST);
    }
    return await this.settingsRepository.replaceOne({ _id }, setting);
  }

  async getSetting(filter) {
    return await this.settingsRepository.findOne(filter);
  }
}
