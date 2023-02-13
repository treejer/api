const PlanterV2 = require("./../../../abi/Planter.json");
const Web3 = require("web3");

const web3 = new Web3("http://localhost:8545");

export async function getPlanterData(planterAddress: string) {
  const instance = new web3.eth.Contract(
    PlanterV2.abi,
    "0x12a92c2C8DFa533bB8EEa80c12Be3C9Cc3B65Ac3"
  );

  let planter = await instance.methods.planters(planterAddress).call();
  return planter;
}
