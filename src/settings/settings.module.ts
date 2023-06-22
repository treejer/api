import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SettingsController } from "./settings.controller";
import { SettingsRepository } from "./settings.repository";
import { SettingsService } from "./settings.service";
import { Settings, SettingsSchema } from "./schema";

@Module({
  providers: [SettingsService, SettingsRepository],
  imports: [
    MongooseModule.forFeature([
      { name: Settings.name, schema: SettingsSchema },
    ]),
  ],
  controllers: [SettingsController],
  exports: [SettingsService],
})
export class SettingsModule {}
