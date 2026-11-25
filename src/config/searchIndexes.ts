export const profileSearchIndex = {
  name: "profile_search",
  definition: {
    mappings: {
      dynamic: false,
      fields: {
        _id: { type: "objectId" },
        name: [
          { type: "string" },
          { type: "autocomplete", tokenization: "edgeGram", minGrams: 1, maxGrams: 15 },
        ],
        description: { type: "string" },
      },
    },
  },
};

export const jobSearchIndex = {
  name: "job_search",
  definition: {
    mappings: {
      dynamic: false,
      fields: {
        title: { type: "string" },
        description: { type: "string" },
        isOpen: { type: "boolean" },
      },
    },
  },
};
