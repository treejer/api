import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MailerService } from "@nestjs-modules/mailer";
import { ValidEmailDto } from "src/user/dtos";

@Injectable()
export class EmailService {
  public constructor(
    private configService: ConfigService,
    private readonly mailerService: MailerService,
  ) {}

  async sendEmail(reciever: ValidEmailDto, subject: string, htmlBody: string) {
    this.mailerService
      .sendMail({
        to: reciever.toString(),
        from: this.configService.get<string>("MAIL_FROM_ADDRESS"),
        subject: subject,
        html: htmlBody,
      })
      .then(() => {})
      .catch((e) => {
        console.log("e", e);
      });
  }
}
