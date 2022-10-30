import { handlerPath } from '@libs/handler-resolver';

export const sendUploadNotification =  {
  environment: {
    STAGE: "${self:provider.stage}",
    API_ID: {Ref: "WebsocketsApi"}
  },
  handler: `${handlerPath(__dirname)}/sendNotifications.main`,
  events: [
    {
      s3: {
        bucket:  "${self:provider.environment.IMAGES_S3_BUCKET}",
        event: 's3:ObjectCreated:*',
        existing: true,
      },
      
  },
  
  ],
};