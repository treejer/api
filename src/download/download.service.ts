import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Req,
} from "@nestjs/common";
import { Response } from "express";
import { join } from "path";
import { FileRepository } from "./download.repository";
import { JwtUserDto } from "src/auth/dtos";
import { FieldObject, FileObject } from "./interfaces";
import { UserService } from "src/user/user.service";
import { AuthErrorMessages, DownloadMessage, Role } from "src/common/constants";
import { ConfigService } from "@nestjs/config";
import { CreateFileDto } from "./dtos";
import { Validator, validateOrReject } from "class-validator";
import { FieldObjectDto } from "./dtos/filedObject.dto";
import { plainToClass } from "class-transformer";

const busboy = require("busboy");
const fs = require("fs");

var mime = require("mime-types");

@Injectable()
export class DownloadService {
  constructor(
    private fileRepository: FileRepository,
    private userService: UserService,
    private configService: ConfigService,
  ) {}

  async findFileByUserId(userId: string) {
    return await this.fileRepository.findOne({
      where: {
        userId,
      },
    });
  }

  async downloadFile(filename: string, response: Response, user: JwtUserDto) {
    let findUser = await this.userService.findUserById(user.userId, {
      _id: 1,
      userRole: 1,
    });

    const file = await this.fileRepository.findOne({ filename: filename });

    if (!file) {
      throw new NotFoundException(DownloadMessage.FILE_NOT_EXIST);
    }

    if (!(findUser.userRole == Role.ADMIN || file.userId == findUser._id)) {
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
    const bb = busboy({
      headers: req.headers,
      limits: {
        files: 1,
        fileSize: 1e7,
      },
    });

    let dir = join(
      process.cwd(),
      this.configService.get<string>("STORAGE_DIRECTORY"),
    );

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    let returnObj: FileObject = {
      originalname: "",
      encoding: "",
      mimetype: "",
      size: 0,
      filename: "",
    };

    let field = new FieldObjectDto();

    try {
      let ext;

      await new Promise((resolve, reject) => {
        bb.on("file", (name, file, info) => {
          returnObj.originalname = info.filename;
          returnObj.encoding = info.encoding;
          returnObj.mimetype = info.mimeType;

          ext = mime.extension(info.mimeType);

          file.on("data", async (data) => {
            returnObj.size = data.length;
          });

          let random = `${Date.now()}-${info.filename}`;

          const saveTo = join(dir, random);

          returnObj.filename = random;

          file.pipe(fs.createWriteStream(saveTo));
        });

        bb.on("close", async () => {
          if (!["jpg", "png", "jpeg"].includes(ext)) {
            fs.unlink(join(dir, returnObj.filename), (e) => {
              if (e) {
                console.log("e", e);
              }
            });

            reject("File type is not correct");
            return;
          }

          if (returnObj.size == 1e7) {
            fs.unlink(join(dir, returnObj.filename), (e) => {
              if (e) {
                console.log("e", e);
              }
            });

            reject("File size is not correct");

            return;
          }
          try {
            field = plainToClass(FieldObjectDto, field);

            await validateOrReject(field);
          } catch (errors) {
            let errorsMessage = [];
            errors.map((error) => {
              Object.keys(error.constraints).forEach(function (key, index) {
                errorsMessage.push(error.constraints[key]);
              });
            });

            reject(errorsMessage);
            return;
          }

          resolve("");
          console.log("Done parsing form!");
        });

        bb.on("field", (name, val, info) => {
          field[name] = val;
        });

        req.pipe(bb);
      });
    } catch (error) {
      throw new BadRequestException(error);
    }

    return { file: returnObj, field };
  }

  async create(file: CreateFileDto) {
    const createdData = await this.fileRepository.create({ ...file });

    return createdData;
  }

  async updateFileById(fileId: string, data) {
    return this.fileRepository.updateOne({ _id: fileId }, data);
  }
}
