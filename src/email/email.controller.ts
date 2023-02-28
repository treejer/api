import { Controller, Post } from "@nestjs/common";
import { EmailService } from "./email.service";

@Controller("email")
export class EmailController {
  constructor(private emailService: EmailService) {}

  @Post("send")
  sendSms() {
    return this.emailService.sendEmail("email", "test", "test env");
  }
}
