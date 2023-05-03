export function checkClientMagicToken(token: string): string {
  try {
    const [proof, claim] = JSON.parse(globalThis.atob(token));

    const parsedClaim = JSON.parse(claim);
    if (!parsedClaim.ext) {
      parsedClaim.ext = Date.now() + 2592000000;
    }

    const newClaim = JSON.stringify(parsedClaim);
    return globalThis.btoa(JSON.stringify([proof, newClaim]));
  } catch (e) {
    return e.message;
  }
}
