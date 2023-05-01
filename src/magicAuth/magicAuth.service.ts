import { Magic } from "@magic-sdk/admin";
import { Injectable } from "@nestjs/common";
import { checkClientMagicToken } from "src/common/helpers/magic";
import { CreateMagicAuthDto, UserMetadataResultDto } from "./dto";
import { MagicAuthRepository } from "./magicAuth.repository";

const magic = new Magic(process.env.MAGIC_SECRET_API_KEY);

@Injectable()
export class MagicAuthService {
  constructor(private magicAuthRepository: MagicAuthRepository) {}

  async createMagicAuth(magicAuth: CreateMagicAuthDto) {
    return await this.magicAuthRepository.create({ ...magicAuth });
  }

  async getUserMetaData(token: string): Promise<UserMetadataResultDto> {
    let tempToken = checkClientMagicToken(token);
    return await magic.users.getMetadataByToken(tempToken);
  }
}
