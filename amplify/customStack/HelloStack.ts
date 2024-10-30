import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { CfnOutput } from 'aws-cdk-lib';
// Import the Lambda module

export class HelloCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const customQueue2 = new sqs.Queue(this, 'CustomQueue2');
    // Define the Lambda function resource
    const myFunction = new lambda.Function(this, "HelloWorldFunction", {
      runtime: lambda.Runtime.NODEJS_20_X, // Provide any supported Node.js runtime
      handler: "index.handler",
      code: lambda.Code.fromInline(`
        exports.handler = async function(event) {
          console.log(JSON.stringify(event, null, 2));
          return {
            statusCode: 200,
            body: JSON.stringify('Hello World!'),
          };
        };
      `),
    });
    // Add an SQS Event Source from the SQS Queue to the Lambda Function
    const eventSource = new lambdaEventSources.SqsEventSource(customQueue2);
    // Returning without an error from a lambda can clear the events.
    myFunction.addEventSource(eventSource);

    new CfnOutput(this, 'CustomQueueUrl2', {
      value: customQueue2.queueUrl,
      exportName: 'HelloLambdaQueueUrl',
    });
    new CfnOutput(this, 'LambdaFunctionArn', {
      value: myFunction.functionArn,
      exportName: 'HelloLambdaFunctionArn',
    });
    new CfnOutput(this, 'LambdaFunctionName', {
      value: myFunction.functionName,
      exportName: 'HelloLambdaFunctionName',
    });

  }
}