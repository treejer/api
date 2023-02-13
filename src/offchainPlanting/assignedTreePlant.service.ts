import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { CreateAssiggnedTreePlantDto, CreateTreePlantDto } from "./dtos";
import { AssignedTreePlant, TreePlant } from "./schemas";
import {
  AssignedTreePlantRepository,
  UpdateTreeRepository,
} from "./assignedTreePlant.repository";
import {
  getPlanterData,
  getPlanterOrganization,
  getSigner,
  getTreeData,
} from "src/common/helpers";
import { UserService } from "./../user/user.service";
import { TreePlantRepository } from "./treePlant.repository";

import {
  AuthErrorMessages,
  OffChainPlantingErrorMessage,
} from "./../common/constants";

var ethUtil = require("ethereumjs-util");

@Injectable()
export class AssignedTreePlantService {
  constructor(
    private updateTreeRepository: UpdateTreeRepository,
    private assignedTreePlantRepository: AssignedTreePlantRepository,
    private treePlantRepository: TreePlantRepository,
    private userService: UserService,
  ) {}

  async updateTree(dto: CreateAssiggnedTreePlantDto) {
    let tree = await getTreeData(dto.treeId);

    let user = await this.userService.findUserByWallet(dto.signer);

    if (!user) return "not-found user";

    const signer: string = await getSigner(
      dto.signature,
      {
        nonce: dto.nonce,
        treeId: dto.treeId,
        treeSpecs: dto.treeSpecs,
        birthDate: dto.birthDate,
        countryCode: dto.countryCode,
      },
      1,
    );

    console.log("signer", signer);
    if (
      ethUtil.toChecksumAddress(signer) !==
      ethUtil.toChecksumAddress(dto.signer)
    )
      return "invalid signer";

    if (tree.treeStatus > 3) return "invalid-tree status";
  }

  async create(dto: CreateAssiggnedTreePlantDto) {
    let tree = await getTreeData(dto.treeId);

    let user = await this.userService.findUserByWallet(dto.signer);

    if (!user) return "not-found user";

    const signer = await getSigner(
      dto.signature,
      {
        nonce: user.plantingNonce,
        treeId: dto.treeId,
        treeSpecs: dto.treeSpecs,
        birthDate: dto.birthDate,
        countryCode: dto.countryCode,
      },
      1,
    );

    if (
      ethUtil.toChecksumAddress(signer) !==
      ethUtil.toChecksumAddress(dto.signer)
    )
      return "invalid signer";

    if (tree.treeStatus != 2) return "invalid-tree status";
    console.log("tre", tree);
    let pendingPlants = await this.getSignedMessagesList({
      signer: dto.signer,
      status: 0,
    });

    const planterData = await getPlanterData(signer);

    console.log("planterDa", planterData);

    if (planterData.status != 1) return "invalid planter";

    console.log("signer", signer);
    console.log("tree.planter", tree.planter);

    if (
      ethUtil.toChecksumAddress(tree.planter) !==
      ethUtil.toChecksumAddress(signer)
    ) {
      if (planterData.planterType != 3) return "invlid planter data";

      if (tree.planter != (await getPlanterOrganization(signer)))
        return "planter org invalid";
    }

    if (
      planterData.plantedCount + pendingPlants.length >=
      planterData.supplyCap
    )
      return "supply error";

    await this.userService.updateUserById(user._id, {
      plantingNonce: user.plantingNonce + 1,
    });

    return await this.assignedTreePlantRepository.create({ ...dto });
  }

  async getSignedMessagesList(filter) {
    return await this.assignedTreePlantRepository.find(filter);
  }

  async pendingListCount(filter): Promise<number> {
    return (
      (await this.assignedTreePlantRepository.count(filter)) +
      (await this.treePlantRepository.count(filter))
    );
  }

  async plant(dto: CreateTreePlantDto) {
    let user = await this.userService.findUserByWallet(dto.signer);

    if (!user) throw new ForbiddenException(AuthErrorMessages.USER_NOT_EXIST);

    const signer = await getSigner(
      dto.signature,
      {
        nonce: user.plantingNonce,
        treeSpecs: dto.treeSpecs,
        birthDate: dto.birthDate,
        countryCode: dto.countryCode,
      },
      2,
    );

    if (
      ethUtil.toChecksumAddress(signer) !==
      ethUtil.toChecksumAddress(dto.signer)
    )
      throw new BadRequestException(AuthErrorMessages.INVALID_SIGNER);

    const planterData = await getPlanterData(signer);

    if (planterData.status != 1)
      throw new ForbiddenException(
        OffChainPlantingErrorMessage.INVALID_PLANTER,
      );

    let count: number = await this.pendingListCount({
      signer: dto.signer,
      status: 0,
    });

    if (planterData.plantedCount + count >= planterData.supplyCap)
      throw new ForbiddenException(OffChainPlantingErrorMessage.SUPPLY_ERROR);

    await this.userService.updateUserById(user._id, {
      plantingNonce: user.plantingNonce + 1,
    });

    await this.treePlantRepository.create({ ...dto });
  }
}
