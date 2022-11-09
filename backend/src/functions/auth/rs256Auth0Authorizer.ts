import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult, APIGatewayAuthorizerHandler } from 'aws-lambda'
import 'source-map-support/register'
import { verify } from 'jsonwebtoken'
import { JwtToken } from '../../auth/JwtToken'
import * as AWS from "aws-sdk";
import { middyfy } from "@libs/lambda";

const secretId = process.env.AUTH_0_CERT_ID
const secretField = process.env.AUTH_0_CERT_FIELD
const client = new AWS.SecretsManager();
let cachedSecret: string

const cert = `-----BEGIN CERTIFICATE-----
MIIDHTCCAgWgAwIBAgIJYyCKuB3YTNObMA0GCSqGSIb3DQEBCwUAMCwxKjAoBgNV
BAMTIWRldi00bmt1ZmhpYTh2d3hsemdvLnVzLmF1dGgwLmNvbTAeFw0yMjExMDIy
MTU3NTFaFw0zNjA3MTEyMTU3NTFaMCwxKjAoBgNVBAMTIWRldi00bmt1ZmhpYTh2
d3hsemdvLnVzLmF1dGgwLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoC
ggEBAK02sLtLyPlfvbhffMlRk5BuV6We/btmEljxdBphI4q0fMQDvzjeJBV9dZjO
5RqIX/BRZWf/IoNsrZ+5hQEW5gf2I72B2PVgq/k7CPpm9ddxSEJ+TAFqQJaQ2RDP
fWEYKOxEWR5IJe7yFi951NipFSNgh1TnHx8/Co5m3h2LL+PoGRMVhc9FMKjtaX6+
16URpDPtkYLKhmuxX4nvi439ADgYLW41L9KEM15y0o/dZiYLcFhepXoWta6aDwoG
pliJKAwex55vK51XF3x9qHdJIvZXseUe28OVbzy64Jx7+6kz9Tmx5xgYUhvWxOKg
191vf56zPkHdW0Iy1CJWVMJyYBkCAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAd
BgNVHQ4EFgQUBF/fyQxx+I2Ft5WNktSxEKJKQTQwDgYDVR0PAQH/BAQDAgKEMA0G
CSqGSIb3DQEBCwUAA4IBAQCfrXZgSGU8A6Q4ZC+culm760I9O7BS7XBMO9q0A0Wp
irI8fa++t4XejdvrshwgZh9FncWwojECgznJY0yyFUD7t7v7slpXHKomQYqP2369
TgYrbCJTPn5r66otDMWyhdOc0qZ7zvSrzKwF2IeIUNWy8Si5D3GCucPZUQlzIOjg
2+zc7+fMkqJ3rONWzct30YbN+ndGB9IA9+d15vBNpJZP0jjxpZ5s944etpbHMT/e
nuF6VP8N7VeKFpoT/qmI5pNRnk6E59ER8Dc8rm+ktWIKoKw228LYleozlbjTEGfx
WoqzKfd3MTOAsGFTOYqrSdnq4FGkQfxs9PofTjkWgcHK
-----END CERTIFICATE-----`

const handler = async (event: APIGatewayTokenAuthorizerEvent, context): Promise<APIGatewayAuthorizerResult> => {
    console.log('Processing authorization');
    try {
        const decodedToken =  await verifyToken(event.authorizationToken)

    console.log('User was authorized')

    return IAMPolicyMaker("Allow", decodedToken.sub)
  } catch (e) {
    console.log('User was not authorized', e.message)

    return IAMPolicyMaker("Deny")
  }
}

const  IAMPolicyMaker = (effect: "Allow" | "Deny", user?: string) => {
    return {
        principalId: user || 'user',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'execute-api:Invoke',
              Effect: effect,
              Resource: '*'
            }
          ]
        }
      }
}

const verifyToken =  async (authHeader: string, ): Promise<JwtToken> => {
    if (!authHeader){
        throw new Error("No authentication header")
    }

    if (!authHeader.toLocaleLowerCase().startsWith("bearer "))
        throw new Error("Invalid authorization header");

    const split = authHeader.split(" ");
    const token = split[1]

    const secretObject:any = await getSecret()
    // const cert = secretObject[secretField]

    return verify(token, cert, { algorithms: ['RS256'] }) as JwtToken
}

async function getSecret(){
  if (cachedSecret)return cachedSecret

  const data= await client
  .getSecretValue({
    SecretId: secretId
  })
  .promise()

  cachedSecret = data.SecretString

  return JSON.parse(cachedSecret)
}

export const main = handler;


 

