import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { PlantStatus, TreeErrorMessage } from "src/common/constants";
import { getPlanterDataForPlant } from "src/common/graphQuery/getPlanterDataForPlant";
import { getSubmittedQuery } from "src/common/graphQuery/getSubmittedQuery";
import { getTreeForPlant } from "src/common/graphQuery/getTreeForPlant";
import { PlantService } from "src/plant/plant.service";
import { GetPlanterDataResultDto } from "./dto/get-planter-data-result.dto";
import { GetTreeDataResultDto } from "./dto/get-tree-data-result.dto";
@Injectable()
export class GraphService {
  constructor(private config: ConfigService,private plantService:PlantService) {}

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

  async getSubmittedData( planterAddress: string,skip:number,limit:number): Promise<any> {
    

    const theGraphUrl = this.config.get<string>("THE_GRAPH_URL");

    if (!theGraphUrl) {
      throw new InternalServerErrorException(
        TreeErrorMessage.GRAPH_SOURCE_URL_NOT_SET
      );
    }

    try {
      const postBody = JSON.stringify({
        query: getSubmittedQuery.replace(/PLANTER_ID/g, planterAddress.toLowerCase()).replace(/SKIP/g,skip.toString()).replace(/FIRST/g,limit.toString()),
        variables: null,
      });

      const res = await axios.post(theGraphUrl, postBody);

      if (res.status == 200 && res.data.data) {
        if (res.data.data.trees == null) {
          // return {
          //   id: hexTreeId,
          //   plantDate: "0",
          //   planter: "0x0",
          //   treeStatus: "0",
          // };
        } else {
          let data = res.data.data.trees;


          data = data.map(async item => {
            let treeS;

            if(Number(treeS.treeStatus)<4){
              let assignedCount = await this.plantService.getAssignPendingListCount({
                treeId:parseInt(item.id, 16),
                status:PlantStatus.PENDING
              })

              if(assignedCount>0){
                treeS = "Assigned&Pending"
              }else{
                treeS = "Assigned&NotPending" 
              }
            }else if(Number(treeS.treeStatus)>=4){
              let updatedCount = await this.plantService.getAssignPendingListCount({
                treeId:parseInt(item.id, 16),
                status:PlantStatus.PENDING
              })

              if(updatedCount>0){
                treeS = "Verified&Pending"
              }else {
                if (
                  Math.floor(new Date().getTime() / 1000) <
                  Number(item.plantDate) + Number(item.treeStatus) * 3600 + 604800
                ){
                  treeS = "Verified&CantUpdate"
                }else{
                  treeS = "Verified&CanUpdate"
                }
              }
            }

            item.treeS = treeS;
          })
          
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
