import { InternalServerErrorException } from "@nestjs/common";
import { ITreeData } from "../interfaces/treeData.interface";

const TreeFactory = require("./../../../abi/TreeFactory.json");
const Web3 = require("web3");

const web3 = new Web3();

export async function getTreeData(treeId: number): Promise<ITreeData> {
  let tree;
  try {
    web3.setProvider("http://localhost:8545");

    const instance = new web3.eth.Contract(
      TreeFactory.abi,
      "0x79e32F474D2D17b61A79913345a0f736B8Db4854"
    );

    tree = await instance.methods.trees(treeId).call();
  } catch (error) {
    console.log("getTreeData func : ", error);

    throw new InternalServerErrorException(error.message);
  }

  return tree;
}
