import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { filter } from "rxjs";
import { checkPublicKey, getCheckedSumAddress } from "src/common/helpers";
import { DownloadService } from "src/download/download.service";
import { SmsService } from "src/sms/sms.service";
import { UserService } from "src/user/user.service";

@Injectable()
export class AdminService {
  constructor(
    private userService: UserService,
    private downloadService: DownloadService,
    private smsSerice: SmsService
  ) {}

  async getUsers(filters) {
    try {
      const users = await this.userService.getUserList(filters);
      const data = users.map((el) => ({
        user: el,
        file: this.downloadService.findFileByUserId(el._id),
        // application:await this.applicationService.findApplicationByUserId(el._id)
      }));
      return JSON.stringify(data);
    } catch (error) {
      return new BadRequestException(error.toString());
    }
  }

  async getUserById(userId: string) {
    const user = await this.userService.findUserById(userId);
    if (!user) return new NotFoundException("User not found!");
    const file = await this.downloadService.findFileByUserId(userId);
    // const application = await this.applicationRespository.findOne({
    // where: { userId },
    // });

    return JSON.stringify({
      user,
      //application,
      file,
    });
  }

  async getUserByWallet(wallet) {
    const checkedSumWallet = getCheckedSumAddress(wallet);

    if (!checkPublicKey(checkedSumWallet))
      throw new BadRequestException("invalid wallet");

    const user = await this.userService.findUserByWallet(checkedSumWallet);
    if (!user) return new NotFoundException("User not found!");
    const file = await this.downloadService.findFileByUserId(user._id);
    // const application = await this.applicationRespository.findOne({
    //   where: { userId: user._id },
    // });
    return JSON.stringify({
      user,
      //application,
      file,
    });
  }

  async getApplications(filter) {
    return [];
  }

  async verifyUser(userId) {
    // const application = await this.applicationRespository.findOne({
    //   where: {userId},
    // });

    // if (!application)
    //   return new NotFoundError('Application is not submitted for this user');

    const user = await this.userService.findUserById(userId);
    if (user.isVerified) {
      return new BadRequestException("Already Verified");
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
    // const application = await this.applicationRespository.findOne({
    //   where: {userId},
    // });
    // if (!application)
    //   return new NotFoundError('Application is not submitted for this user');
    await this.userService.updateUserById(userId, { isVerified: false });
    return "Updated Successfully";
  }
}
