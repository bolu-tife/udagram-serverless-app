import * as AWS from 'aws-sdk';

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from "aws-lambda";
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import 'source-map-support/register';
// import schema from './schema';

const docClient = new AWS.DynamoDB.DocumentClient()

const connectionsTable = process.env.CONNECTIONS_TABLE


 const connect: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Websocket connect: ', event)

  const {connectionId} = event.requestContext
  const timestamp = new Date().toISOString()

  const item = {
    id: connectionId,
    timestamp
  }

  await docClient.put({
    TableName: connectionsTable,
    Item: item
  }).promise()

  return formatJSONResponse({
    body: "websocket connected"

  })
};

export const main = middyfy(connect);
