export const createGroupSchema = {
  title: "group",
  type: "object",
  properties: {
    name: { type: "string" },
    description: { type: "string" },
  },
  required: ["name", "description"],

  additionalProperties: false,
};

export const createImageSchema = {
  title: "image",
  type: "object",
  properties: {
    title: { type: "string" },
  },
  required: ["title"],

  additionalProperties: false,
};
