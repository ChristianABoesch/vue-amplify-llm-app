import { defineFunction} from '@aws-amplify/backend';
export const MODEL_ID = "anthropic.claude-3-sonnet-20240229-v1:0";

export const MODEL_IDs = [
  "anthropic.claude-3-sonnet-20240229-v1:0",
  "anthropic.claude-instant-v1"
];

export const generateHaikuFunction = defineFunction({
  entry: "./handler.ts",
  environment: {
    MODEL_ID,
    MODEL_IDs: JSON.stringify(MODEL_IDs),
  },
});
