import * as AWS from 'aws-sdk';

import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from "aws-lambda";
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import 'source-map-support/register'


const docClient = new AWS.DynamoDB.DocumentClient()

const connectionsTable = process.env.CONNECTIONS_TABLE


 const disconnect: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Websocket connect: ', event)

  const {connectionId} = event.requestContext

  const key = {
    id: connectionId,
  }

  await docClient.delete({
    TableName: connectionsTable,
    Key: key
  }).promise()

  return formatJSONResponse({
    body: "disconnected connected"

  })
};

export const main = middyfy(disconnect);
