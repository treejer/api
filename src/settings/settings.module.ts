import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SettingsController } from "./settings.controller";
import { SettingsRepository } from "./settings.repository";
import { SettingsService } from "./settings.service";
import { Settings, SettingsSchema } from "./schema";
import { UserModule } from "src/user/user.module";

@Module({
  imports: [
    UserModule,
    MongooseModule.forFeature([
      { name: Settings.name, schema: SettingsSchema },
    ]),
  ],
  controllers: [SettingsController],
  providers: [SettingsService, SettingsRepository],
  exports: [SettingsService],
})
export class SettingsModule {}
