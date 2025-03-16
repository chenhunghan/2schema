import OpenAI from "openai";

const client = new OpenAI();

async function main() {
  const runner = client.beta.chat.completions
    .runTools({
      model: "gpt-4o",
      messages: [{ role: "user", content: "How is the weather this week?" }],
      tools: [
        {
          type: "function",
          function: {
            description: "Get the current location of the user.",
            function: getCurrentLocation,
            parse: JSON.parse, // or use a validation library like zod for typesafe parsing.
            parameters: { type: "object", properties: {} },
          },
        },
        {
          type: "function",
          function: {
            description: "Get the weather for a location.",
            function: getWeather,
            parse: JSON.parse, // or use a validation library like zod for typesafe parsing.
            parameters: {
              type: "object",
              properties: {
                location: { type: "string" },
              },
            },
          },
        },
      ],
    })
    .on("message", (message) => console.log(message));

  const finalContent = await runner.finalContent();
  console.log();
  console.log("Final content:", finalContent);
}

async function getCurrentLocation() {
  return "Boston"; // Simulate lookup
}

async function getWeather(args: { location: string }) {
  return { temperature: 15, precipitation: 90 };
}

main();
