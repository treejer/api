import { BadRequestException, Injectable } from "@nestjs/common";
import { ApplicationRepository } from "./application.repository";
import {
  ApplicationStatuses,
  ApplicationTypes,
  FileModules,
} from "src/common/constants";
import { Application } from "./schemas";
import { UserService } from "src/user/user.service";
import { EmailService } from "src/email/email.service";
import { DownloadService } from "src/download/download.service";
@Injectable()
export class ApplicationService {
  constructor(
    private applicationRepository: ApplicationRepository,
    private userServie: UserService,
    private emailService: EmailService,
    private downloadService: DownloadService
  ) {}

  async updateUser(userId, updateData, req) {
    if (
      await this.applicationRepository.findOne({
        $or: [
          { userId: userId, status: ApplicationStatuses.ACCEPTED },
          { userId: userId, status: ApplicationStatuses.REJECTED },
        ],
      })
    ) {
      return new BadRequestException("Application already submitted");
    }

    const { encoding, filename, mimetype, originalname, size } =
      await this.downloadService.uploadFile(req);

    const file = await this.downloadService.create({
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
    } = updateData;

    if (
      !Object.values(ApplicationTypes).includes(
        Number(type) as ApplicationTypes
      )
    ) {
      return new BadRequestException("Invalid parameters");
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
      idCard: file._id,
    });

    await this.downloadService.updateFileById(file._id, {
      targetId: applicationOne._id,
    });

    await this.emailService.notifyAdmin(
      "Application Submitted",
      `An application submitted for user with id ${userId}; \r\n` +
        `FirstName: ${firstName} \r\n` +
        `LastName: ${lastName} \r\n`
    );
    return "All done!";
  }

  async getApplicationList(filters = {}) {
    return await this.applicationRepository.find(filters);
  }

  async getApplicationById(_id: string, projection?: Record<string, number>) {
    return await this.applicationRepository.findOne({ _id }, { ...projection });
  }

  async getApplicationByUserId(
    userId: string,
    projection?: Record<string, number>
  ) {
    return await this.applicationRepository.findOne(
      { userId },
      { ...projection }
    );
  }
}
