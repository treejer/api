import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import * as ESU from "eth-sig-util";
import { ConfigService } from "@nestjs/config";
import { UserService } from "./../user/user.service";
import { JwtService } from "@nestjs/jwt";

import { VerificationRepository } from "./auth.repository";
import { Messages } from "./../common/constants";
import {
  getRandomNonce,
  checkPublicKey,
  getCheckedSumAddress,
} from "./../common/helpers";

@Injectable()
export class AuthService {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
    private jwtService: JwtService,
    private authRepo: VerificationRepository
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

  async loginWithWallet(walletAddress: string, signature: string) {
    const checkedSumWallet = getCheckedSumAddress(walletAddress);

    if (!checkPublicKey(checkedSumWallet))
      throw new BadRequestException("invalid wallet");

    const user = await this.userService.findUserByWallet(checkedSumWallet, {
      _id: 1,
    });

    if (!user) throw new NotFoundException("user not exist");

    const message = Messages.SIGN_MESSAGE + user.nonce.toString();
    const msg = `0x${Buffer.from(message, "utf8").toString("hex")}`;
    const recoveredAddress: string = ESU.recoverPersonalSignature({
      data: msg,
      sig: signature,
    });

    if (getCheckedSumAddress(recoveredAddress) !== checkedSumWallet)
      throw new ForbiddenException("invalid credentials");

    const nonce: number = getRandomNonce();

    await this.userService.updateUserById(user._id, { nonce });

    return {
      access_token: await this.getAccessToken(user._id, checkedSumWallet),
    };
  }

  async getAccessToken(userId: string, walletAddress: string) {
    const payload = { userId, walletAddress };

    return this.jwtService.signAsync(payload, {
      expiresIn: 60 * 60 * 24 * 30,
      secret: this.configService.get<string>("JWT_SECRET"),
    });
  }

  async getTokens(userId: string, username: string) {
    const payload = { sub: userId, username };
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: 60 * 15,
        secret: "at-secret",
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: 60 * 60 * 24,
        secret: "rt-secret",
      }),
    ]);

    return { access_token: at, refresh_token: rt };
  }

  //return 6 digit random token
  genRandomToken() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
