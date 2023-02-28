import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TwilioModule } from "nestjs-twilio";
import { SmsController } from "./sms.controller";
import { SmsService } from "./sms.service";
@Module({
  controllers: [SmsController],
  providers: [SmsService],
  imports: [
    TwilioModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        accountSid: configService.get<string>("TWILIO_SID"),
        authToken: configService.get<string>("TWILIO_AUTH_TOKEN"),
      }),

      inject: [ConfigService],
    }),
  ],
})
export class SmsModule {}