import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { exit } from "process";
import { IPlanterData } from "./interfaces/planterData.interface";
import { ITreeData } from "./interfaces/treeData.interface";
import { BugsnagService } from "src/bugsnag/bugsnag.service";

const Web3 = require("web3");

const PlanterV2 = require("./../../abi/Planter.json");
const TreeFactory = require("./../../abi/TreeFactory.json");

@Injectable()
export class Web3Service {
  private web3Instance;
  private web3SInstance;
  private connectionStatus;
  private ethereumEvents;

  constructor(private config: ConfigService, private bugsnag: BugsnagService) {
    this.web3Instance = new Web3(
      config.get<string>("NODE_ENV") === "test"
        ? config.get<string>("WEB3_PROVIDER_TEST")
        : config.get<string>("WEB3_PROVIDER")
    );

    this.web3Instance.eth.net
      .isListening()
      .then(() => console.log("web3Instance : is connected"))
      .catch((e) =>
        console.error("web3Instance : Something went wrong : " + e)
      );
  }

  async getPlanterData(planterAddress: string): Promise<IPlanterData> {
    let planter: Promise<IPlanterData>;
    try {
      const instance = new this.web3Instance.eth.Contract(
        PlanterV2.abi,
        this.config.get<string>("CONTRACT_PLANTER_ADDRESS")
      );

      planter = await instance.methods.planters(planterAddress).call();
    } catch (error) {
      console.log("getPlanterData func : ", error);

      throw new InternalServerErrorException(error.message);
    }

    return planter;
  }

  async getPlanterOrganization(planterAddress: string): Promise<string> {
    let org: Promise<string>;

    try {
      const instance = new this.web3Instance.eth.Contract(
        PlanterV2.abi,
        this.config.get<string>("CONTRACT_PLANTER_ADDRESS")
      );

      org = await instance.methods.memberOf(planterAddress).call();
    } catch (error) {
      console.log("getPlanterOrganization func : ", error);

      throw new InternalServerErrorException(error.message);
    }

    return org;
  }

  async getTreeData(treeId: number): Promise<ITreeData> {
    let tree: Promise<ITreeData>;
    try {
      const instance = new this.web3Instance.eth.Contract(
        TreeFactory.abi,
        this.config.get<string>("CONTRACT_TREE_FACTORY_ADDRESS")
      );

      tree = await instance.methods.trees(treeId).call();
    } catch (error) {
      console.log("getTreeData func : ", error);

      throw new InternalServerErrorException(error.message);
    }

    return tree;
  }

  async getPlanterNonce(planterAddress: string) {
    let planterNonce = 0;
    try {
      const instance = new this.web3Instance.eth.Contract(
        TreeFactory.abi,
        this.config.get<string>("CONTRACT_TREE_FACTORY_ADDRESS")
      );

      planterNonce = await instance.methods
        .plantersNonce(planterAddress)
        .call();
    } catch (error) {
      console.log("getPlanterNonce func : ", error);

      throw new InternalServerErrorException(error.message);
    }

    return Number(planterNonce);
  }
  getWeb3Instance() {
    return this.web3Instance;
  }

  createWeb3SInstance(url, func) {
    if (this.web3SInstance) {
      this.web3SInstance.currentProvider.disconnect();
    }

    this.web3SInstance = new Web3(
      url
        ? url
        : this.config.get<string>("NODE_ENV") === "test"
        ? this.config.get<string>("WEB3S_PROVIDER_TEST")
        : this.config.get<string>("WEB3S_PROVIDER")
    );

    const provider = this.web3SInstance.currentProvider;

    provider.on("connect", async () => {
      console.log("web3SInstance: reconnected");
      this.connectionStatus = true;

      if (this.ethereumEvents) {
        this.ethereumEvents.stop();
      }

      this.ethereumEvents = await func(this.web3SInstance);
    });

    provider.on("close", () => {
      console.log("web3SInstance: connection closed");
      this.connectionStatus = false;
      setTimeout(() => {
        if (!this.connectionStatus) {
          console.log("closed getWeb3SInstance");

          if (this.ethereumEvents) {
            this.ethereumEvents.stop();
          }

          this.bugsnag.notify("closed getWeb3SInstance");

          this.createWeb3SInstance(url, func);
        }
      }, 10000);
    });

    this.web3SInstance.eth.net
      .isListening()
      .then(() => console.log("web3SInstance : is connected"))
      .catch((e) => {
        console.error("web3SInstance : Something went wrong : " + e);
      });
  }
}
