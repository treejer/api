import { Injectable, InternalServerErrorException } from "@nestjs/common";

import * as CircleOfHop from "./contracts/CircleOfHop.json";

import { ConfigService } from "@nestjs/config";
import { Web3Service } from "src/web3/web3.service";
import { PlantVerificationService } from "../plantVerification.service";
import { EventName } from "src/common/constants";
import { Command, Positional, Option } from "nestjs-command";

const EthereumEvents = require("ethereum-events");

@Injectable()
export class TreeFactoryListener {
  private ethereumEvents;

  constructor(
    private web3Service: Web3Service,
    private plantVerificationService: PlantVerificationService,
    private configService: ConfigService,
  ) {}

  @Command({
    command: "listener:run",
    describe: "TreeFactory listener run",
  })
  async configure(
    @Option({
      name: "pollInterval",
      describe: "period between polls in milliseconds (default: 13000)",
      type: "number",
      required: false,
    })
    pollInterval: number = Number(
      this.configService.get<string>("POLL_INTERVAL"),
    ),

    @Option({
      name: "confirmations",
      describe: "n° of confirmation blocks (default: 12)",
      type: "number",
      required: false,
    })
    confirmations: number = Number(
      this.configService.get<string>("CONFIRMATIONS"),
    ),
    @Option({
      name: "chunkSize",
      describe: "n° of blocks to fetch at a time (default: 10000)",
      type: "number",
      required: false,
    })
    chunkSize: number = Number(this.configService.get<string>("CHUNK_SIZE")),
    @Option({
      name: "concurrency",
      describe: "maximum n° of concurrent web3 requests (default: 10)",
      type: "number",
      required: false,
    })
    concurrency: number = Number(this.configService.get<string>("CONCURRENCY")),
    @Option({
      name: "backoff",
      describe: "retry backoff in milliseconds (default: 1000)",
      type: "number",
      required: false,
    })
    backoff: number = Number(this.configService.get<string>("BACK_OFF")),
    @Option({
      name: "url",
      describe: "web3 provider url",
      type: "string",
      required: false,
    })
    url: string,
  ) {
    console.log("VerifyPlant run");

    const contracts = [
      {
        name: this.configService.get<string>("LISTENER_CONTRACT_NAME"),
        address: this.configService.get<string>("LISTENER_CONTRACT_ADDRESS"),
        abi: CircleOfHop.abi,
        events: this.configService
          .get<string>("LISTENER_CONTRACT_EVENTS")
          .split(" "),
      },
    ];

    const options = {
      pollInterval,
      confirmations,
      chunkSize,
      concurrency,
      backoff,
    };

    let web3S = this.web3Service.getWeb3SInstance(url);

    this.ethereumEvents = new EthereumEvents(web3S, contracts, options);

    this.ethereumEvents.start(
      await this.plantVerificationService.loadLastState(),
    );

    try {
      this.ethereumEvents.on(
        "block.confirmed",
        async (blockNumber, events, done) => {
          console.log("block.confirmed", blockNumber);
          await new Promise(async (resolve, reject) => {
            if (events.length > 0) {
              for (let event of events) {
                if (event.name === EventName.TREE_ASSIGNED) {
                  try {
                    await this.plantVerificationService.verifyAssignedTree(
                      Number(event.values._treeId),
                    );
                  } catch (error) {
                    console.log("TREE_ASSIGNED error", error);
                  }
                } else if (event.name === EventName.TREE_PLANT) {
                  try {
                    await this.plantVerificationService.verifyPlant(
                      event.values.signer,
                      Number(event.values.nonce),
                    );
                  } catch (error) {
                    console.log("TREE_PLANT error", error);
                  }
                } else if (event.name === EventName.TREE_UPDATE) {
                  try {
                    await this.plantVerificationService.verifyUpdate(
                      Number(event.values._treeId),
                    );
                  } catch (error) {
                    console.log("TREE_UPDATE error", error);
                  }
                }
              }
            }

            await this.plantVerificationService.saveLastState(blockNumber);

            resolve("done");
          });

          done();
        },
      );
    } catch (e) {
      console.log("listener error", e);
    }
  }
}
