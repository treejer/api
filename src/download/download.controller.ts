import { Controller, Get, Param, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Response } from "express";
import { DownloadService } from "./download.service";
import { JwtUserDto } from "src/auth/dtos";
import { User } from "src/user/decorators";
import {
  AuthErrorMessages,
  DownloadMessage,
  SwaggerErrors,
} from "src/common/constants";

@Controller()
@ApiTags("download")
export class DownloadController {
  constructor(private downloadService: DownloadService) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: "download file" })
  @ApiResponse({
    status: 200,
    description: "downloaded successfully",
  })
  @ApiResponse({
    status: 400,
    description: SwaggerErrors.INVALID_INPUT_DESCRIPTION,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: SwaggerErrors.INVALID_INPUT,
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Response for invalid access.",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: AuthErrorMessages.INVALID_ACCESS,
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: SwaggerErrors.NOT_FOUND_DESCRIPTION,
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: DownloadMessage.FILE_NOT_EXIST,
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
  @UseGuards(AuthGuard("jwt"))
  @Get("files/:filename")
  async downloadFile(
    @Param("filename") filename: string,
    @Res() response: Response,
    @User() user: JwtUserDto
  ) {
    return this.downloadService.downloadFile(filename, response, user);
  }
}
