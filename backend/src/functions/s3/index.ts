import { handlerPath } from "@libs/handler-resolver";

export const sendUploadNotification = {
  environment: {
    STAGE: "${self:provider.stage}",
    API_ID: { Ref: "WebsocketsApi" },
  },
  handler: `${handlerPath(__dirname)}/sendNotifications.main`,
  events: [
    {
      sns: {
        arn: {
          "Fn::Join": [
            ":",
            [
              "arn:aws:sns",
              { Ref: "AWS::Region" },
              { Ref: "AWS::AccountId" },
              "${self:custom.topicName}",
            ],
          ],
        },
        topicName: "${self:custom.topicName}",
      },
    },
  ],
};

export const resizeImage = {
  handler: `${handlerPath(__dirname)}/resizeImage.main`,
  events: [
    {
      sns: {
        arn: {
          "Fn::Join": [
            ":",
            [
              "arn:aws:sns",
              { Ref: "AWS::Region" },
              { Ref: "AWS::AccountId" },
              "${self:custom.topicName}",
            ],
          ],
        },
        topicName: "${self:custom.topicName}",
      },
    },
  ],
};