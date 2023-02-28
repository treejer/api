import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TwilioModule } from "nestjs-twilio";
import { EmailController } from "./email.controller";
import { EmailService } from "./email.service";

import { MailerModule } from "@nestjs-modules/mailer";
import { PugAdapter } from "@nestjs-modules/mailer/dist/adapters/pug.adapter";

@Module({
  controllers: [EmailController],
  providers: [EmailService],
  imports: [
    MailerModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        transport: {
          port: configService.get<number>("MAIL_PORT"),
          type: configService.get<string>("MAIL_MAILER"),
          host: configService.get<string>("MAIL_HOST"),
          secure: false,
          auth: {
            user: configService.get<string>("MAIL_USERNAME"),
            pass: configService.get<string>("MAIL_PASSWORD"),
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class EmailModule {}
