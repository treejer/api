import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TwilioService, } from "nestjs-twilio";

@Injectable()
export class SmsService {
  public constructor(
    private configService: ConfigService,
    private readonly twilioService: TwilioService
  ) {}

  async sendSMS(body:any, to:any): Promise<any>{
    return this.twilioService.client.messages.create({
      body,
      from: this.configService.get<string>("TWILIO_FROM"),
      to,
    });
  }
}
