import { Web3Module } from "./web3/web3.module";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database/database.module";
import { UserModule } from "./user/user.module";
import { PlantModule } from "./plant/plant.module";
import { PlantVerificationModule } from "./plantVerification/plantVerification.module";
import { SmsModule } from "./sms/sms.module";
import { EmailModule } from "./email/email.module";
import { AuthModule } from "./auth/auth.module";

import { CommandModule } from "nestjs-command";

@Module({
  imports: [
    CommandModule,
    Web3Module,
    PlantVerificationModule,
    DatabaseModule,
    UserModule,
    AuthModule,
    PlantModule,
    SmsModule,
    EmailModule,
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
