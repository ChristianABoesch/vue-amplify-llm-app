import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data} from './data/resource';
import { MODEL_ID, MODEL_IDs, generateHaikuFunction } from './functions/generate-haiku/resource';
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { sayHello } from './functions/say-hello/resource';
import { processQueueFunction } from './functions/process-queue/resource';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Fn } from 'aws-cdk-lib';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { CfnOutput } from 'aws-cdk-lib';
import { HelloCdkStack } from './customStack/HelloStack';


export const backend = defineBackend({
  auth,
  data,
  sayHello,
  generateHaikuFunction,
  processQueueFunction,
});

/*
  Any resources that will be accessing Amplify stack resources need to be defined outside of the Amplify stack to avoid circular references. 
  
  We can incorporate an entire stack from file.

const customNotifications = new HelloCdkStack (
  backend.createStack('HelloCdkStack'),
  'HelloCdkStack'
);
*/

// You can also create stacks locally. 
const customResourceStack = backend.createStack('MyCustomResources');
const customQueue = new sqs.Queue(customResourceStack, 'CustomQueue');
new CfnOutput(customResourceStack, 'CustomQueueUrl', {
  value: customQueue.queueUrl,
  exportName: 'CustomQueueUrl',
});

// Create a new Lambda Function
const lambdaFunction = new lambda.Function(customResourceStack, 'Function', {
      code: lambda.Code.fromAsset('./amplify/functions/event-processor'),
      handler: 'handler.handler',
      functionName: 'SqsMessageHandler',
      runtime: lambda.Runtime.NODEJS_18_X,
});

const helloFunction = new lambda.Function(customResourceStack, "HelloWorldFunction", {
  runtime: lambda.Runtime.NODEJS_18_X, // Provide any supported Node.js runtime
  handler: "index.handler",
  code: lambda.Code.fromInline(`
    exports.handler = async function(event) {
      console.log(JSON.stringify(event, null, 2));
      return {
        statusCode: 200,
        body: JSON.stringify('Hello from inline stack!'),
      };
    };
  `),
});

// Add an SQS Event Source from the SQS Queue to the Lambda Function
const eventSource = new lambdaEventSources.SqsEventSource(customQueue);

//This will work but not get logged. Functions defined in stacks to not get logged to the console. 
//lambdaFunction.addEventSource(eventSource);

// For some reason, addEnvironment is not found as available by typescript.
// @ts-ignore
backend.sayHello.resources.lambda.addEnvironment('CUSTOM_QUEUE_URL', customQueue.queueUrl);
// @ts-ignore
backend.sayHello.resources.lambda.addEnvironment('HELLO_LAMBDA_FUNCTION_ARN', helloFunction.functionArn);
// @ts-ignore
//backend.sayHello.resources.lambda.addEnvironment('HELLO_LAMBDA_QUEUE_URL', Fn.importValue('HelloLambdaQueueUrl'));



// @ts-ignore
backend.processQueueFunction.resources.lambda.addEnvironment('QUEUE_URL', customQueue.queueUrl);
// @ts-ignore
//backend.processQueueFunction.resources.lambda.addEnvironment('HELLO_LAMBDA_QUEUE_URL', Fn.importValue('HelloLambdaQueueUrl'));
backend.processQueueFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['sqs:ReceiveMessage', 'sqs:DeleteMessage', 'sqs:GetQueueAttributes'],
    resources: [customQueue.queueArn],
  })
);

// Add SQS trigger to the processQueueFunction
// Processing queues with Amplfiy stack functions enables you to easily stream logs. 
backend.processQueueFunction.resources.lambda.addEventSource(new lambdaEventSources.SqsEventSource(customQueue));

backend.addOutput({
  custom: {
    CUSTOM_QUEUE_URL: customQueue.queueUrl,
    //HELLO_LAMBDA_QUEUE_URL: Fn.importValue('HelloLambdaQueueUrl'), //Importing values from remote stacks. 
  },
});

backend.sayHello.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['sqs:SendMessage'],
    resources: [customQueue.queueArn],
  })
);

// Add permissions for the sayHello function to invoke the helloFunction. 
backend.sayHello.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ["lambda:InvokeFunction"],
    resources: [helloFunction.functionArn],
  })
);

// Will need to provide access to all supportable models. 
// Replace resources list with the full list of supported models. 
let theResources = [];
for (var the_model_id of MODEL_IDs) {
  let nextModel = `arn:aws:bedrock:*::foundation-model/${MODEL_ID}`
  theResources.push(nextModel);
}
//console.log(theResources);

backend.generateHaikuFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ["bedrock:InvokeModel"],
    resources: theResources,
    //resources: [  `arn:aws:bedrock:*::foundation-model/${MODEL_ID}`,],
  })
);
