import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { DownloadModule } from "src/download/download.module";
import { EmailModule } from "src/email/email.module";
import { SmsModule } from "src/sms/sms.module";
import { UserModule } from "./../user/user.module";
import { ApplicationController } from "./application.controller";
import { ApplicationRepository } from "./application.repository";
import { ApplicationService } from "./application.service";
import { Application, ApplicationSchema } from "./schemas";

@Module({
  imports: [
    UserModule,
    DownloadModule,
    EmailModule,
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
    ]),
  ],
  controllers: [ApplicationController],
  providers: [ApplicationService, ApplicationRepository],
  exports: [ApplicationService],
})
export class ApplicationModule {}
