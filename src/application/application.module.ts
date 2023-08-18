import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { DownloadModule } from "src/download/download.module";
import { EmailModule } from "src/email/email.module";
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
