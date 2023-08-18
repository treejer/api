import { Injectable, NotFoundException } from "@nestjs/common";
import { SettingsRepository } from "./settings.repository";
import { SettingErrorMessage } from "src/common/constants";
import { SETTING_ID } from "./../common/constants";

@Injectable()
export class SettingsService {
  constructor(private settingsRepository: SettingsRepository) {}
  async updateSetting(setting) {
    return await this.settingsRepository.replaceOne(
      { _id: SETTING_ID },
      setting
    );
  }

  async getSetting() {
    return await this.settingsRepository.findOne({ _id: SETTING_ID });
  }
}
