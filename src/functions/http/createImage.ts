import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway";
import { formatJSONResponse } from "@libs/api-gateway";
import { middyfy } from "@libs/lambda";

import * as AWS from "aws-sdk";
import { v4 } from "uuid";

import { createImageSchema } from "./schema";
import { CreateImageRequest } from "../../requests/CreateImageRequest";

const docClient = new AWS.DynamoDB.DocumentClient();

const groupsTable = process.env.GROUPS_TABLE;
const imagesTable = process.env.IMAGES_TABLE;
const bucketName = process.env.IMAGES_S3_BUCKET;
const urlExpiration = process.env.SIGNED_URL_EXPIRATION;

const s3 = new AWS.S3({
    signatureVersion: 'v4',
    region: "us-east-1",
    params: {Bucket: bucketName}
  });

const createImage: ValidatedEventAPIGatewayProxyEvent<
  typeof createImageSchema
> = async (event) => {
  try {
    const { groupId } = event.pathParameters;
    const validGroupId = await groupExists(groupId);

    if (!validGroupId) {
      return {
        statusCode: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Group does not exist",
        }),
      };
    }

    const requestBody: CreateImageRequest = event.body;
    const imageId = v4();
    const timestamp = new Date().toISOString();

    const newItem = {
      id: imageId,
      timestamp,
      groupId,
      ...requestBody,
      imageUrl: `https://${bucketName}.s3.amazonaws.com/${imageId}`,
    };

    await docClient
      .put({
        TableName: imagesTable,
        Item: newItem,
      })
      .promise();

    const url = getUploadUrl(imageId)

    return formatJSONResponse({
      statusCode: 201,
      body: newItem,
      uploadUrl: url,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return formatJSONResponse({
      statusCode: 500,
      message: error,
    });
  }
};

async function groupExists(groupId: string): Promise<boolean> {
  const result = await docClient
    .get({
      TableName: groupsTable,
      Key: {
        id: groupId,
      },
    })
    .promise();

  return !!result.Item;
}

function getUploadUrl(imageId: string): string {
    return s3.getSignedUrl('putObject', {
        Bucket: bucketName,
        Key: imageId,
        Expires: parseInt(urlExpiration)
      })
  }

export const main = middyfy(createImage);
