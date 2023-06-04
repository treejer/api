import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TreeErrorMessage } from "src/common/constants";
import axios from "axios";
import { getTreeForPlant } from "src/common/graphQuery/getTreeForPlant";

@Injectable()
export class GraphService {
  constructor(private config: ConfigService) {}

  async getTreeData(treeId: string): Promise<any> {
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

      console.log("res", res);
    } catch (error) {
      throw new InternalServerErrorException();
    }
  }
}
