import {McpServer} from "@modelcontextprotocol/sdk/server/mcp.js";
import {StdioServerTransport} from "@modelcontextprotocol/sdk/server/stdio.js";
import {z} from "zod";

const server = new McpServer({
  name: "Demo",
  version: "1.0.0",
});

const weatherDescriptions: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Light rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Freezing rain (light)",
  67: "Freezing rain (heavy)",
  71: "Light snow fall",
  73: "Moderate snow fall",
  75: "Heavy snow fall",
  77: "Snow grains",
  80: "Light rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Light snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

server.registerTool(
    "fetch-weather",
    {
      title: "Fetch Weather",
      description:
          "Fetch the weather forecast for a specific hour of the current day in Cali, Colombia",
      inputSchema: {
        hour: z
            .string()
            .describe("Hour in 24h format (e.g. 09, 14, 18)"),
      },
    },
    async ({hour}) => {
      const requestedHour = Number(hour);

      if (Number.isNaN(requestedHour) || requestedHour < 0 || requestedHour > 23) {
        return {
          content: [
            {
              type: "text",
              text: "Invalid hour. Please provide an hour between 00 and 23.",
            },
          ],
        };
      }

      const geoResponse = await fetch(
          "https://geocoding-api.open-meteo.com/v1/search?name=Cali&count=1&language=en&format=json"
      );
      const geoData = await geoResponse.json();

      if (!geoData.results || geoData.results.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: "Could not find location data for Cali.",
            },
          ],
        };
      }

      const {latitude, longitude} = geoData.results[0];

      const forecastResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weathercode&timezone=America/Bogota`
      );
      const forecastData = await forecastResponse.json();

      const today = new Date().toISOString().split("T")[0];
      const targetTime = `${today}T${hour.padStart(2, "0")}:00`;

      const index = forecastData.hourly.time.indexOf(targetTime);

      if (index === -1) {
        return {
          content: [
            {
              type: "text",
              text: `No forecast available for ${hour}:00 today.`,
            },
          ],
        };
      }

      const temperature = forecastData.hourly.temperature_2m[index];
      const weatherCode = forecastData.hourly.weathercode[index];
      const description = weatherDescriptions[weatherCode] ?? "Unknown weather condition";

      return {
        content: [
          {
            type: "text",
            text: `Weather in Cali at ${hour}:00 — ${temperature}°C, ${description}`,
          },
        ],
      };
    }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

try {
  await main();
} catch (error) {
  console.error("Server error:", error);
}
