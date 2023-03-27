let RandToken = require("rand-token");

export function randint(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min) + min);
}

const symbols = "*&$-^=+!~";
const numbers = "0123456789";
let lowers = "";
let uppers = "";
const ra = "a".charCodeAt(0);
const ca = "A".charCodeAt(0);
for (let i = 0; i < 26; i++) {
  lowers += String.fromCharCode(ra + i);
  uppers += String.fromCharCode(ca + i);
}

export function randstr(
  length: number,
  hasNumbers: boolean,
  hasUpperCase: boolean,
  hasSymbols: boolean,
): string {
  let chars = "";

  chars += lowers;

  if (hasNumbers) chars += numbers;
  if (hasSymbols) chars += symbols;
  if (hasUpperCase) chars += uppers;

  return RandToken.generate(length, chars);
}

export function generateToken(): string {
  return randstr(42, true, true, false);
}
