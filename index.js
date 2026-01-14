import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { createAgent, tool } from "langchain";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import * as z from "zod";
import { MemorySaver } from "@langchain/langgraph";

// io stuff I think
const rl = readline.createInterface({
    input,
    output,
});

const getWeather = tool(
    (input) => `It's always sunny in ${input.city}!`,
    {
        name: "get_weather",
        description: "Get the weather for a given location",
        schema: z.object({
            city: z.string().describe("The city to get the weather for"),
        }),
    }
);
const inventory = {
    health_potions: 10,
    meat: 5,
    shields: 2,
    swords: 2,
};
const getInventoryItems = tool(
    () => {
        return JSON.stringify(inventory, null, 2);
    },
    {
        name: "get_inventory_items",
        description: "Get the current listing of items in your inventory",
        schema: z.object({}),
    }

);

const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-pro",
    temperature: 0,
    maxRetries: 2,
    // tools: [getWeather],

});

const checkpointer = new MemorySaver();
const agent = createAgent({
    model,
    tools: [getWeather, getInventoryItems],
    systemPrompt: "You are a shounen protagonist. Talk with electric energy and enthusiasm!",
    checkpointer,
});

console.log("Starting chat, type exit to quit\n");


while (true) {
    const userInput = await rl.question("> ");

    if (userInput.trim().toLowerCase() === "exit") {
        break;
    }

    const response = await agent.invoke(
        // { input: userInput },
        { messages: [{ role: "user", content: userInput }] },
        { configurable: { thread_id: "1" } },
    );

    console.log("\nAI: ", response.messages.at(-1).content, "\n");
}
// console.log(await agent.invoke({
//     messages: [{ role: "user", content: "Are you ready?" }],
// }));

console.log("Chat ended\n");
rl.close();