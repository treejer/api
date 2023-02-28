import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TwilioService } from "nestjs-twilio";
const MessagingResponse = require("twilio").twiml.MessagingResponse;
@Injectable()
export class SmsService {
  public constructor(
    private configService: ConfigService,
    private readonly twilioService: TwilioService
  ) {}

  async sendSMS(body, to) {
    return this.twilioService.client.messages.create({
      body,
      from: this.configService.get<string>("TWILIO_FROM"),
      to,
    });
  }
}
