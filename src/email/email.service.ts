import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MailerService } from "@nestjs-modules/mailer";
import { ValidEmailDto } from "src/user/dtos";
import { getAdminMailList } from "src/common/helpers";

@Injectable()
export class EmailService {
  public constructor(
    private configService: ConfigService,
    private readonly mailerService: MailerService
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

  async notifyAdmin(event: string, text: string): Promise<void> {
    let adminMailList = await getAdminMailList();
    for (const mail of adminMailList) {
      //@ts-ignore
      await this.sendEmail(mail, event, text);
    }
  }
}
