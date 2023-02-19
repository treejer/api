import { InternalServerErrorException } from "@nestjs/common";

const PlanterV2 = require("./../../../abi/Planter.json");
const Web3 = require("web3");

const web3 = new Web3();

export async function getPlanterData(planterAddress: string) {
  let planter;

  try {
    web3.setProvider("http://localhost:8545");

    const instance = new web3.eth.Contract(
      PlanterV2.abi,
      "0x12a92c2C8DFa533bB8EEa80c12Be3C9Cc3B65Ac3"
    );

    planter = await instance.methods.planters(planterAddress).call();
  } catch (error) {
    console.log("getPlanterData func : ", error);

    throw new InternalServerErrorException(error.message);
  }

  return planter;
}
