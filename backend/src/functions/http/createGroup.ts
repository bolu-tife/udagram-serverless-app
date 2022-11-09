import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';

import * as AWS from 'aws-sdk';
import { v4 } from "uuid";

import {createGroupSchema} from './schema';
import { CreateGroupRequest } from '../../requests/CreateGroupRequest'
import { getUserId } from 'src/auth/utils';
import { createGroup } from '../../businessLogic/groups'



const docClient = new AWS.DynamoDB.DocumentClient()

const groupsTable = process.env.GROUPS_TABLE


const handler: ValidatedEventAPIGatewayProxyEvent<typeof createGroupSchema> = async (event) => {

    const authorization = event.headers.Authorization
    const split = authorization.split(' ')
    const jwtToken = split[1]
    const newGroup: CreateGroupRequest = event.body;

    try {
        const newItem = await createGroup(newGroup, jwtToken)

        return formatJSONResponse({
            statusCode:201,
           body: newItem,
           headers: {
            'Access-Control-Allow-Origin': '*',
          },
          });
    } catch (error) {
        return formatJSONResponse({
            statusCode: 500,
            message: error
        })
    }
  
};

export const main = middyfy(handler);
