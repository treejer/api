import { BadRequestException } from "@nestjs/common";
import { AuthErrorMessages } from "../constants";

const ethUtil = require("ethereumjs-util");

export function getCheckedSumAddress(address: string): string {
  try {
    return ethUtil.toChecksumAddress(address);
  } catch (error) {
    throw new BadRequestException(AuthErrorMessages.INVALID_WALLET);
  }
}
