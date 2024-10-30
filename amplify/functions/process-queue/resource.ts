import { defineFunction } from '@aws-amplify/backend';

export const processQueueFunction = defineFunction({
  name: 'ProcessQueue',
  entry: "./handler.ts",
});