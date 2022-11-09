import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from "aws-lambda";
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import * as AWS from 'aws-sdk';


const docClient = new AWS.DynamoDB.DocumentClient()

const imageIdIndex = process.env.IMAGE_ID_INDEX
const imagesTable = process.env.IMAGES_TABLE

 const getImage: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Processing event: ', event)

  const {imageId} = event.pathParameters;

  const result = await docClient.query({
    TableName : imagesTable,
    IndexName : imageIdIndex,
    KeyConditionExpression: 'imageId = :imageId',
    ExpressionAttributeValues: {
        ':imageId': imageId
    }
  }).promise()

  if (result.Count !== 0) {
    return formatJSONResponse({
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: result.Items[0]
  
    })
    }

    return formatJSONResponse({
      statusCode: 404,
      message: "Image does not exist",
      headers: {
          'Access-Control-Allow-Origin': '*'
        },
  })

  
};

export const main = middyfy(getImage);
