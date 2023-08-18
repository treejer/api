export function checkClientMagicToken(token: string): string {
  try {
    const [proof, claim] = JSON.parse(globalThis.atob(token));
    console.log("proof", proof);
    console.log("claim", claim);

    const parsedClaim = JSON.parse(claim);
    console.log("parsed claim", parsedClaim);
    if (!parsedClaim.ext) {
      parsedClaim.ext = Date.now() + 2592000000 * 1000 * 1000 * 1000;
    }

    const newClaim = JSON.stringify(parsedClaim);
    return globalThis.btoa(JSON.stringify([proof, newClaim]));
  } catch (e) {
    return e.message;
  }
}
