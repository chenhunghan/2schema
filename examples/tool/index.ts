import OpenAI from "openai";
import { fn } from "../../src";

declare global {
  interface Function {
    toJSONSchema: () => any;
  }
}

const openai = new OpenAI();

class Tools {
  @fn
  static async getCurrentLocation() {
    return "Boston"; // Simulate lookup
  }

  @fn
  static async getWeather(args: { location: string }) {
    return { temperature: 15, precipitation: 90 };
  }
}

async function main() {
  const tools = [
    Tools.getCurrentLocation.toJSONSchema(),
    Tools.getWeather.toJSONSchema(),
  ];
  console.log(tools);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "user", content: "What is the weather like at current location?" },
    ],
    tools,
    store: true,
  });

  console.log(completion.choices[0].message.tool_calls);
}

main();
