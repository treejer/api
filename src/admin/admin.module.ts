import { Module } from "@nestjs/common";
import { ApplicationModule } from "src/application/application.module";
import { DatabaseModule } from "src/database/database.module";
import { DownloadModule } from "src/download/download.module";
import { SmsModule } from "src/sms/sms.module";
import { UserModule } from "./../user/user.module";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";

@Module({
  imports: [
    UserModule,
    DownloadModule,
    SmsModule,
    ApplicationModule,
    DatabaseModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
