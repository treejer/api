const { getMessage } = require("eip-712");
const { ecsign } = require("ethereumjs-util");

export async function getEIP712Sign(
  verifyingContract: string,
  account,
  messageParams,
  selector: number
) {
  let primaryTypeObj;
  let primaryType;

  if (selector == 1) {
    primaryType = "plantAssignTree";
    primaryTypeObj = [
      { name: "nonce", type: "uint256" },
      { name: "treeId", type: "uint256" },
      { name: "treeSpecs", type: "string" },
      { name: "birthDate", type: "uint64" },
      { name: "countryCode", type: "uint16" },
    ];
  } else if (selector == 2) {
    primaryType = "plantTree";
    primaryTypeObj = [
      { name: "nonce", type: "uint256" },
      { name: "treeSpecs", type: "string" },
      { name: "birthDate", type: "uint64" },
      { name: "countryCode", type: "uint16" },
    ];
  } else if (selector == 3) {
    primaryType = "updateTree";
    primaryTypeObj = [
      { name: "nonce", type: "uint256" },
      { name: "treeId", type: "uint256" },
      { name: "treeSpecs", type: "string" },
    ];
  }

  const msgParams = {
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      [primaryType]: primaryTypeObj,
    },

    primaryType,
    domain: {
      name: process.env.EIP712_DOMAIN_NAME,
      version: process.env.EIP712_VERSION,
      chainId: Number(process.env.CHAIN_ID),
      verifyingContract: process.env.VERIFYING_CONTRACT,
    },
    message: messageParams,
  };

  const message = getMessage(msgParams, true);

  const sign = ecsign(
    Buffer.from(message),
    Buffer.from(account.privateKey.split("0x")[1], "hex")
  );

  return `0x${sign.r.toString("hex")}${sign.s.toString("hex")}${sign.v.toString(
    16
  )}`;
}
