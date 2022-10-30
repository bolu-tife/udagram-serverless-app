import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from "aws-lambda";
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import * as AWS from 'aws-sdk';


const docClient = new AWS.DynamoDB.DocumentClient()

const groupsTable = process.env.GROUPS_TABLE
const imagesTable = process.env.IMAGES_TABLE

 const getImages: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Processing event: ', event)

  const {groupId} = event.pathParameters;
  const validGroup = await groupExists(groupId);

  if (!validGroup){
    return formatJSONResponse({
        statusCode: 404,
        message: "Group does not exist",
        headers: {
            'Access-Control-Allow-Origin': '*'
          },
    })
  }

  const result = await docClient.query({
    TableName: imagesTable,
    KeyConditionExpression: 'groupId = :groupId',
    ExpressionAttributeValues: {
        ':groupId': groupId
    }, ScanIndexForward: false,
  }).promise()


  return formatJSONResponse({
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: result.Items

  })
};

export const main = middyfy(getImages);

async function groupExists (groupId:string) :Promise<boolean> {
    const result =  await docClient.get({
        TableName: groupsTable,
        Key: {
            id: groupId
        }
    }).promise()

    return !!result.Item
}
