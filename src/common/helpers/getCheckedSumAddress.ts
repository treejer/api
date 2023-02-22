const ethUtil = require("ethereumjs-util");

export function getCheckedSumAddress(address: string): string {
  return ethUtil.toChecksumAddress(address);
}
