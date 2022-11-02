import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult, APIGatewayAuthorizerHandler } from 'aws-lambda'
import 'source-map-support/register'
import { middyfy } from '@libs/lambda';



const handler: APIGatewayAuthorizerHandler= async (event: APIGatewayTokenAuthorizerEvent, context): Promise<APIGatewayAuthorizerResult> => {
  try {

    verifyToken(event.authorizationToken)
    console.log('User was authorized')

    return IAMPolicyMaker("Allow")
  } catch (e) {
    console.log('User was not authorized', e.message)

    return IAMPolicyMaker("Deny")
  }
}

const  IAMPolicyMaker = (effect: "Allow" | "Deny") => {
    return {
        principalId: 'user',
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

const verifyToken = async (authHeader: string) => {
    if (!authHeader){
        throw new Error("No authentication header")
    }

    if (!authHeader.toLocaleLowerCase().startsWith("bearer "))
        throw new Error("Invalid authorization header");

    const split = authHeader.split(" ");
    const token = split[1]

    if (token !== "123")
        throw new Error("Invalid token")
    

}

export const main = middyfy(handler);