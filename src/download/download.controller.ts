import { Controller, Get, Param, Res, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { readFileSync } from "fs";
import path, { join, resolve } from "path";
import { DownloadService } from "./download.service";
import { Role } from "src/common/constants";
import { HasRoles } from "src/auth/decorators";
import { RolesGuard } from "src/auth/strategies";
import { FileRepository } from "./download.repository";
import { JwtUserDto } from "src/auth/dtos";
import { User } from "src/user/decorators";

@Controller()
@ApiTags("download")
export class DownloadController {
  constructor(private downloadService: DownloadService) {}

  @HasRoles(Role.ADMIN)
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Get("files/:filename")
  async downloadFile(
    @Param("filename") filename: string,
    @Res() response: Response,
    @User() user: JwtUserDto,
  ) {
    // console.log("sssss", path.resolve("users", "admin", "readme.md"));
    return this.downloadService.downloadFile(filename, response, user);
  }
}
