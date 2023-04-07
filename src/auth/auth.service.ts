import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";

import { ConfigService } from "@nestjs/config";
import { UserService } from "./../user/user.service";
import { JwtService } from "@nestjs/jwt";

import { AuthErrorMessages, Messages, Numbers } from "./../common/constants";
import {
  getRandomNonce,
  checkPublicKey,
  getCheckedSumAddress,
  recoverPublicAddressfromSignature,
  getRandomInteger,
} from "./../common/helpers";
import { CreateUserMobileDto, LoginResultDto, NonceResultDto } from "./dtos";
import { UserMobileRepository } from "./auth.repository";
const humanize = require("humanize-duration");
import { SmsService } from "src/sms/sms.service";
@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
    private jwtService: JwtService,
    private smsService: SmsService,
    private userMobileRepository: UserMobileRepository
  ) {}

  async getNonce(wallet: string): Promise<NonceResultDto> {
    const checkedSumWallet = getCheckedSumAddress(wallet);

    if (!checkPublicKey(checkedSumWallet))
      throw new BadRequestException(AuthErrorMessages.INVALID_WALLET);

    let user = await this.userService.findUserByWallet(checkedSumWallet);

    const nonce = getRandomNonce();

    if (user) {
      return {
        message: Messages.SIGN_MESSAGE + user.nonce.toString(),
        userId: user._id,
      };
    }

    const newUser = await this.userService.create({
      nonce,
      walletAddress: checkedSumWallet,
      plantingNonce: 1,
    });

    return {
      message: Messages.SIGN_MESSAGE + newUser.nonce.toString(),
      userId: newUser._id,
    };
  }

  async loginWithWallet(
    walletAddress: string,
    signature: string
  ): Promise<LoginResultDto> {
    const checkedSumWallet = getCheckedSumAddress(walletAddress);

    if (!checkPublicKey(checkedSumWallet))
      throw new BadRequestException(AuthErrorMessages.INVALID_WALLET);

    const user = await this.userService.findUserByWallet(checkedSumWallet, {
      _id: 1,
      nonce: 1,
    });

    if (!user) throw new NotFoundException(AuthErrorMessages.USER_NOT_EXIST);

    const message = Messages.SIGN_MESSAGE + user.nonce.toString();

    const msg = `0x${Buffer.from(message, "utf8").toString("hex")}`;
    const recoveredAddress: string = recoverPublicAddressfromSignature(
      signature,
      msg
    );

    if (getCheckedSumAddress(recoveredAddress) !== checkedSumWallet)
      throw new ForbiddenException(AuthErrorMessages.INVALID_CREDENTIALS);

    const nonce: number = getRandomNonce();

    await this.userService.updateUserById(user._id, { nonce });

    return {
      access_token: await this.getAccessToken(user._id, checkedSumWallet),
    };
  }

  async verifyMobileCode(userId: string, verificationCode: number) {
    const bound = new Date(Date.now() - Numbers.SMS_VERIFY_BOUND);
    const user = await this.userService.findUserById(userId);

    if (user.mobileVerifiedAt)
      throw new ConflictException(AuthErrorMessages.MOBILE_ALREADY_VERIFIED);

    if (!user.mobileCodeRequestedAt || user.mobileCodeRequestedAt < bound) {
      throw new BadRequestException(
        `${Numbers.SMS_VERIFY_BOUND / 60000} ${
          AuthErrorMessages.EXPIRED_MOBILECODE_MESSAGE
        }`
      );
    }

    if (!user.mobileCode || user.mobileCode !== Number(verificationCode)) {
      throw new ForbiddenException(AuthErrorMessages.INVLID_MOBILECODE);
    }
    await this.userService.updateUserById(userId, {
      mobileVerifiedAt: new Date(),
      mobileCode: undefined,
    });
    await this.createUserMobile({
      number: user.mobile,
      userId,
      createdAt: new Date(),
      verifiedAt: new Date(),
    });
  }

  async patchMobileNumber(userId, mobileNumber, country) {
    const user = await this.userService.findUserById(userId);
    const userWithSameMobile = await this.userService.findUser({
      mobile: mobileNumber,
    });

    if (
      userWithSameMobile &&
      userWithSameMobile._id !== user._id &&
      !!userWithSameMobile.mobileVerifiedAt
    ) {
      throw new ConflictException(AuthErrorMessages.MOBILE_IN_USE);
    }

    if (
      user.mobileCodeRequestedAt &&
      user.mobileCodeRequestedAt.getTime() + Numbers.SMS_TOKEN_RESEND_BOUND >
        Date.now()
    ) {
      throw new BadRequestException(
        `${AuthErrorMessages.WAIT_TIME_LIMIT} ${humanize(
          Math.ceil(
            Date.now() -
              user.mobileCodeRequestedAt.getTime() -
              Numbers.SMS_TOKEN_RESEND_BOUND
          ),
          { language: "en", round: true }
        )}`
      );
    }

    const code: number = getRandomInteger(100000, 999999);

    try {
      await this.smsService.sendSMS(
        `${code} is your Treejer verification code. this code expires in ${
          Numbers.SMS_VERIFY_BOUND / 1000 / 60
        } minutes`,
        mobileNumber
      );

      await this.userService.updateUserById(user._id, {
        mobileCode: code,
        mobileCountry: country,
        mobile: mobileNumber,
        mobileCodeRequestedAt: new Date(),
        mobileCodeRequestsCountForToday:
          user.mobileCodeRequestsCountForToday + 1,
      });

      return "Verification code sent to your mobile number!";
    } catch (error) {
      console.log("error", error);
    }
  }

  async resendMobileCode(userId) {
    const bound = new Date(Date.now() - Numbers.SMS_TOKEN_RESEND_BOUND);
    const user = await this.userService.findUserById(userId);
    if (user.mobileVerifiedAt)
      throw new ForbiddenException(AuthErrorMessages.MOBILE_ALREADY_VERIFIED);

    if (user.mobileCodeRequestedAt && user.mobileCodeRequestedAt > bound) {
      throw new BadRequestException(
        `${AuthErrorMessages.WAIT_TIME_LIMIT} ${humanize(
          Math.ceil(
            user.mobileCodeRequestedAt.getTime() +
              Numbers.SMS_TOKEN_RESEND_BOUND -
              Date.now()
          ),
          { language: "en", round: true }
        )}`
      );
    }

    let codeExpired = false;

    if (user.mobileCodeRequestedAt) {
      codeExpired =
        Date.now() - user.mobileCodeRequestedAt?.getTime() >
        Numbers.SMS_VERIFY_BOUND;
    }

    const code: number =
      user.mobile && user.mobileCode && !codeExpired
        ? user.mobileCode
        : getRandomInteger(100000, 999999);

    try {
      await this.smsService.sendSMS(
        `${code} is your Treejer verification code. this code expires in ${
          Numbers.SMS_VERIFY_BOUND / 1000 / 60
        } minutes`,
        user.mobile
      );

      await this.userService.updateUserById(user._id, {
        mobileCode: code,
        mobileCodeRequestedAt: new Date(),
        mobileCodeRequestsCountForToday:
          user.mobileCodeRequestsCountForToday + 1,
      });

      return "Verification code sent to your mobile number!";
    } catch (error) {
      console.log("error", error);
    }
  }
  async createUserMobile(userMobileDto: CreateUserMobileDto) {
    return await this.userMobileRepository.create({ ...userMobileDto });
  }

  async getAccessToken(userId: string, walletAddress: string) {
    const payload = { userId, walletAddress };
    try {
      return this.jwtService.signAsync(payload, {
        expiresIn: 60 * 60 * 24 * 30,
        secret: this.configService.get<string>("JWT_SECRET"),
      });
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  //return 6 digit random token
  genRandomToken() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
