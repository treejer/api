import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { ApplicationModule } from "src/application/application.module";
import { DownloadModule } from "src/download/download.module";
import { SmsModule } from "src/sms/sms.module";
import { UserModule } from "./../user/user.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [UserModule, DownloadModule, SmsModule, ApplicationModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
