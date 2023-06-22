import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  ValidationPipe,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SettingsService } from "./settings.service";
import { UpdateSettingDto } from "./dto/update-setting-dto";

@Controller("settings")
@ApiTags("settings")
export class SettingsController {
  constructor(private settingsService: SettingsService) {}
  @Patch(":id")
  updateSetting(@Param("id") id: string, @Body() setting: UpdateSettingDto) {
    this.settingsService.updateSettingWithKey(id, setting);
  }

  @Get()
  getSetting(@Query("filters") filters?: string) {
    if (!filters || filters.length === 0) filters = "{}";

    try {
      filters = JSON.parse(decodeURIComponent(filters));
    } catch (error) {
      filters = JSON.parse(decodeURIComponent("{}"));
    }

    return this.settingsService.getSetting(filters);
  }
}
