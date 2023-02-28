import { Controller, Post } from "@nestjs/common";
import { SmsService } from "./sms.service";

@Controller("sms")
export class SmsController {
  constructor(private smsService: SmsService) {}

  @Post("send")
  sendSms() {
    return this.smsService.sendSMS(`Helo from Treejer`, "phonenumber");
  }
}
