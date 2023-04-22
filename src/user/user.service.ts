import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  ForbiddenException,
} from "@nestjs/common";
import {
  CreateUserDto,
  UpdateUserInfoRequest,
  ValidEmailDto,
  UserDto,
  updateEmailResultDto,
} from "./dtos";
import { User } from "./schemas";
import { UserRepository } from "./user.repository";
import {
  AuthErrorMessages,
  AuthServiceMessage,
  EmailMessage,
  Numbers,
  Role,
  UserErrorMessage,
  UserServiceMessage,
} from "src/common/constants";
import { UpdateRoleDto } from "./dtos/updateRole.dto";
import { generateToken, getCheckedSumAddress } from "src/common/helpers";

import { JwtUserDto } from "src/auth/dtos";
import { EmailService } from "src/email/email.service";
import { ConfigService } from "@nestjs/config";

const humanize = require("humanize-duration");

@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private emailService: EmailService,
    private config: ConfigService
  ) {}

  async create(user: CreateUserDto) {
    return await this.userRepository.create({ ...user });
  }

  async updateRole(wallet: string, role: Role): Promise<UpdateRoleDto> {
    await this.userRepository.updateOne(
      { walletAddress: getCheckedSumAddress(wallet) },
      { userRole: role }
    );

    return { wallet, role };
  }

  async findUser(
    query: UserDto,
    projection?: Record<string, number>
  ): Promise<User> {
    return await this.userRepository.findOne(query, { ...projection });
  }

  async getUserList(filter = {}): Promise<User[]> {
    return await this.userRepository.find(filter);
  }

  async getSortedUserByNonce(): Promise<User[]> {
    return await this.userRepository.sort({}, { nonce: 1 }, {});
  }

  async findUserByWallet(
    walletAddress: string,
    projection?: Record<string, number>
  ): Promise<User> {
    return await this.userRepository.findOne(
      { walletAddress },
      { ...projection }
    );
  }

  async findUserById(
    userId: string,
    projection?: Record<string, number>
  ): Promise<User> {
    return await this.userRepository.findOne(
      { _id: userId },
      { ...projection }
    );
  }
  async updateUserById(
    userId: string,
    data: UserDto,
    removeDataList?: Array<string>
  ): Promise<User> {
    return this.userRepository.findOneAndUpdate(
      { _id: userId },
      data,
      removeDataList
    );
  }

  async updateEmail(
    { email }: ValidEmailDto,
    user: JwtUserDto
  ): Promise<updateEmailResultDto> {
    const userData = await this.userRepository.findOne({ _id: user.userId });

    const userWithSameEmail = await this.userRepository.findOne(
      {
        email: email,
        emailVerifiedAt: { $exists: true },
      },
      { _id: 1 }
    );

    if (userWithSameEmail) {
      throw new ConflictException(AuthErrorMessages.EMAIL_IN_USE);
    }

    if (
      userData.emailTokenRequestedAt &&
      userData.emailTokenRequestedAt.getTime() +
        Numbers.EMAIL_TOKEN_RESEND_BOUND >
        Date.now()
    ) {
      throw new BadRequestException(
        `${AuthErrorMessages.WAIT_TIME_LIMIT} ${humanize(
          Math.ceil(
            Date.now() -
              userData.emailTokenRequestedAt.getTime() -
              Numbers.EMAIL_TOKEN_RESEND_BOUND
          ),
          { language: "en", round: true }
        )}`
      );
    }

    let emailToken: string = generateToken();

    try {
      await this.emailService.sendEmail(
        email,
        "Treejer - Verify your email",
        `<b>Verify your email by opening this link :</b><b>${this.config.get<string>(
          "APP_URL"
        )}/email/verify?token=${emailToken}</b>`
      );

      await this.userRepository.updateOne(
        { _id: user.userId },
        { emailToken, email, emailTokenRequestedAt: new Date() },
        ["emailVerifiedAt"]
      );
    } catch (e) {
      throw new InternalServerErrorException();
    }

    return { email, message: "Email token sent to your email address" };
  }

  async verifyEmail(token: string): Promise<string> {
    const user = await this.userRepository.findOne(
      { emailToken: token },
      { _id: 1, emailTokenRequestedAt: 1, emailVerifiedAt: 1 }
    );

    if (!user) throw new ForbiddenException(EmailMessage.INVALID_TOKEN);

    if (user.emailVerifiedAt)
      throw new ConflictException(AuthErrorMessages.YOU_HAVE_VERIFED_EMAIL);

    let bound = new Date(Date.now() - Numbers.EMAIL_VERIFY_BOUND);

    if (!user.emailTokenRequestedAt || user.emailTokenRequestedAt < bound) {
      throw new BadRequestException(
        `${Numbers.EMAIL_VERIFY_BOUND / 60000} ${
          UserErrorMessage.RESEND_EMAIL_MESSAGE
        }`
      );
    }

    await this.userRepository.updateOne(
      { _id: user._id },
      { emailVerifiedAt: new Date() },
      ["emailToken", "emailTokenRequestedAt"]
    );

    return UserServiceMessage.EMAIL_VERIFIED;
  }

  async resendEmailToken(user: JwtUserDto): Promise<string> {
    const userData = await this.userRepository.findOne(
      { _id: user.userId },
      { _id: 1, emailTokenRequestedAt: 1, emailVerifiedAt: 1, email: 1 }
    );

    if (userData.emailVerifiedAt)
      throw new ConflictException(AuthErrorMessages.YOU_HAVE_VERIFED_EMAIL);

    if (!userData.emailTokenRequestedAt) {
      throw new BadRequestException(AuthErrorMessages.EMAIL_ADDRESS_NOT_FOUND);
    }

    const bound = new Date(Date.now() - Numbers.EMAIL_TOKEN_RESEND_BOUND);

    if (
      userData.emailTokenRequestedAt &&
      userData.emailTokenRequestedAt > bound
    ) {
      throw new BadRequestException(
        `${AuthErrorMessages.WAIT_TIME_LIMIT} ${humanize(
          Math.ceil(
            userData.emailTokenRequestedAt.getTime() +
              Numbers.SMS_TOKEN_RESEND_BOUND -
              Date.now()
          ),
          { language: "en", round: true }
        )}`
      );
    }

    let emailToken: string = generateToken();

    try {
      await this.emailService.sendEmail(
        userData.email,
        "Treejer - Verify your email",
        `<b>Verify your email by opening this link :</b><b>${this.config.get<string>(
          "APP_URL"
        )}/email/verify?token=${emailToken}</b>`
      );
      await this.userRepository.updateOne(
        { _id: user.userId },
        {
          emailToken,
          email: userData.email,
          emailTokenRequestedAt: new Date(),
        }
      );
      return AuthServiceMessage.RESEND_VERIFICATION_EMAIL_TOKEN_SUCCESSFUL;
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

  async updateUserInfo(
    userNewData: UpdateUserInfoRequest,
    user: JwtUserDto
  ): Promise<UpdateUserInfoRequest> {
    await this.userRepository.updateOne(
      { _id: user.userId },
      { ...userNewData }
    );

    return { ...userNewData };
  }
}
