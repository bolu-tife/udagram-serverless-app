import { handlerPath } from '@libs/handler-resolver';

export const Auth = {
  handler: `${handlerPath(__dirname)}/auth0Authorizer.main`,
};
