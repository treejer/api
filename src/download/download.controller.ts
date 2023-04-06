import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiBody, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { DownloadService } from "./download.service";
import { JwtUserDto } from "src/auth/dtos";
import { User } from "src/user/decorators";

@Controller()
@ApiTags("download")
export class DownloadController {
  constructor(private downloadService: DownloadService) {}

  @UseGuards(AuthGuard("jwt"))
  @Get("files/:filename")
  async downloadFile(
    @Param("filename") filename: string,
    @Res() response: Response,
    @User() user: JwtUserDto,
  ) {
    return this.downloadService.downloadFile(filename, response, user);
  }

  @Post("uploads")
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  async uploadFile(@Req() req) {
    let obj = await this.downloadService.uploadFile(req);

    console.log("objjjjjjjjjjjjjjjjjjj", obj);

    return obj;
  }
}
