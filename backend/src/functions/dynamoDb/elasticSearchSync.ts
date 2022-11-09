import { DynamoDBStreamEvent, DynamoDBStreamHandler } from 'aws-lambda'
import { createAWSConnection, awsGetCredentials } from '@acuris/aws-es-connection'
import 'source-map-support/register'
import { Client } from "@elastic/elasticsearch"
import  * as httpAwsEs from 'http-aws-es'
import { middyfy } from "@libs/lambda";


export const handler: DynamoDBStreamHandler = async (event: DynamoDBStreamEvent) => {
    console.log('Processing events batch from DynamoDB', JSON.stringify(event))

    const  esHost = process.env.ES_ENDPOINT
    const awsCredentials = await awsGetCredentials()
    const AWSConnection = createAWSConnection(awsCredentials)
    const client = new Client({
    ...AWSConnection,
    node: `https://${esHost}`
    })

  
    for (const record of event.Records) {
      console.log('Processing record', JSON.stringify(record))

      if (record.eventName !== 'INSERT'){
        continue
      }

    const newItem = record.dynamodb.NewImage

    const imageId = newItem.imageId.S

    const body = {
      imageId: newItem.imageId.S,
      groupId: newItem.groupId.S,
      imageUrl: newItem.imageUrl.S,
      title: newItem.title.S,
      timestamp: newItem.timestamp.S
    }

    await client.index({
      index: 'images-index',
    //   type: 'images',
      id: imageId,
      body
    })
  
    }
  }
  
  export const main = middyfy(handler);