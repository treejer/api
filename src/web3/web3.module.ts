// import { Web3Service } from "./web3.service";
import { DynamicModule, Module, ModuleMetadata } from "@nestjs/common";

const Web3 = require("web3");

// export interface Web3ModuleOptions {
//   name?: string;
//   url: string;
// }

// export interface Web3ModuleAsyncOptions
//   extends Pick<ModuleMetadata, "imports"> {
//   useFactory?: (
//     ...args: any[]
//   ) =>
//     | Web3ModuleOptions
//     | Web3ModuleOptions[]
//     | Promise<Web3ModuleOptions>
//     | Promise<Web3ModuleOptions[]>;
//   inject?: any[];
// }

// @Module({})
// export class Web3Module {
//   constructor() {}

//   static forRoot(url: string): DynamicModule {
//     const web3Client = new Web3(url);

//     return {
//       module: Web3Module,
//       imports: [web3Client],
//       exports: [web3Client],
//     };
//   }
// }
