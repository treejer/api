const TreeFactory = require("./../../../abi/TreeFactory.json");
const Web3 = require("web3");

const web3 = new Web3("http://localhost:8545");

export async function getTreeData(treeId: number) {
  const instance = new web3.eth.Contract(
    TreeFactory.abi,
    "0x79e32F474D2D17b61A79913345a0f736B8Db4854"
  );

  let tree = await instance.methods.trees(treeId).call();
  return tree;
}
