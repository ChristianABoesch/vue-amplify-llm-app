// Removing type checking for hanlders.ts to bypass the vue build issue. 
// -@ts-nocheck
import type { Schema } from "../../data/resource"
import { env } from '$amplify/env/say-hello';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
//import { env as amplifyEnv } from '@aws-amplify/backend-region-aware-client';


export const handler: Schema["sayHello"]["functionHandler"] = async (event) => {
  // arguments typed from `.arguments()`
  const { name } = event.arguments;
  let message = env.MESSAGE;
  let API_KEY = env.API_KEY;
  //Pull from the process since env if defined in say-hello/resource
  let CUSTOM_QUEUE_URL = process.env.CUSTOM_QUEUE_URL; 
  let AWS_REGION = process.env.AWS_REGION;
  // return typed from `.returns()`
  
  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = name;
  let prompt_reply = "No result";
  try {
    const result = await model.generateContent(prompt!);
    prompt_reply = result.response.text(); // Handle the response data
  } catch (error) {
    prompt_reply = "Error calling google API" + error;
    //console.error('Error calling google API', error);
  }
  
  let jsonResponse = {
    "prompt_reply": prompt_reply,
    "name": name,
    "message": message,
  }
  console.log("******* process.env *********")
  console.log( process.env)
  //console.log("******* env **********")
  //console.log(env)
  // Insert item into CustomQueue
  const sqsClient = new SQSClient({ region: AWS_REGION });
  const queueUrl = CUSTOM_QUEUE_URL
  const params = {
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(jsonResponse),
  };

  try {
    await sqsClient.send(new SendMessageCommand(params));
    console.log('Message sent to SQS queue');
  } catch (error) {
    console.error('Error sending message to SQS queue:', error);
  }

  try {
    
    // Add invocation here.
    const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");
    const lambdaClient = new LambdaClient({ region: AWS_REGION });
    const params = {
      FunctionName: process.env.HELLO_LAMBDA_FUNCTION_ARN,
      InvocationType: "RequestResponse",
      Payload: JSON.stringify({ name: name }),
    };
    const command = new InvokeCommand(params);
    const lambdaResponse = await lambdaClient.send(command);
    const responsePayload = JSON.parse(new TextDecoder().decode(lambdaResponse.Payload));
    console.log('helloFunction response:', responsePayload);

    console.log('Calling helloFunction');
  } catch (error) {
    console.error('Error sending invoking helloFunction:', error);
  }

  const response = {
      statusCode: 200,
      body: jsonResponse,
  };
  return response;
}