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
  @Patch()
  updateSetting(@Body() setting: UpdateSettingDto) {
    return this.settingsService.updateSetting(setting);
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
  @Get()
  getSetting() {
    return this.settingsService.getSetting();
  }
}
