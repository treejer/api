import { BadRequestException } from "@nestjs/common";

const ethUtil = require("ethereumjs-util");

export function getCheckedSumAddress(address: string): string {
  try {
    return ethUtil.toChecksumAddress(address);
  } catch (error) {
    throw new BadRequestException("invalid wallet address");
  }
}
