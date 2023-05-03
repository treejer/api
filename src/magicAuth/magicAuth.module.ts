import { Module } from "@nestjs/common";

import { JwtModule } from "@nestjs/jwt";
import { UserModule } from "./../user/user.module";

import { MagicAuthService } from "./magicAuth.service";

import { MagicAuthRepository } from "./magicAuth.repository";
import { MagicAuth, MagicAuthSchema } from "./schemas";
import { MongooseModule } from "@nestjs/mongoose";
import { DatabaseModule } from "./../database/database.module";

@Module({
  imports: [
    UserModule,
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: MagicAuth.name, schema: MagicAuthSchema },
    ]),
    DatabaseModule,
  ],
  controllers: [],
  providers: [MagicAuthRepository, MagicAuthService],
  exports: [MagicAuthService],
})
export class MagicAuthModule {}
