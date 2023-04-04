import {
  Body,
  Get,
  Injectable,
  NotFoundException,
  Param,
  Res,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { readFileSync } from "fs";
import { join } from "path";
import { FileRepository } from "./download.repository";
import { JwtUserDto } from "src/auth/dtos";
import { DownloadMessage } from "src/common/constants";

@Injectable()
export class DownloadService {
  constructor(private fileRepository: FileRepository) {}

  async findFileByUserId(userId: string) {
    return await this.fileRepository.findOne({
      where: {
        userId,
      },
    });
  }

  async downloadFile(filename: string, response: Response, user: JwtUserDto) {
    let file = join(process.cwd(), "43.jpg");

    const f = await this.fileRepository.findOne({ filename: filename });

    if (!f || f.userId.toString() !== user.userId?.toString())
      throw new NotFoundException(DownloadMessage.FILE_NOT_EXIST);

    response.download(file);

    return response;
  }

  private validateFileName(fileName: string) {
    // const resolved = path.resolve(this.storageDirectory, fileName);
    // if (resolved.startsWith(this.storageDirectory)) return resolved;
    // throw new HttpErrors.BadRequest(`Invalid file name: ${fileName}`);
  }
}
