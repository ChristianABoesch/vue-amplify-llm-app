import type { Schema } from "../../data/resource";
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  type InvokeModelCommandInput,
} from "@aws-sdk/client-bedrock-runtime";

// initialize bedrock runtime client
const client = new BedrockRuntimeClient();

export const handler: Schema["generateHaiku"]["functionHandler"] = async (
  event,
  context
) => {
  
  // Provide supported models via another function. 
  let localModels = JSON.parse(process.env.MODEL_IDs!)
  console.log(localModels);
  
  // User prompt
  const prompt = event.arguments.prompt;

  // Invoke model
  const input = {
    modelId: process.env.MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      system:
        "You are a an expert. Respond to the user's question.",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.5,
    }),
  } as InvokeModelCommandInput;

  const command = new InvokeModelCommand(input);

  const response = await client.send(command);

  // Parse the response and return the generated haiku
  const data = JSON.parse(Buffer.from(response.body).toString());
  return data.content[0].text;
};