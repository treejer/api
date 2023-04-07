import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";

import { ApplicationService } from "src/application/application.service";
import { AdminErrorMessage, AuthErrorMessages } from "src/common/constants";
import { checkPublicKey, getCheckedSumAddress } from "src/common/helpers";
import { DownloadService } from "src/download/download.service";
import { SmsService } from "src/sms/sms.service";
import { UserService } from "src/user/user.service";

@Injectable()
export class AdminService {
  constructor(
    private userService: UserService,
    private downloadService: DownloadService,
    private applicationService: ApplicationService,
    private smsSerice: SmsService
  ) {}

  async getUsers(filters) {
    try {
      const users = await this.userService.getUserList(filters);
      const data = users.map((el) => ({
        user: el,
        file: this.downloadService.findFileByUserId(el._id),
        application: this.applicationService.getApplicationByUserId(el._id),
      }));
      return JSON.stringify(data);
    } catch (error) {
      return new BadRequestException(error.toString());
    }
  }

  async getUserById(userId: string) {
    const user = await this.userService.findUserById(userId);
    if (!user) return new NotFoundException(AdminErrorMessage.USER_NOT_FOUND);
    const file = await this.downloadService.findFileByUserId(userId);
    const application = await this.applicationService.getApplicationByUserId(
      userId
    );

    return JSON.stringify({
      user,
      application,
      file,
    });
  }

  async getUserByWallet(wallet) {
    const checkedSumWallet = getCheckedSumAddress(wallet);

    if (!checkPublicKey(checkedSumWallet))
      throw new BadRequestException(AuthErrorMessages.INVALID_WALLET);

    const user = await this.userService.findUserByWallet(checkedSumWallet);
    if (!user) return new NotFoundException(AdminErrorMessage.USER_NOT_FOUND);
    const file = await this.downloadService.findFileByUserId(user._id);
    const application = await this.applicationService.getApplicationByUserId(
      user._id
    );
    return JSON.stringify({
      user,
      application,
      file,
    });
  }

  async getApplications(filters) {
    return await this.applicationService.getApplicationList(filters);
  }

  async verifyUser(userId) {
    const application = await this.applicationService.getApplicationByUserId(
      userId
    );

    if (!application)
      return new NotFoundException(AdminErrorMessage.APPLICATION_NOT_SUBMITTED);

    const user = await this.userService.findUserById(userId);
    if (user.isVerified) {
      return new BadRequestException(AdminErrorMessage.ALREADY_VERIFIED);
    }
    try {
      await this.userService.updateUserById(user._id, {
        isVerified: true,
      });
      if (user.mobile) {
        await this.smsSerice.sendSMS(
          `Your account is now verified by admins. \nTreejer`,
          user.mobile
        );
      }
      return "Updated Successfully";
    } catch (err) {
      return new InternalServerErrorException(err.toString());
    }
  }

  async rejectUser(userId) {
    const application = await this.applicationService.getApplicationByUserId(
      userId
    );
    if (!application)
      return new NotFoundException(AdminErrorMessage.APPLICATION_NOT_SUBMITTED);
    await this.userService.updateUserById(userId, { isVerified: false });
    return "Updated Successfully";
  }
}
