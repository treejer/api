import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import { ApplicationRepository } from "./application.repository";
import {
  ApplicationErrorMessage,
  ApplicationStatuses,
  ApplicationTypes,
  FileModules,
} from "src/common/constants";

import { UserService } from "src/user/user.service";
import { EmailService } from "src/email/email.service";
import { DownloadService } from "src/download/download.service";
import { CreateApplicationResultDto } from "./dtos/create-application.dto";
import { ApplicationDocument } from "./schemas";
@Injectable()
export class ApplicationService {
  constructor(
    private applicationRepository: ApplicationRepository,
    private userServie: UserService,
    private emailService: EmailService,
    private downloadService: DownloadService
  ) {}

  async updateUser(userId, req): Promise<CreateApplicationResultDto> {
    const { field, file } = await this.downloadService.uploadFile(req);

    let user = await this.userServie.findUserById(userId);

    if (user.isVerified) {
      throw new ConflictException(
        ApplicationErrorMessage.APPLICATION_ALREADY_SUBMITTED
      );
    }

    const { encoding, filename, mimetype, originalname, size } = file;

    const fileOne = await this.downloadService.create({
      userId: userId,
      module: FileModules.idcard,
      encoding,
      filename,
      mimetype,
      originalname,
      size,
    });

    // @ts-ignore

    const {
      firstName,
      lastName,
      type,
      organizationAddress,
      referrer,
      longitude,
      latitude,
    } = field;

    if (
      !Object.values(ApplicationTypes).includes(
        Number(type) as ApplicationTypes
      )
    ) {
      throw new BadRequestException(ApplicationErrorMessage.INVALID_PARAMS);
    }

    const applicationOne = await this.applicationRepository.create({
      status: ApplicationStatuses.PENDING,
      type,
      userId,
      organizationAddress,
      referrer,
      longitude,
      latitude,
    });

    await this.userServie.updateUserById(userId, {
      firstName,
      lastName,
      idCard: fileOne._id,
    });

    await this.downloadService.updateFileById(fileOne._id, {
      targetId: applicationOne._id,
    });

    await this.emailService.notifyAdmin(
      "Application Submitted",
      `An application submitted for user with id ${userId}; \r\n` +
        `FirstName: ${firstName} \r\n` +
        `LastName: ${lastName} \r\n`
    );

    return { application: applicationOne, file: fileOne };
  }

  async getApplicationList(filters = {}): Promise<ApplicationDocument[]> {
    return await this.applicationRepository.find(filters);
  }

  async getApplicationById(
    _id: string,
    projection?: Record<string, number>
  ): Promise<ApplicationDocument> {
    return await this.applicationRepository.findOne({ _id }, { ...projection });
  }

  async getApplicationByUserId(
    userId: string,
    projection?: Record<string, number>
  ): Promise<ApplicationDocument> {
    return await this.applicationRepository.findOne(
      { userId },
      { ...projection }
    );
  }
}
