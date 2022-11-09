import type { AWS } from "@serverless/typescript";

import {
  getGroups,
  createGroup,
  getImages,
  getImage,
  createImage,
} from "@functions/http";
import { wsConnect, wsDisconnect } from "@functions/websocket";
import { sendUploadNotification, resizeImage } from "@functions/s3";
import { SyncWithElasticsearch } from "@functions/dynamoDb";
import { Auth, RS256Auth } from "@functions/auth";

const serverlessConfiguration: AWS = {
  service: "service-udagram-app",
  frameworkVersion: "3",
  plugins: ["serverless-esbuild", "serverless-dynamodb-local", "serverless-offline",],
  provider: {
    name: "aws",
    runtime: "nodejs14.x",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    stage: '${opt:stage, "dev"}',
    region: "us-east-1",
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
      GROUPS_TABLE: "Groups-${self:provider.stage}",
      IMAGES_TABLE: "Images-${self:provider.stage}",
      IMAGE_ID_INDEX: "ImageIdIndex",
      IMAGES_S3_BUCKET:
        "serverless-udagram-images-upload-${self:provider.stage}",
      SIGNED_URL_EXPIRATION: "300",
      CONNECTIONS_TABLE: "Connections-${self:provider.stage}",
      THUMBNAILS_S3_BUCKET: "serverless-udagram-thumbnail-${self:provider.stage}-554333721805",
      AUTH_0_SECRET_ID: "Auth0Secret-${self:provider.stage}",
     AUTH_0_SECRET_FIELD: "Auth0Secret",
     AUTH_0_CERT_ID:"Auth0Cert-${self:provider.stage}",
     AUTH_0_CERT_FIELD: "Auth0Cert",
    },
    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: [
          "dynamodb:Scan",
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:GetItem",
        ],
        Resource:
          "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.GROUPS_TABLE}",
      },
      {
        Effect: "Allow",
        Action: ["dynamodb:Query", "dynamodb:PutItem"],
        Resource:
          "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.IMAGES_TABLE}",
      },
      {
        Effect: "Allow",
        Action: ["dynamodb:Query"],
        Resource:
          "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.IMAGES_TABLE}/index/${self:provider.environment.IMAGE_ID_INDEX}",
      },
      {
        Effect: "Allow",
        Action: ["s3:PutObject", "s3:GetObject"],
        Resource:
          "arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}/*",
      },
      {
        Effect: "Allow",
        Action: ["s3:PutObject",],
        Resource:
          "arn:aws:s3:::${self:provider.environment.THUMBNAILS_S3_BUCKET}/*",
      },
      {
        Effect: "Allow",
        Action: ["dynamodb:Scan", "dynamodb:PutItem", "dynamodb:DeleteItem"],
        Resource:
          "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.CONNECTIONS_TABLE}",
      },
      {
        Effect: "Allow",
        Action: ["secretsmanager:GetSecretValue", ],
        Resource:
          {Ref: "Auth0Secret"},
      },
      {
        Effect: "Allow",
        Action: ["secretsmanager:GetSecretValue", ],
        Resource:
          {Ref: "Auth0Cert"},
      },
      {
        Effect: "Allow",
        Action: ["kms:Decrypt",],
        Resource:
        { "Fn::GetAtt": ["KMSKeySecret", "Arn"] },
      },
      {
        Effect: "Allow",
        Action: ["kms:Decrypt",],
        Resource:
        { "Fn::GetAtt": ["KMSKeyCert", "Arn"] },
      },
    ],
  },
  // import the function via paths
  functions: {
    getGroups,
    createGroup,
    getImages,
    createImage,
    getImage,
    wsConnect,
    wsDisconnect,
    sendUploadNotification,
    SyncWithElasticsearch,
    resizeImage,
    Auth,
    RS256Auth
  },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ["aws-sdk"],
      target: "node14",
      define: { "require.resolve": undefined },
      platform: "node",
      concurrency: 10,
    },
    topicName: "ImagesTopic-${self:provider.stage}",
    "serverless-offline": {port:3003},
    dynamodb:{
      start: {
        port: 8000,
      inMemory: true,
      migrate: true,
      shell: true,
      },
    stages: ['dev'],
    }
    
  },
  resources: {
    Resources: {
      GatewayResponseDefault4XX: {
        Type: "AWS::ApiGateway::GatewayResponse",
        Properties: {
          ResponseParameters: {
            "gatewayresponse.header.Access-Control-Allow-Origin": "'*'",
            "gatewayresponse.header.Access-Control-Allow-Headers":
              "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
            "gatewayresponse.header.Access-Control-Allow-Methods":
              "'GET,OPTIONS,POST'",
          },
          ResponseType: "DEFAULT_4XX",
          RestApiId: {
            Ref: "ApiGatewayRestApi",
          },
        },
      },
      GroupsDynamoDBTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          AttributeDefinitions: [
            {
              AttributeName: "id",
              AttributeType: "S",
            },
          ],
          KeySchema: [
            {
              AttributeName: "id",
              KeyType: "HASH",
            },
          ],
          BillingMode: "PAY_PER_REQUEST",
          TableName: "${self:provider.environment.GROUPS_TABLE}",
        },
      },

      ImagesDynamoDBTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          AttributeDefinitions: [
            {
              AttributeName: "groupId",
              AttributeType: "S",
            },
            {
              AttributeName: "timestamp",
              AttributeType: "S",
            },
            {
              AttributeName: "imageId",
              AttributeType: "S",
            },
          ],
          KeySchema: [
            {
              AttributeName: "groupId",
              KeyType: "HASH",
            },
            {
              AttributeName: "timestamp",
              KeyType: "RANGE",
            },
          ],
          BillingMode: "PAY_PER_REQUEST",
          TableName: "${self:provider.environment.IMAGES_TABLE}",
          StreamSpecification: {
            StreamViewType: "NEW_IMAGE",
          },
          GlobalSecondaryIndexes: [
            {
              IndexName: "${self:provider.environment.IMAGE_ID_INDEX}",
              KeySchema: [
                {
                  AttributeName: "imageId",
                  KeyType: "HASH",
                },
              ],
              Projection: { ProjectionType: "ALL" },
            },
          ],
        },
      },
      WebSocketConnectionsDynamoDBTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          AttributeDefinitions: [
            {
              AttributeName: "id",
              AttributeType: "S",
            },
          ],
          KeySchema: [
            {
              AttributeName: "id",
              KeyType: "HASH",
            },
          ],
          BillingMode: "PAY_PER_REQUEST",
          TableName: "${self:provider.environment.CONNECTIONS_TABLE}",
        },
      },
      AttachmentsBucket: {
        Type: "AWS::S3::Bucket",
        Properties: {
          BucketName: "${self:provider.environment.IMAGES_S3_BUCKET}",
          NotificationConfiguration: {
            TopicConfigurations: [
              {
                Event: "s3:ObjectCreated:Put",
                Topic: { Ref: "ImagesTopic" },
              },
            ],
          },

          CorsConfiguration: {
            CorsRules: [
              {
                AllowedOrigins: ["*"],
                AllowedHeaders: ["*"],
                AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],

                MaxAge: "${self:provider.environment.SIGNED_URL_EXPIRATION}",
              },
            ],
          },
        },
      },
      BucketPolicy: {
        Type: "AWS::S3::BucketPolicy",
        Properties: {
          PolicyDocument: {
            Id: "MyPolicy",
            Version: "2012-10-17",
            Statement: [
              {
                Sid: "PublicReadForGetBucketObjects",
                Effect: "Allow",
                Principal: "*",
                Action: "s3:GetObject",
                Resource:
                  "arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}/*",
              },
            ],
          },
          Bucket: { Ref: "AttachmentsBucket" },
        },
      },
      ImagesSearch: {
        Type: "AWS::Elasticsearch::Domain",
        Properties: {
          ElasticsearchVersion: '6.3',
          DomainName: "images-search-${self:provider.stage}",
          ElasticsearchClusterConfig: {
            DedicatedMasterEnabled: false,
            InstanceCount: 1,
            ZoneAwarenessEnabled: false,
            InstanceType: "t2.small.elasticsearch",
          },
          EBSOptions: {
            EBSEnabled: true,
            Iops: 0,
            VolumeSize: 10,
            VolumeType: 'gp2'
          },
          AccessPolicies: {
            Version: '2012-10-17',
            Statement: 
              [
                {
                  Effect: "Allow",
                  Principal: {
                    AWS: '*'
                  },
                  Action: 'es:*',
                 
                
                Resource: {
                  "Fn::Sub": "arn:aws:es:${self:provider.region}:\${AWS::AccountId}:domain/images-search-${self:provider.stage}/*"
                },
                Condition: {
                  IpAddress: {
                    "aws:SourceIp": ["102.89.23.7"],
                  }
                }}
              ]
        
          },
        }
      },
      SNSTopicPolicy: {
        Type: "AWS::SNS::TopicPolicy",
        Properties: {
          PolicyDocument: {
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Principal: {
                  AWS: "*",
                },
                Action: "sns:Publish",
                Resource: {
                  Ref: "ImagesTopic",
                },
                Condition: {
                  ArnLike: {
                    "AWS:SourceArn":
                      "arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}",
                  },
                },
              },
            ],
          },
          Topics: [{ Ref: "ImagesTopic" }],
        },
      },
      ImagesTopic: {
        Type: "AWS::SNS::Topic",
        Properties:{
          DisplayName: "Image bucket topic",
          TopicName: "${self:custom.topicName}"
        },
        },
        ThumbnailsBucket: {
          Type: "AWS::S3::Bucket",
          Properties: {
            BucketName: "${self:provider.environment.THUMBNAILS_S3_BUCKET}",
          },
        },

        KMSKeySecret:{
      Type: "AWS::KMS::Key",
      Properties:{
        Description: "KMS key to encrypt Auth0 secret",
        KeyPolicy: {
          Version: '2012-10-17',
          Id: "key-default-1",
          Statement: 
             [{Sid: "Allow administration of the key",
              Effect: "Allow",
              Principal: {
                AWS: {
                  "Fn::Join": [
                    ":",
                    ["arn:aws:iam:", { Ref: "AWS::AccountId" }, "root"],
                  ],
                },
              },
              Action: [
                'kms:*'
              ],
              Resource: '*',
        }]
      }
      }
    },

    KMSKeySecretAlias:{
      Type: "AWS::KMS::Alias",
      Properties: {
        AliasName: "alias/auth0KeySecret-${self:provider.stage}",
        TargetKeyId:{ Ref: "KMSKeySecret" },
      },
    },

    Auth0Secret:{
      Type: "AWS::SecretsManager::Secret",
      Properties:{
        Name: "${self:provider.environment.AUTH_0_SECRET_ID}",
        Description: "Auth0 secret",
        KmsKeyId: { Ref: "KMSKeySecret" },
  }
  },
  KMSKeyCert:{
    Type: "AWS::KMS::Key",
    Properties:{
      Description: "KMS key to encrypt Auth0 certificate",
      KeyPolicy: {
        Version: '2012-10-17',
        Id: "key-default-1",
        Statement: 
           [{Sid: "Allow administration of the key",
            Effect: "Allow",
            Principal: {
              AWS: {
                "Fn::Join": [
                  ":",
                  ["arn:aws:iam:", { Ref: "AWS::AccountId" }, "root"],
                ],
              },
            },
            Action: [
              'kms:*'
            ],
            Resource: '*',
      }]
    }
    }
  },
  KMSKeyCertAlias:{
    Type: "AWS::KMS::Alias",
    Properties: {
      AliasName: "alias/auth0KeyCert-${self:provider.stage}",
      TargetKeyId:{ Ref: "KMSKeyCert" },
    },
  },
  Auth0Cert:{
    Type: "AWS::SecretsManager::Secret",
    Properties:{
      Name: "${self:provider.environment.AUTH_0_CERT_ID}",
      Description: "Auth0 certificate",
      KmsKeyId: { Ref: "KMSKeyCert" },
}
}

    },

  },
};

module.exports = serverlessConfiguration;
