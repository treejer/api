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

import {
  AuthErrorMessages,
  AuthServiceMessage,
  Messages,
  Numbers,
} from "./../common/constants";
import {
  getRandomNonce,
  checkPublicKey,
  getCheckedSumAddress,
  recoverPublicAddressfromSignature,
  getRandomInteger,
} from "./../common/helpers";
import {
  CreateUserMobileDto,
  LoginResultDto,
  NonceResultDto,
  SendVerificationCodeResultDto,
  UserEditDataDto,
} from "./dtos";
import { UserMobileRepository } from "./auth.repository";
const humanize = require("humanize-duration");
import { SmsService } from "src/sms/sms.service";

import { CreateUserDto } from "src/user/dtos";

import { MagicAuthService } from "src/magicAuth/magicAuth.service";

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
    private jwtService: JwtService,
    private smsService: SmsService,
    private userMobileRepository: UserMobileRepository,
    private magicAuthService: MagicAuthService,
  ) {}

  async getNonce(
    wallet: string,
    token: string,
    email: string,
    mobile: string,
    country: string,
  ): Promise<NonceResultDto> {
    const checkedSumWallet = getCheckedSumAddress(wallet);

    token = token?.trim();
    email = email?.trim();
    mobile = mobile?.trim();
    country = country?.trim();

    if (!checkPublicKey(checkedSumWallet))
      throw new BadRequestException(AuthErrorMessages.INVALID_WALLET);

    let magicUserMetadata;
    if (token) {
      try {
        magicUserMetadata = await this.magicAuthService.getUserMetaData(token);
      } catch (e) {
        throw new BadRequestException(e.message);
      }
    }

    if (email) {
      if (
        await this.userService.findUser({
          emailVerifiedAt: { $exists: true },
          email,
          walletAddress: { $ne: checkedSumWallet },
        })
      ) {
        throw new BadRequestException("email already in use");
      }

      if (magicUserMetadata?.email?.toLowerCase() === email.toLowerCase()) {
        throw new ForbiddenException("Invalid Access");
      }
    }

    if (mobile) {
      if (
        await this.userService.findUser({
          walletAddress: { $ne: checkedSumWallet },
          mobile,
          mobileVerifiedAt: { $exists: true },
        })
      ) {
        throw new BadRequestException("email already in use");
      }

      if (magicUserMetadata?.phoneNumber?.toLowerCase() === mobile) {
        throw new ForbiddenException("Invalid Access");
      }
    }

    let user = await this.userService.findUserByWallet(checkedSumWallet);

    const nonce = getRandomNonce();

    if (user) {
      const prevUser: UserEditDataDto = {};

      if (email && !user.emailVerifiedAt) {
        prevUser.email = email;
        prevUser.emailVerifiedAt = new Date();

        await this.userService.updateUserById(user._id, prevUser);

        await this.magicAuthService.createMagicAuth({
          walletAddress: checkedSumWallet,
          email,
          createdAt: new Date(),
          userId: user._id,
          issuer: magicUserMetadata?.issuer ?? undefined,
          oauthProvider: magicUserMetadata.oauthProvider ?? undefined,
        });
      }

      if (mobile && !user.mobileVerifiedAt) {
        prevUser.mobileCountry = country;
        prevUser.mobile = mobile;
        prevUser.mobileVerifiedAt = new Date();

        await this.userService.updateUserById(user._id, prevUser);

        await this.userMobileRepository.create({
          userId: user._id,
          number: mobile,
          verifiedAt: new Date(),
          createdAt: new Date(),
        });

        await this.magicAuthService.createMagicAuth({
          walletAddress: checkedSumWallet,
          createdAt: new Date(),
          userId: user._id,
          issuer: magicUserMetadata?.issuer ?? undefined,
          oauthProvider: magicUserMetadata.oauthProvider ?? undefined,
          mobile,
        });
      }

      return {
        message: Messages.SIGN_MESSAGE + user.nonce.toString(),
        userId: user._id,
      };
    }

    const newUserObject: CreateUserDto = {
      createdAt: new Date(),
      walletAddress: checkedSumWallet,
      updatedAt: new Date(),
      nonce,
      mobileCodeRequestsCountForToday: 0,
      isVerified: false,
      plantingNonce: 1,
    };

    if (email) {
      newUserObject.email = email;
      newUserObject.emailVerifiedAt = new Date();
    }

    if (mobile) {
      newUserObject.mobile = mobile;
      newUserObject.mobileCountry = country;
      newUserObject.mobileVerifiedAt = new Date();
    }

    const newUser = await this.userService.create(newUserObject);

    if (email) {
      await this.magicAuthService.createMagicAuth({
        walletAddress: checkedSumWallet,
        email,
        createdAt: new Date(),
        userId: newUser._id,
        issuer: magicUserMetadata?.issuer ?? undefined,
        oauthProvider: magicUserMetadata.oauthProvider ?? undefined,
      });
    }

    if (mobile) {
      await this.userMobileRepository.create({
        userId: newUser._id,
        number: mobile,
        verifiedAt: new Date(),
        createdAt: new Date(),
      });
      await this.magicAuthService.createMagicAuth({
        walletAddress: checkedSumWallet,
        createdAt: new Date(),
        userId: newUser._id,
        issuer: magicUserMetadata?.issuer ?? undefined,
        oauthProvider: magicUserMetadata.oauthProvider ?? undefined,
        mobile,
      });
    }

    return {
      message: Messages.SIGN_MESSAGE + newUser.nonce.toString(),
      userId: newUser._id,
    };
  }
  async loginWithWallet(
    walletAddress: string,
    signature: string,
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
      msg,
    );

    if (getCheckedSumAddress(recoveredAddress) !== checkedSumWallet)
      throw new ForbiddenException(AuthErrorMessages.INVALID_CREDENTIALS);

    const nonce: number = getRandomNonce();

    await this.userService.updateUserById(user._id, { nonce });

    return {
      access_token: await this.getAccessToken(user._id, checkedSumWallet),
    };
  }

  async patchMobileNumber(
    userId: string,
    mobileNumber: string,
    country: string,
  ): Promise<SendVerificationCodeResultDto> {
    const user = await this.userService.findUserById(userId);

    const userWithSameMobile = await this.userService.findUser(
      {
        mobile: mobileNumber,
        mobileVerifiedAt: { $exists: true },
      },
      { _id: 1 },
    );

    if (userWithSameMobile) {
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
              Numbers.SMS_TOKEN_RESEND_BOUND,
          ),
          { language: "en", round: true },
        )}`,
      );
    }

    const code: number = getRandomInteger(100000, 999999);

    try {
      await this.smsService.sendSMS(
        `${code} is your Treejer verification code. this code expires in ${
          Numbers.SMS_VERIFY_BOUND / 1000 / 60
        } minutes`,
        mobileNumber,
      );

      await this.userService.updateUserById(
        user._id,
        {
          mobileCode: code,
          mobileCountry: country,
          mobile: mobileNumber,
          mobileCodeRequestedAt: new Date(),
          mobileCodeRequestsCountForToday:
            user.mobileCodeRequestsCountForToday + 1,
        },
        ["mobileVerifiedAt"],
      );

      return {
        message: AuthServiceMessage.RESEND_VERIFICATION_CODE_SUCCESSFUL,
        mobileCountry: country,
        mobile: mobileNumber,
      };
    } catch (error) {
      if (error && error.code === 21211) {
        throw new BadRequestException(AuthErrorMessages.PHONE_NUMBER_WRONG);
      }
      throw new InternalServerErrorException();
    }
  }

  async verifyMobileCode(
    userId: string,
    verificationCode: string,
  ): Promise<string> {
    const user = await this.userService.findUserById(userId);

    if (user.mobileVerifiedAt)
      throw new ConflictException(AuthErrorMessages.YOU_HAVE_VERIFED_MOBILE);

    const bound = new Date(Date.now() - Numbers.SMS_VERIFY_BOUND);

    if (!user.mobileCodeRequestedAt || user.mobileCodeRequestedAt < bound) {
      throw new BadRequestException(
        `${Numbers.SMS_VERIFY_BOUND / 60000} ${
          AuthErrorMessages.EXPIRED_MOBILECODE_MESSAGE
        }`,
      );
    }

    if (!user.mobileCode || user.mobileCode !== Number(verificationCode)) {
      throw new ForbiddenException(AuthErrorMessages.INVLID_MOBILECODE);
    }
    await this.userService.updateUserById(
      userId,
      {
        mobileVerifiedAt: new Date(),
      },
      ["mobileCode", "mobileCodeRequestedAt"],
    );
    await this.createUserMobile({
      number: user.mobile,
      userId,
      createdAt: new Date(),
      verifiedAt: new Date(),
    });

    return AuthServiceMessage.MOBILE_VERIFIED;
  }

  async resendMobileCode(userId: string): Promise<string> {
    const bound = new Date(Date.now() - Numbers.SMS_TOKEN_RESEND_BOUND);
    const user = await this.userService.findUserById(userId);

    if (user.mobileVerifiedAt)
      throw new ConflictException(AuthErrorMessages.YOU_HAVE_VERIFED_MOBILE);

    if (!user.mobileCodeRequestedAt) {
      throw new BadRequestException(AuthErrorMessages.MOBILE_NUMBER_NOT_FOUND);
    }

    if (user.mobileCodeRequestedAt && user.mobileCodeRequestedAt > bound) {
      throw new BadRequestException(
        `${AuthErrorMessages.WAIT_TIME_LIMIT} ${humanize(
          Math.ceil(
            user.mobileCodeRequestedAt.getTime() +
              Numbers.SMS_TOKEN_RESEND_BOUND -
              Date.now(),
          ),
          { language: "en", round: true },
        )}`,
      );
    }

    const code: number = getRandomInteger(100000, 999999);

    try {
      await this.smsService.sendSMS(
        `${code} is your Treejer verification code. this code expires in ${
          Numbers.SMS_VERIFY_BOUND / 1000 / 60
        } minutes`,
        user.mobile,
      );

      await this.userService.updateUserById(user._id, {
        mobileCode: code,
        mobileCodeRequestedAt: new Date(),
        mobileCodeRequestsCountForToday:
          user.mobileCodeRequestsCountForToday + 1,
      });

      return AuthServiceMessage.RESEND_VERIFICATION_CODE_SUCCESSFUL;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async createUserMobile(userMobileDto: CreateUserMobileDto) {
    return await this.userMobileRepository.create({ ...userMobileDto });
  }

  async getAccessToken(userId: string, walletAddress: string): Promise<string> {
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
}
