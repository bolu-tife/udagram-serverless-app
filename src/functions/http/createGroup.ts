import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';

import * as AWS from 'aws-sdk';
import { v4 } from "uuid";

import {createGroupSchema} from './schema';
import { CreateGroupRequest } from '../../requests/CreateGroupRequest'


const docClient = new AWS.DynamoDB.DocumentClient()

const groupsTable = process.env.GROUPS_TABLE


const createGroup: ValidatedEventAPIGatewayProxyEvent<typeof createGroupSchema> = async (event) => {
    
    const requestBody: CreateGroupRequest = event.body;
    const groupId = v4()
    

    try {
        const newItem = {id: groupId,
            ...requestBody
        }
        
        await docClient.put({
            TableName: groupsTable,
            Item: newItem
          }).promise()

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

export const main = middyfy(createGroup);
