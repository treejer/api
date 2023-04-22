import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";

import { ApplicationService } from "src/application/application.service";
import { ApplicationResultDto } from "src/application/dtos";
import { Application } from "src/application/schemas";
import {
  AdminErrorMessage,
  AdminServiceMessage,
  AuthErrorMessages,
} from "src/common/constants";
import { checkPublicKey, getCheckedSumAddress } from "src/common/helpers";
import { DownloadService } from "src/download/download.service";
import { SmsService } from "src/sms/sms.service";
import { UserService } from "src/user/user.service";
import { GetUserResultDto } from "./dto";

@Injectable()
export class AdminService {
  constructor(
    private userService: UserService,
    private downloadService: DownloadService,
    private applicationService: ApplicationService,
    private smsService: SmsService
  ) {}

  async getUsers(filters): Promise<GetUserResultDto[]> {
    try {
      const users = await this.userService.getUserList(filters);
      // @ts-ignore
      const data: GetUserResultDto[] = await Promise.all(
        users.map((el) => {
          return new Promise(async (resolve, reject) => {
            resolve({
              user: el,
              file: await this.downloadService.findFileByUserId(el._id),
              application: await this.applicationService.getApplicationByUserId(
                el._id
              ),
            });
          });
        })
      );

      return data;
    } catch (error) {
      throw new InternalServerErrorException(error.toString());
    }
  }

  async getUserById(userId: string): Promise<GetUserResultDto> {
    const user = await this.userService.findUserById(userId);
    if (!user) throw new NotFoundException(AdminErrorMessage.USER_NOT_FOUND);
    const file = await this.downloadService.findFileByUserId(userId);
    const application = await this.applicationService.getApplicationByUserId(
      userId
    );

    return {
      user,
      application,
      file,
    };
  }

  async getUserByWallet(wallet: string): Promise<GetUserResultDto> {
    const checkedSumWallet = getCheckedSumAddress(wallet);

    if (!checkPublicKey(checkedSumWallet))
      throw new BadRequestException(AuthErrorMessages.INVALID_WALLET);

    const user = await this.userService.findUserByWallet(checkedSumWallet);

    if (!user) throw new NotFoundException(AdminErrorMessage.USER_NOT_FOUND);

    const file = await this.downloadService.findFileByUserId(user._id);

    const application = await this.applicationService.getApplicationByUserId(
      user._id
    );

    return {
      user,
      application,
      file,
    };
  }

  async getApplications(filters): Promise<ApplicationResultDto[]> {
    return await this.applicationService.getApplicationList(filters);
  }

  async verifyUser(userId: string): Promise<string> {
    const application = await this.applicationService.getApplicationByUserId(
      userId
    );

    if (!application)
      throw new NotFoundException(AdminErrorMessage.APPLICATION_NOT_SUBMITTED);

    const user = await this.userService.findUserById(userId);

    if (user.isVerified) {
      throw new ConflictException(AdminErrorMessage.ALREADY_VERIFIED);
    }

    try {
      await this.userService.updateUserById(user._id, {
        isVerified: true,
      });

      if (user.mobile) {
        await this.smsService.sendSMS(
          `Your account is now verified by admins. \nTreejer`,
          user.mobile
        );
      }
      return AdminServiceMessage.VERIFY_MESSAGE;
    } catch (err) {
      throw new InternalServerErrorException(err.toString());
    }
  }

  async rejectUser(userId: string): Promise<string> {
    const application = await this.applicationService.getApplicationByUserId(
      userId
    );
    if (!application)
      throw new NotFoundException(AdminErrorMessage.APPLICATION_NOT_SUBMITTED);
    await this.userService.updateUserById(userId, { isVerified: false });
    return AdminServiceMessage.REJECT_MESSAGE;
  }
}
