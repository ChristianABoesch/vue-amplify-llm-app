import { defineFunction, secret  } from '@aws-amplify/backend';

export const sayHello = defineFunction({
  // optionally specify a name for the Function (defaults to directory name)
  name: 'say-hello',
  environment: {
    MESSAGE: "it works!",
    API_KEY: secret('API_KEY') 
},
  // optionally specify a path to your handler (defaults to "./handler.ts")
  entry: './handler.ts'
});