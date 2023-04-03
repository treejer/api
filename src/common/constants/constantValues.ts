const fs = require("fs");
export const treeTemplate = `{
    tree(id: "TREE_ID") {
      id
      planter{
        id
      }
      funder{
        id
      }
      owner{
        id
      }
      countryCode
      saleType
      treeStatus
      plantDate
      birthDate
      attribute{
        attribute1
        attribute2
        attribute3
        attribute4
        attribute5
        attribute6
        attribute7
        attribute8
        generationType
      }
  
      treeSpecsEntity{
        id
        name
        description
        externalUrl
        imageFs
        imageHash
        symbolFs
        symbolHash
        animationUrl
        diameter
        latitude
        longitude
        attributes
      }
    }
    symbol(id: "TREE_ID") {
        shape
        trunkColor
        crownColor
        effect
        coefficient
        generationType
      }
  }
  `;

export const crownColor = JSON.parse(
  fs
    .readFileSync(
      `${process.cwd()}/public/resources/attributeMapping/crownColor.json`
    )
    .toString()
);
export const trunkColor = JSON.parse(
  fs
    .readFileSync(
      `${process.cwd()}/public/resources/attributeMapping/trunkColor.json`
    )
    .toString()
);
