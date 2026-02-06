import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from 'zod'

const server = new McpServer({
  name: 'Demo',
  version: '1.0.0',
})

server.registerTool(
    'fetch-weather',
    {
      title: 'Fetch Weather',
      description: 'Fetch weather for a certain hour of the current day and only for the city Cali, in Colombia',
      inputSchema: {
        hour: z.string().describe('Hour to check')
      }
    },
    async ({ hour }) => {
    return {
      content: [
        {
          type: 'text',
          text: `The hour is ${hour}`
        }
      ]
    }
  }
)

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log('MCP server is running...');
}

try {
  await main();
} catch (error) {
  console.error('Server error:', error);
}

