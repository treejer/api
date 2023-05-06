import { Magic } from "@magic-sdk/admin";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { checkClientMagicToken } from "src/common/helpers/magic";
import { CreateMagicAuthDto, UserMetadataResultDto } from "./dto";
import { MagicAuthRepository } from "./magicAuth.repository";

@Injectable()
export class MagicAuthService {
  private magic;
  constructor(
    private magicAuthRepository: MagicAuthRepository,
    private configService: ConfigService
  ) {
    this.magic = new Magic(configService.get<string>("MAGIC_SECRET_API_KEY"));

    console.log(
      "magic",
      configService.get<string>("MAGIC_SECRET_API_KEY")[22],
      configService.get<string>("MAGIC_SECRET_API_KEY")[23]
    );
  }

  async createMagicAuth(magicAuth: CreateMagicAuthDto) {
    return await this.magicAuthRepository.create({ ...magicAuth });
  }

  async getUserMetaData(token: string): Promise<UserMetadataResultDto> {
    let tempToken = checkClientMagicToken(token);
    return await this.magic.users.getMetadataByToken(tempToken);
  }
}
