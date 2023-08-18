import { MongooseModule } from "@nestjs/mongoose";
import { DownloadController } from "./download.controller";
import { DownloadService } from "./download.service";
import { Module } from "@nestjs/common";
import { File, FileSchema } from "./schemas";
import { FileRepository } from "./download.repository";
import { UserModule } from "src/user/user.module";

@Module({
  imports: [
    UserModule,
    MongooseModule.forFeature([{ name: File.name, schema: FileSchema }]),
  ],
  controllers: [DownloadController],
  providers: [DownloadService, FileRepository],
  exports: [DownloadService],
})
export class DownloadModule {}
