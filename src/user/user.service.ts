import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import {
  CreateUserDto,
  UpdateUserInfoRequest,
  ValidEmailDto,
  UserDto,
} from "./dtos";
import { User } from "./schemas";
import { UserRepository } from "./user.repository";
import { AuthErrorMessages, EmailMessage, Role } from "src/common/constants";
import { UpdateRoleDto } from "./dtos/updateRole.dto";
import { generateToken, getCheckedSumAddress } from "src/common/helpers";

import { JwtUserDto } from "src/auth/dtos";
import { EmailService } from "src/email/email.service";
import { ConfigService } from "@nestjs/config";

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

  async findUser(query: UserDto): Promise<User> {
    return await this.userRepository.findOne(query);
  }

  async getUserList(filter = {}) {
    return await this.userRepository.find(filter);
  }

  async getSortedUserByNonce() {
    return await this.userRepository.sort({}, { nonce: 1 }, {});
  }

  async findUserByWallet(
    walletAddress: string,
    projection?: Record<string, number>
  ) {
    return await this.userRepository.findOne(
      { walletAddress },
      { ...projection }
    );
  }

  async findUserById(userId: string) {
    return await this.userRepository.findOne({ _id: userId });
  }
  async updateUserById(userId: string, data: UserDto) {
    return this.userRepository.findOneAndUpdate({ _id: userId }, data);
  }

  async updateUserInfo(
    userId: string,
    userNewData: UpdateUserInfoRequest,
    user: JwtUserDto
  ): Promise<UpdateUserInfoRequest> {
    if (userId !== user.userId)
      throw new UnauthorizedException(AuthErrorMessages.INVALID_ID);

    await this.userRepository.updateOne({ _id: userId }, { ...userNewData });

    return { ...userNewData };
  }

  async updateEmail(
    { email }: ValidEmailDto,
    user: JwtUserDto
  ): Promise<ValidEmailDto> {
    let emailToken: string = generateToken();

    await this.emailService.sendEmail(
      email,
      "Treejer - Verify your emtail",
      "Verify your email by opening this link : \n" +
        `${this.config.get<string>("APP_URL")}/email/verify?token=${emailToken}`
    );

    await this.userRepository.updateOne(
      { _id: user.userId },
      { emailToken, email, emailTokenRequestedAt: new Date() },
      ["emailVerifiedAt"]
    );

    return { email };
  }

  async verifyEmail(token: string) {
    const user = await this.userRepository.findOne(
      { emailToken: token },
      { _id: 1, emailTokenRequestedAt: 1 }
    );

    if (!user) throw new BadRequestException(EmailMessage.INVALID_TOKEN);

    let bound = new Date(
      Date.now() - this.config.get<number>("EMAIL_VERIFY_BOUND")
    );

    if (!user.emailTokenRequestedAt || user.emailTokenRequestedAt < bound) {
      throw new BadRequestException(
        `${
          this.config.get<number>("EMAIL_VERIFY_BOUND") / 60000
        } minutes to verify has expired. please request another email`
      );
    }

    await this.userRepository.updateOne(
      { _id: user._id },
      { emailVerifiedAt: new Date() },
      ["emailToken", "emailVerifiedAt"]
    );

    return "Email verified";
  }
}
