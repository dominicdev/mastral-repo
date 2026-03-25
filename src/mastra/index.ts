import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";
import {
  Observability,
  DefaultExporter,
  SensitiveDataFilter,
} from "@mastra/observability";
import { weatherWorkflow } from "./workflows/weather-workflow";
import { approvalWorkflow } from "./workflows/approval-workflow";
import { weatherAgent } from "./agents/weather-agent";
import { stockAgent } from "./agents/stock-agent";
import { imageAgent } from "./agents/image-agent";
import { excalidrawAgent } from "./agents/excalidraw-agent";
import { voiceAgent } from "./agents/voice-agent";
import { supervisorAgent } from "./agents/supervisor-agent";
import { researchAgent } from "./agents/research-agent";
import { writerAgent } from "./agents/writer-agent";
import { coderAgent } from "./agents/coder-agent";
import { cryptoAgent } from "./agents/crypto-agent";

export const mastra = new Mastra({
  workflows: { weatherWorkflow, approvalWorkflow },
  agents: {
    weatherAgent,
    stockAgent,
    imageAgent,
    excalidrawAgent,
    voiceAgent,
    supervisorAgent,
    researchAgent,
    writerAgent,
    coderAgent,
    cryptoAgent,
  },
  storage: new LibSQLStore({
    id: "mastra-storage",
    url: process.env.TURSO_DATABASE_URL
      ?? (process.env.NODE_ENV === "production" ? ":memory:" : "file:./mastra.db"),
    authToken: process.env.TURSO_AUTH_TOKEN,
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: "mastra",
        exporters: [
          new DefaultExporter(), // Persists traces to storage for Mastra Studio
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter(), // Redacts sensitive data like passwords, tokens, keys
        ],
      },
    },
  }),
});
