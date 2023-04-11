import { BugsnagService } from "./bugsnag.service";
import { ConfigService } from "@nestjs/config";
import { Module } from "@nestjs/common";

@Module({
  imports: [],
  controllers: [],
  providers: [BugsnagService, ConfigService],
  exports: [BugsnagService],
})
export class BugsnagModule {}
