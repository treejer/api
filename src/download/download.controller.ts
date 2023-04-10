import { Controller, Get, Param, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { DownloadService } from "./download.service";
import { JwtUserDto } from "src/auth/dtos";
import { User } from "src/user/decorators";

@Controller()
@ApiTags("download")
export class DownloadController {
  constructor(private downloadService: DownloadService) {}

  @ApiBearerAuth()
  @UseGuards(AuthGuard("jwt"))
  @Get("files/:filename")
  async downloadFile(
    @Param("filename") filename: string,
    @Res() response: Response,
    @User() user: JwtUserDto,
  ) {
    return this.downloadService.downloadFile(filename, response, user);
  }
}
