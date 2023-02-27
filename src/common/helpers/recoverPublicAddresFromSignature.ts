import {
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import * as ESU from "eth-sig-util";
import { SignatureError } from "./../constants";
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
    if (error.message === SignatureError.INVALID_SIGNATURE_LENTGH) {
      throw new BadRequestException(SignatureError.INVALID_SIGNATURE_LENTGH);
    }

    console.log("recoverPublicAddress func : ", error);

    throw new InternalServerErrorException(error.message);
  }
}
