import { handlerPath } from '@libs/handler-resolver';

export const SyncWithElasticsearch =  {
  environment : {ES_ENDPOINT: {"Fn::GetAtt": [ 'ImagesSearch', 'DomainEndpoint' ]},},
  handler: `${handlerPath(__dirname)}/elasticSearchSync.main`,
  events: [
    {
      stream: {
        type: 'dynamodb',
        arn:  {"Fn::GetAtt": [ 'ImagesDynamoDBTable', 'StreamArn' ]},
      },
    },
  ],
};