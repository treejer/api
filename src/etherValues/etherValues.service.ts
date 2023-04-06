import { Injectable } from "@nestjs/common";
import axios from "axios";
import { EtherValuesRepository } from "./etherValues.repository";

@Injectable()
export class EtherValuesService {
  constructor(private etherValuesRepository: EtherValuesRepository) {}

  async getEtherPrice() {
    const ETHER_VALUE_VALID_UNTIL = parseInt(
      process.env.ETHER_VALUE_VALID_UNTIL ?? "300000"
    );

    const ethValue = await this.etherValuesRepository.findOne({});
    if (
      !ethValue ||
      ethValue.storedAt < new Date(Date.now() - ETHER_VALUE_VALID_UNTIL)
    ) {
      const ETHER_API_URL = process.env.ETH_PRICE_API_URL;
      const ETHER_API_KEY = process.env.ETH_PRICE_API_KEY;
      const requestUrl = `${ETHER_API_URL}${ETHER_API_KEY}`;
      const data = await new Promise((resolve, reject) => {
        axios
          .get(requestUrl, { timeout: 3000 })
          .then((res) => {
            resolve(res.data);
          })
          .catch((err) => {
            resolve(ethValue);
          });
      });

      // @ts-ignore.data as EtherPrice;
      const etherPirce: EtherPrice = data;
      etherPirce.storedAt = new Date();
      await this.etherValuesRepository.deleteMany({});
      await this.etherValuesRepository.create(etherPirce);
      return etherPirce;
    } else {
      return ethValue;
    }
  }
}
