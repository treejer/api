import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Req,
} from "@nestjs/common";
import { Response } from "express";
import { join } from "path";
import { FileRepository } from "./download.repository";
import { JwtUserDto } from "src/auth/dtos";
import { FileObject } from "./interfaces";
import { UserService } from "src/user/user.service";
import { AuthErrorMessages, DownloadMessage, Role } from "src/common/constants";
import { ConfigService } from "@nestjs/config";

const busboy = require("busboy");
const fs = require("fs");

@Injectable()
export class DownloadService {
  constructor(
    private fileRepository: FileRepository,
    private userService: UserService,
    private configService: ConfigService,
  ) {}

  async downloadFile(filename: string, response: Response, user: JwtUserDto) {
    let findUser = await this.userService.findUserById(user.userId, {
      _id: 1,
      userRole: 1,
    });

    const file = await this.fileRepository.findOne({ filename: filename });

    if (!file) {
      throw new NotFoundException(DownloadMessage.FILE_NOT_EXIST);
    }

    if (findUser.userRole !== Role.ADMIN && file.userId !== findUser._id) {
      throw new ForbiddenException(AuthErrorMessages.INVALID_ACCESS);
    }

    let path = join(
      process.cwd(),
      this.configService.get<string>("STORAGE_DIRECTORY"),
      file.filename,
    );

    response.download(path);

    return response;
  }

  async uploadFile(@Req() req) {
    const bb = busboy({ headers: req.headers });

    let dir = join(
      process.cwd(),
      this.configService.get<string>("STORAGE_DIRECTORY"),
    );

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    let returnObj: FileObject = {
      originalname: "",
      fieldname: "",
      encoding: "",
      mimetype: "",
      size: 0,
      filename: "",
    };

    await new Promise((resolve, reject) => {
      bb.on("file", (name, file, info) => {
        returnObj.fieldname = name;
        returnObj.originalname = info.filename;
        returnObj.encoding = info.encoding;
        returnObj.mimetype = info.mimeType;

        file.on("data", (data) => {
          returnObj.size = data.length;
        });

        let random = `${Date.now()}-${info.filename}`;

        const saveTo = join(dir, random);

        returnObj.filename = random;

        file.pipe(fs.createWriteStream(saveTo));
      });

      bb.on("close", () => {
        resolve("");
        console.log("Done parsing form!");
      });

      req.pipe(bb);
    });

    return returnObj;
  }
}
