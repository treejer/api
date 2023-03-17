import { Injectable, UnauthorizedException } from "@nestjs/common";
import { CreateUserDto, UpdateUserInfoRequest, ValidEmailDto } from "./dtos";
import { User } from "./schemas";
import { UserRepository } from "./user.repository";
import { AuthErrorMessages, Role } from "src/common/constants";
import { UpdateRoleDto } from "./dtos/updateRole.dto";
import { getCheckedSumAddress } from "src/common/helpers";

import { JwtUserDto } from "src/auth/dtos";

@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async create(user: CreateUserDto) {
    return await this.userRepository.create({ ...user });
  }

  async updateRole(wallet: string, role: Role): Promise<UpdateRoleDto> {
    await this.userRepository.updateOne(
      { walletAddress: getCheckedSumAddress(wallet) },
      { userRole: role },
    );

    return { wallet, role };
  }

  async findUser(username: string): Promise<User> {
    return await this.userRepository.findOne({ username });
  }

  async getUserList() {
    return await this.userRepository.find({});
  }

  async getSortedUserByNonce() {
    return await this.userRepository.sort({}, { nonce: 1 }, {});
  }

  async findUserByWallet(
    walletAddress: string,
    projection?: Record<string, number>,
  ) {
    return await this.userRepository.findOne(
      { walletAddress },
      { ...projection },
    );
  }

  async findUserById(userId: string) {
    return await this.userRepository.findOne({ _id: userId });
  }
  async updateUserById(userId: string, data: any) {
    return this.userRepository.findOneAndUpdate({ _id: userId }, data);
  }

  async updateUserInfo(
    userId: string,
    userNewData: UpdateUserInfoRequest,
    user: JwtUserDto,
  ): Promise<UpdateUserInfoRequest> {
    if (userId !== user.userId)
      throw new UnauthorizedException(AuthErrorMessages.INVALID_ID);

    await this.userRepository.updateOne({ _id: userId }, { ...userNewData });

    return { ...userNewData };
  }

  async updateUserEmail(email: ValidEmailDto, user: JwtUserDto) {}
}
