import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { UserModule } from "./../user/user.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

import { AtStrategy, RolesGuard, RtStrategy } from "./strategies";
import { VerificationRepository } from "./auth.repository";
import { Verification, VerificationSchema } from "./schemas";
import { MongooseModule } from "@nestjs/mongoose";
import { DatabaseModule } from "./../database/database.module";
import { UserService } from "../user/user.service";
@Module({
  imports: [
    UserModule,
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: Verification.name, schema: VerificationSchema },
    ]),
    DatabaseModule,
  ],
  controllers: [AuthController],
  providers: [
    VerificationRepository,
    AuthService,
    ConfigService,
    AtStrategy,
    RolesGuard,
  ],
  exports: [AuthService, AtStrategy, RolesGuard],
})
export class AuthModule {}
