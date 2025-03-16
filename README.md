# 2schema

Automatically generate schemas from LLM function calling.

Instead of writing schemas by hand 🥱

```ts
import { OpenAI } from "openai";

const openai = new OpenAI();

const tools = [{
    "type": "function",
    "function": {
        "name": "getWeather",
        "description": "Get current temperature for a given location.",
        "parameters": {
            "type": "object",
            "properties": {
                // life is too short for schema
            },
        },
    }
}];

function getWeather(args: { location: string }) {
    return //...
}

const completion = await openai.chat.completions.create({
    model: "gpt-5",
    messages: [{ role: "user", content: "What is the weather like in Paris today?" }],
    tools,
});
```

Let the compiler works for you

```ts
import { fn } from "2schema";

const openai = new OpenAI();

class Tools {
  @fn
  static async getWeather(args: { location: string }) {
    return; // ...
  }
}

// will generate the schema for you
const tools = [Tools.getWeather.toJSONSchema()];

const completion = await openai.chat.completions.create({
  model: "gpt-5",
  messages: [
    { role: "user", content: "What is the weather like in Paris today?" },
  ],
  tools,
});
```
