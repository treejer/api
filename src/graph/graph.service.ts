import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { TreeErrorMessage } from "src/common/constants";
import { getPlanterDataForPlant } from "src/common/graphQuery/getPlanterDataForPlant";
import { getTreeForPlant } from "src/common/graphQuery/getTreeForPlant";
import { GetPlanterDataResultDto } from "./dto/get-planter-data-result.dto";
import { GetTreeDataResultDto } from "./dto/get-tree-data-result.dto";
@Injectable()
export class GraphService {
  constructor(private config: ConfigService) {}

  async getPlanterData(
    planterAddress: string
  ): Promise<GetPlanterDataResultDto> {
    const theGraphUrl = this.config.get<string>("THE_GRAPH_URL");

    if (!theGraphUrl) {
      throw new InternalServerErrorException(
        TreeErrorMessage.GRAPH_SOURCE_URL_NOT_SET
      );
    }

    try {
      const postBody = JSON.stringify({
        query: getPlanterDataForPlant.replace(
          /PLANTER_ID/g,
          planterAddress.toLowerCase()
        ),
        variables: null,
      });

      const res = await axios.post(theGraphUrl, postBody);

      if (res.status == 200 && res.data.data) {
        if (res.data.data.planter == null) {
          return {
            id: planterAddress.toLowerCase(),
            status: "0",
            planterType: "0",
            plantedCount: "0",
            supplyCap: "0",
            memberOf: "0x0",
          };
        } else {
          let data = res.data.data.planter;
          if (data.memberOf == null) {
            data.memberOf = "0x0";
          } else {
            data.memberOf = res.data.data.planter.memberOf.id;
          }

          return res.data.data.planter;
        }
      } else {
        throw new InternalServerErrorException("Graph failed !!");
      }
    } catch (error) {
      throw new InternalServerErrorException("Graph failed !!");
    }
  }

  async getTreeData(treeId: string): Promise<GetTreeDataResultDto> {
    let hexTreeId: string;

    try {
      hexTreeId = "0x" + parseInt(treeId).toString(16);
    } catch (err) {
      throw new BadRequestException(TreeErrorMessage.INVALID_INPUT);
    }

    const theGraphUrl = this.config.get<string>("THE_GRAPH_URL");

    if (!theGraphUrl) {
      throw new InternalServerErrorException(
        TreeErrorMessage.GRAPH_SOURCE_URL_NOT_SET
      );
    }

    try {
      const postBody = JSON.stringify({
        query: getTreeForPlant.replace(/TREE_ID/g, hexTreeId),
        variables: null,
      });

      const res = await axios.post(theGraphUrl, postBody);

      console.log("res",res);

      if (res.status == 200 && res.data.data) {
        if (res.data.data.tree == null) {
          return {
            id: hexTreeId,
            plantDate: "0",
            planter: "0x0",
            treeStatus: "0",
          };
        } else {
          let data = res.data.data.tree;

          data.planter = res.data.data.tree.planter.id;

          return data;
        }
      } else {
        throw new InternalServerErrorException();
      }
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }

}
