import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from "aws-lambda";
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';
import { getAllGroups } from '../../businessLogic/groups';

 const getGroups: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Processing event: ', event)


  const groups = await getAllGroups()


  return formatJSONResponse({
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: groups

  })
};

export const main = middyfy(getGroups);

