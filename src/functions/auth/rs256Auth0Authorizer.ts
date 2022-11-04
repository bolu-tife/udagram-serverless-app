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
    const cert = secretObject[secretField]
   
    return verify(token, cert, {algorithms: ['rs256']}) as JwtToken
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


 

