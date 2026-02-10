# mcp-tools

This repository implements a small MCP (Model Context Protocol) server in `main.ts`.

The following section lists the tools registered in `main.ts`, their inputs, and example usage.

---

## Registered tools

### 1) fetch-weather
- Name: `fetch-weather`
- Title: Fetch Weather
- Description: Fetch raw hourly weather forecast data for a specific hour of the current day in Cali, Colombia.
- Input schema:
  - `hour` (string) — Hour in 24h format (`"00"`–`"23"`). The code converts this to a number and validates that it is between 0 and 23.

- Behavior:
  - Performs geocoding for "Cali" using Open-Meteo's geocoding API.
  - Requests hourly forecast data (temperature_2m, weathercode, relativehumidity_2m, windspeed_10m) from Open-Meteo for the located coordinates and timezone `America/Bogota`.
  - Looks up the forecast for the requested hour on today's date and returns a JSON blob containing location info, requested time, units, and the selected hourly forecast values.
  - If the input hour is invalid or the forecast/time is not found, returns a text message explaining the error.

- Example input (as MCP tool input):

  {
    "hour": "00"
  }

- Example successful response content (text payload, formatted JSON):

  {
    "location": {
      "name": "Cali",
      "country": "Colombia",
      "latitude": 3.4516,
      "longitude": -76.5320,
      "timezone": "America/Bogota"
    },
    "requestedTime": "2026-02-09T00:00",
    "units": {
      "temperature_2m": "°C",
      "relativehumidity_2m": "%",
      "windspeed_10m": "km/h",
      "weathercode": ""
    },
    "forecast": {
      "temperature_2m": 22.3,
      "weathercode": 0,
      "relativehumidity_2m": 85,
      "windspeed_10m": 3.6
    },
    "rawIndex": 23
  }

- Notes:
  - The tool expects `hour` as a string (it calls `Number(hour)` internally). It validates the numeric range and will return an error message for invalid inputs.
  - The tool uses today's date (server local time in ISO format) to build the target timestamp (`YYYY-MM-DDTHH:00`). Therefore, server date/time affects which day's forecast is looked up.
  - This server returns the result inside an MCP `content` array where the tool's single element is a `text` item containing the JSON payload as a string.

---

## How to run the server (developer notes)
- The MCP server is implemented in `main.ts` and uses `@modelcontextprotocol/sdk`.
- The server connects with `StdioServerTransport()` which expects an MCP client over stdio.
- Typical flow to test locally:
  1. Install dependencies (e.g., `npm install` or your package manager of choice).
  2. Build/compile TypeScript (if needed) and start the server (your `package.json` may provide scripts).
  3. Connect an MCP client to the server's stdin/stdout and invoke the `fetch-weather` tool with the input shown above.

If you'd like, I can also add a small example client or an npm script to call `fetch-weather` directly from this repo.
