var sigUtil = require("eth-sig-util");

import {
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";

enum getSignerEnum {
  INVALID_SIGNATURE = "Invalid signature length",
}

export async function getSigner(signature: string, message, selector: Number) {
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

  const msgParams = JSON.stringify({
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
    message,
  });

  let recovered;

  try {
    recovered = sigUtil.recoverTypedSignature({
      data: JSON.parse(msgParams),
      sig: signature,
    });
  } catch (error) {
    if (error.message === getSignerEnum.INVALID_SIGNATURE) {
      throw new BadRequestException(getSignerEnum.INVALID_SIGNATURE);
    }

    console.log("getSigner func : ", error);

    throw new InternalServerErrorException(error.message);
  }

  return recovered;
}
