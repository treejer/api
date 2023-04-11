import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";

import axios from "axios";

import { generateTreeAttributes } from "src/common/helpers";
import { treeTemplate, TreeErrorMessage } from "./../common/constants";
import { ConfigService } from "@nestjs/config";

const fs = require("fs");

const crownColor = JSON.parse(
  fs
    .readFileSync(
      `${process.cwd()}/public/resources/attributeMapping/crownColor.json`,
    )
    .toString(),
);
@Injectable()
export class TreeService {
  public constructor(private configService: ConfigService) {}

  async getTree(treeId: string): Promise<any> {
    let hexTreeId: string;

    try {
      hexTreeId = "0x" + parseInt(treeId).toString(16);
    } catch (err) {
      throw new BadRequestException(TreeErrorMessage.INVALID_INPUT);
    }

    const theGraphUrl = this.configService.get<string>("THE_GRAPH_URL");

    if (!theGraphUrl) {
      throw new InternalServerErrorException(
        TreeErrorMessage.GRAPH_SOURCE_URL_NOT_SET,
      );
    }

    const postBody = JSON.stringify({
      query: treeTemplate.replace(/TREE_ID/g, hexTreeId),
      variables: null,
    });

    const res = await axios.post(theGraphUrl, postBody);

    try {
      const tree = res.data.data.tree;
      if (!tree) {
        throw new NotFoundException(TreeErrorMessage.TREE_NOT_FOUND);
      }
      const symbol = res.data.data.symbol;
      if (symbol) {
        tree.attributes = generateTreeAttributes(symbol);
        tree.attributes.push({
          trait_type: "Secret Multiplier",
          value: symbol.coefficient,
        });
        const crownColorValue = crownColor[Number(symbol.crownColor) - 1];
        tree.background_color = crownColorValue
          ? crownColorValue.background_color
          : "";
      } else {
        tree.attributes = [];
      }

      if (tree.treeSpecsEntity) {
        let specs = tree.treeSpecsEntity;
        tree.image = specs.imageFs
          ? specs.imageFs
          : this.configService.get<string>("DEFAULT_IMAGE_URL");
      } else {
        tree.image = this.configService.get<string>("DEFAULT_IMAGE_URL");
      }

      tree.external_url =
        this.configService.get<string>("TREEJER_WEB_URL") + "/tree/" + treeId;

      if (tree.id < 10001) {
        if (tree.id > 0) {
          tree.name = "Genesis Tree #" + treeId;
        } else {
          tree.name = "TREE OF LIFE";
        }
      } else {
        tree.name = "Tree #" + treeId;
      }

      if (tree.attribute) {
        tree.attributes.push({
          trait_type: "Attribute 1",
          value: parseInt(tree.attribute.attribute1),
        });

        tree.attributes.push({
          trait_type: "Attribute 2",
          value: parseInt(tree.attribute.attribute2),
        });

        tree.attributes.push({
          trait_type: "Attribute 3",
          value: parseInt(tree.attribute.attribute3),
        });

        tree.attributes.push({
          trait_type: "Attribute 4",
          value: parseInt(tree.attribute.attribute4),
        });

        tree.attributes.push({
          trait_type: "Attribute 5",
          value: parseInt(tree.attribute.attribute5),
        });

        tree.attributes.push({
          trait_type: "Attribute 6",
          value: parseInt(tree.attribute.attribute6),
        });

        tree.attributes.push({
          trait_type: "Attribute 7",
          value: parseInt(tree.attribute.attribute7),
        });

        tree.attributes.push({
          trait_type: "Attribute 8",
          value: parseInt(tree.attribute.attribute8),
        });
      }

      tree.attributes.push({
        trait_type: "Distribution",
        value: tree.id < 10001 ? "Genesis" : "Regular",
      });

      if (tree.planter) {
        tree.attributes.push({
          trait_type: "planter",
          value: tree.planter.id,
        });
      }

      return tree;
    } catch (err) {
      throw new NotFoundException(TreeErrorMessage.TREE_NOT_FOUND);
    }
  }
}
