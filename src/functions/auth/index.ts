import { handlerPath } from '@libs/handler-resolver';

export const Auth = {
  handler: `${handlerPath(__dirname)}/auth0Authorizer.main`,
};

export const RS256Auth = {
  handler: `${handlerPath(__dirname)}/rs256Auth0Authorizer.main`,
};
