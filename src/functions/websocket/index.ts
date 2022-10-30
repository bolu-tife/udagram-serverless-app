import { handlerPath } from '@libs/handler-resolver';

export const wsConnect =  {
  handler: `${handlerPath(__dirname)}/connect.main`,
  events: [
    {
      websocket: {
        route: '$connect', 
      },
    },
  ],
};

export const wsDisconnect =  {
  handler: `${handlerPath(__dirname)}/disconnect.main`,
  events: [
    {
      websocket: {
        route: '$disconnect', 
      },
    },
  ],
};
