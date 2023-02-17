import { Injectable } from "@nestjs/common";
import { CreateUserDto } from "./dtos";
import { User } from "./schemas";
import { UserRepository } from "./user.repository";
@Injectable()
export class UserService {
  constructor(private userRepository: UserRepository) {}

  async create(user: CreateUserDto) {
    return await this.userRepository.create({ ...user });
  }
  async findUser(username: string): Promise<User> {
    return await this.userRepository.findOne({ username });
  }

  async getUserList() {
    return await this.userRepository.find({});
  }

  async getSortedUserByNonce() {
    return (await this.userRepository.find({})).sort(
      (a: any, b: any) => b.nonce - a.nonce
    );
  }

  async findUserByWallet(
    walletAddress: string,
    projection?: Record<string, null>
  ) {
    return await this.userRepository.findOne(
      { walletAddress },
      { ...projection }
    );
  }

  async findUserById(userId: string) {
    return await this.userRepository.findOne({ _id: userId });
  }
  async updateUserById(userId: string, data: any) {
    return this.userRepository.findOneAndUpdate({ _id: userId }, data);
  }
}
