import { BadRequestException } from "@nestjs/common";
import * as ESU from "eth-sig-util";

export function recoverPublicAddressfromSignature(
  signature: string,
  message: string
): string {
  const obj = {
    sig: signature,
    data: message,
  };

  try {
    return ESU.recoverPersonalSignature(obj);
  } catch (error) {
    throw new BadRequestException(error.toString());
  }
}
