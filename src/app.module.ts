import { DownloadModule } from "./download/download.module";
// import { BugsnagModule } from "./bugsnag/bugsnag.module";
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
import { ServeStaticModule } from "@nestjs/serve-static";
import { CommandModule } from "nestjs-command";
import { BugsnagModule } from "./bugsnag/bugsnag.module";
import { join } from "path";
import { EtherValuesModule } from "./etherValues/etherValues.module";
import { TreeModule } from "./tree/tree.module";

@Module({
  imports: [
    DownloadModule,
    DownloadModule,
    BugsnagModule,
    CommandModule,
    Web3Module,
    PlantVerificationModule,
    DatabaseModule,
    UserModule,
    AuthModule,
    PlantModule,
    SmsModule,
    EmailModule,
    EtherValuesModule,
    TreeModule,
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "views"),
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
