import { Injectable, InternalServerErrorException } from "@nestjs/common";
import axios from "axios";
import { EtherValuesRepository } from "./etherValues.repository";
import { ConfigService } from "@nestjs/config";
import { EtherValues } from "./schema";
import { BugsnagService } from "src/bugsnag/bugsnag.service";
import { EmailService } from "src/email/email.service";
import { GetEthDataResultDto } from "./dto";

@Injectable()
export class EtherValuesService {
  constructor(
    private etherValuesRepository: EtherValuesRepository,
    private configService: ConfigService,
    private bugsnag: BugsnagService,
    private emailService: EmailService
  ) {}

  async getEtherPrice(): Promise<GetEthDataResultDto> {
    const etherValueValidUntil = Number(
      this.configService.get<number>("ETHER_VALUE_VALID_UNTIL")
    );

    const ethValue = await this.etherValuesRepository.findOne({});

    if (
      !ethValue ||
      ethValue.storedAt < new Date(Date.now() - etherValueValidUntil)
    ) {
      const etherApiUrl = this.configService.get<string>("ETH_PRICE_API_URL");

      const etherApiKey = this.configService.get<string>("ETH_PRICE_API_KEY");

      const requestUrl = `${etherApiUrl}${etherApiKey}`;

      let etherPirce;

      try {
        etherPirce = await new Promise((resolve, reject) => {
          axios
            .get(requestUrl, { timeout: 3000 })
            .then((res) => {
              resolve({ ...res.data, errorCount: 0 });
            })
            .catch((err) => {
              if (!ethValue) {
                reject("internal server error (api not work)");
                return;
              }
              ethValue.errorCount += 1;

              if (ethValue.errorCount == 3) {
                this.bugsnag.notify(err.response);

                this.emailService.notifyAdmin(
                  "Error:Treejer nestapi",
                  `<h3>etherValues Module : errorCount reach 3</h3><b>can't update ether price(You can see more about error on bugsnag)</b>`
                );

                ethValue.errorCount = 0;
              }

              resolve({
                status: ethValue.status,
                message: ethValue.message,
                result: ethValue.result,
                errorCount: ethValue.errorCount,
              });
            });
        });
      } catch (error) {
        throw new InternalServerErrorException(error);
      }

      etherPirce.storedAt = new Date();

      await this.etherValuesRepository.deleteMany({});

      await this.etherValuesRepository.create({ ...etherPirce });

      return etherPirce;
    } else {
      return ethValue;
    }
  }
}
