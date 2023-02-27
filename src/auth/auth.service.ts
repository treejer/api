import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";

import { ConfigService } from "@nestjs/config";
import { UserService } from "./../user/user.service";
import { JwtService } from "@nestjs/jwt";

import { Messages } from "./../common/constants";
import {
  getRandomNonce,
  checkPublicKey,
  getCheckedSumAddress,
  recoverPublicAddressfromSignature,
} from "./../common/helpers";

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
    private jwtService: JwtService
  ) {}

  getMe(userId: string) {
    return this.userService.findUserById(userId);
  }

  async getNonce(wallet: string) {
    const checkedSumWallet = getCheckedSumAddress(wallet);

    if (!checkPublicKey(checkedSumWallet))
      throw new BadRequestException("invalid wallet");

    let user = await this.userService.findUserByWallet(checkedSumWallet);

    const nonce = getRandomNonce();

    if (user) {
      return {
        message: Messages.SIGN_MESSAGE + user.nonce.toString(),
        userId: user._id,
      };
    }

    try {
      const newUser = await this.userService.create({
        nonce,
        walletAddress: checkedSumWallet,
        plantingNonce: 1,
      });

      return {
        message: Messages.SIGN_MESSAGE + newUser.nonce.toString(),
        userId: newUser._id,
      };
    } catch (error) {
      throw new InternalServerErrorException(error.toString());
    }
  }

  async loginWithWallet(walletAddress: string, signature: string) {
    const checkedSumWallet = getCheckedSumAddress(walletAddress);

    if (!checkPublicKey(checkedSumWallet))
      throw new BadRequestException("invalid wallet");

    const user = await this.userService.findUserByWallet(checkedSumWallet, {
      _id: 1,
      nonce: 1,
    });

    if (!user) throw new NotFoundException("user not exist");

    const message = Messages.SIGN_MESSAGE + user.nonce.toString();

    const msg = `0x${Buffer.from(message, "utf8").toString("hex")}`;
    const recoveredAddress: string = recoverPublicAddressfromSignature(
      signature,
      msg
    );

    if (getCheckedSumAddress(recoveredAddress) !== checkedSumWallet)
      throw new ForbiddenException("invalid credentials");

    const nonce: number = getRandomNonce();

    try {
      await this.userService.updateUserById(user._id, { nonce });

      return {
        access_token: await this.getAccessToken(user._id, checkedSumWallet),
      };
    } catch (error) {
      throw new InternalServerErrorException(error.toString());
    }
  }

  async getAccessToken(userId: string, walletAddress: string) {
    const payload = { userId, walletAddress };

    return this.jwtService.signAsync(payload, {
      expiresIn: 60 * 60 * 24 * 30,
      secret: this.configService.get<string>("JWT_SECRET"),
    });
  }

  //return 6 digit random token
  genRandomToken() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
