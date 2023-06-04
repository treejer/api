import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TreeErrorMessage } from "src/common/constants";
import axios from "axios";
import { getTreeForPlant } from "src/common/graphQuery/getTreeForPlant";
import { GetTreeDataResultDto } from "./dto/get-tree-data-result-dto";
@Injectable()
export class GraphService {
  constructor(private config: ConfigService) {}

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

      if (res.status == 200 && res.data.data) {
        let data = res.data.data.tree;

        data.planter = res.data.data.tree.planter.id;

        console.log("data", data);

        return data;
      } else {
        throw new InternalServerErrorException();
      }
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}
