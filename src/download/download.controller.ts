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
    description: "Response for invalid input ",
    content: {
      "text/plain": {
        schema: {
          format: "text/plain",
          example: "Invalid Input",
        },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: "Response for invalid access.",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "invalid access" },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Response for not found file.",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "File not exist" },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: "Response for Internal server errror.",
    content: {
      "text/plain": {
        schema: { format: "text/plain", example: "Internal server error" },
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
