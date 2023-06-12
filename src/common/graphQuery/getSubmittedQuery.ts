
export const getSubmittedQuery = (planterAddress:string,skip:number,limit:number) => {
    return `{
        trees(skip:${Number(skip)},first:${Number(limit)},where: { planter:"${planterAddress.toLowerCase()}"}){
            id
            treeStatus
            countryCode
            plantDate
            birthDate
            saleType
            createdAt
      
            funder {
              id
            }
      
            treeSpecsEntity {
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
                updates
                nursery
                locations
            }
      
            lastUpdate  {
              id
              updateStatus
              updateSpecs
              createdAt
              updatedAt
            }
      }
    }`
};