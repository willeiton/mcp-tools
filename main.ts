import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "Demo",
  version: "1.0.0",
});

server.registerTool(
    "fetch-weather",
    {
      title: "Fetch Weather",
      description:
          "Fetch raw hourly weather forecast data for a specific hour of the current day in Cali, Colombia",
      inputSchema: {
        hour: z
            .string()
            .describe("Hour in 24h format (00–23)"),
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

      const location = geoData.results[0];

      const forecastResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&hourly=temperature_2m,weathercode,relativehumidity_2m,windspeed_10m&timezone=America/Bogota`
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

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
                {
                  location: {
                    name: location.name,
                    country: location.country,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    timezone: forecastData.timezone,
                  },
                  requestedTime: targetTime,
                  units: forecastData.hourly_units,
                  forecast: {
                    temperature_2m: forecastData.hourly.temperature_2m[index],
                    weathercode: forecastData.hourly.weathercode[index],
                    relativehumidity_2m:
                        forecastData.hourly.relativehumidity_2m[index],
                    windspeed_10m: forecastData.hourly.windspeed_10m[index],
                  },
                  rawIndex: index,
                },
                null,
                2
            ),
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
