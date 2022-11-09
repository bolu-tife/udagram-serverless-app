import { handlerPath } from '@libs/handler-resolver';
import { createGroupSchema, createImageSchema } from './schema';

export const getGroups =  {
  handler: `${handlerPath(__dirname)}/getGroups.main`,
  events: [
    {
      http: {
        method: 'get',
        path: 'groups',
        cors:  true,       
      },
    },
  ],
};

export const createGroup = {
  handler: `${handlerPath(__dirname)}/createGroup.main`,
  events: [
      {
          http: {
              method: 'post',
              path: 'groups',
              cors:  true,
              authorizer: "RS256Auth",
              request: {
                schemas: {
                  'application/json': createGroupSchema,
                },
              },
          },
      },
  ],
};

export const getImages =  {
  handler: `${handlerPath(__dirname)}/getImages.main`,
  events: [
    {
      http: {
        method: 'get',
        path: 'groups/{groupId}/images',
        cors:  true,       
      },
    },
  ],
};

export const getImage =  {
  handler: `${handlerPath(__dirname)}/getImage.main`,
  events: [
    {
      http: {
        method: 'get',
        path: 'images/{imageId}',
        cors:  true,       
      },
    },
  ],
};

export const createImage = {
  handler: `${handlerPath(__dirname)}/createImage.main`,
  events: [
      {
          http: {
              method: 'post',
              path: 'groups/{groupId}/images',
              cors:  true,
              authorizer: "RS256Auth",
              request: {
                schemas: {
                  'application/json': createImageSchema,
                },
              },
          },
      },
  ],
};
