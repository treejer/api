import { crownColor, trunkColor } from "../constants";
import { TreeAttributesDto, Attribute } from "./../dto";

function generateAttribute(trait_type: string, value: string): Attribute {
  return { trait_type, value };
}

export function generateTreeAttributes(
  treeAttr: TreeAttributesDto
): Array<Attribute> {
  const out: Array<Attribute> = [];

  out.push(generateAttribute("Tree Shape", treeAttr.shape));

  const crownColorValue = crownColor[Number(treeAttr.crownColor) - 1];
  out.push(
    generateAttribute(
      "Crown Color",
      crownColorValue ? crownColorValue.name : treeAttr.crownColor
    )
  );

  const trunkColorValue = trunkColor[Number(treeAttr.trunkColor) - 1];
  out.push(
    generateAttribute(
      "Trunk Color",
      trunkColorValue ? trunkColorValue.name : treeAttr.trunkColor
    )
  );
  return out;
}
