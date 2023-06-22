import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { SettingsService } from "./settings.service";
import { UpdateSettingDto } from "./dto/update-setting-dto";
import { Role, SettingErrorMessage, SwaggerErrors } from "src/common/constants";
import { HasRoles } from "src/auth/decorators";
import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "src/auth/strategies";
import { GetSettingResultDto } from "./dto";
import { boolean } from "yargs";

@Controller("settings")
@ApiTags("settings")
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: "update settings" })
  @ApiResponse({
    status: 200,
    description: "setting has been successfully edited.",
    type: Boolean,
  })
  @ApiResponse({
    status: 400,
    description: SwaggerErrors.INVALID_INPUT_DESCRIPTION,
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: SwaggerErrors.INVALID_INPUT },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: SwaggerErrors.UNAUTHORIZED_DESCRIPTION,
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: SwaggerErrors.UNAUTHORIZED },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "plant request not exist",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: SettingErrorMessage.SETTING_NOT_EXIST,
        },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: SwaggerErrors.INTERNAL_SERVER_ERROR_DESCRIPTION,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: SwaggerErrors.INTERNAL_SERVER_ERROR,
        },
      },
    },
  })
  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Patch(":id")
  updateSetting(@Param("id") id: string, @Body() setting: UpdateSettingDto) {
    return this.settingsService.updateSettingWithKey(id, setting);
  }

  @ApiOperation({ summary: "get settings" })
  @ApiResponse({
    status: 200,
    description: "get update requests for verification",
    type: GetSettingResultDto,
  })
  @ApiResponse({
    status: 500,
    description: SwaggerErrors.INTERNAL_SERVER_ERROR_DESCRIPTION,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: SwaggerErrors.INTERNAL_SERVER_ERROR,
        },
      },
    },
  })
  @ApiQuery({ name: "filters", required: false, type: String })
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
