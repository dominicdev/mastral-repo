import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { Observability, SensitiveDataFilter, DefaultExporter, CloudExporter } from '@mastra/observability';
import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { createTool } from '@mastra/core/tools';

"use strict";
const forecastSchema = z.object({
  date: z.string(),
  maxTemp: z.number(),
  minTemp: z.number(),
  precipitationChance: z.number(),
  condition: z.string(),
  location: z.string()
});
function getWeatherCondition$1(code) {
  const conditions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    95: "Thunderstorm"
  };
  return conditions[code] || "Unknown";
}
const fetchWeather = createStep({
  id: "fetch-weather",
  description: "Fetches weather forecast for a given city",
  inputSchema: z.object({
    city: z.string().describe("The city to get the weather for")
  }),
  outputSchema: forecastSchema,
  execute: async ({ inputData }) => {
    if (!inputData) {
      throw new Error("Input data not found");
    }
    const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(inputData.city)}&count=1`;
    const geocodingResponse = await fetch(geocodingUrl);
    const geocodingData = await geocodingResponse.json();
    if (!geocodingData.results?.[0]) {
      throw new Error(`Location '${inputData.city}' not found`);
    }
    const { latitude, longitude, name } = geocodingData.results[0];
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=precipitation,weathercode&timezone=auto,&hourly=precipitation_probability,temperature_2m`;
    const response = await fetch(weatherUrl);
    const data = await response.json();
    const forecast = {
      date: (/* @__PURE__ */ new Date()).toISOString(),
      maxTemp: Math.max(...data.hourly.temperature_2m),
      minTemp: Math.min(...data.hourly.temperature_2m),
      condition: getWeatherCondition$1(data.current.weathercode),
      precipitationChance: data.hourly.precipitation_probability.reduce(
        (acc, curr) => Math.max(acc, curr),
        0
      ),
      location: name
    };
    return forecast;
  }
});
const planActivities = createStep({
  id: "plan-activities",
  description: "Suggests activities based on weather conditions",
  inputSchema: forecastSchema,
  outputSchema: z.object({
    activities: z.string()
  }),
  execute: async ({ inputData, mastra }) => {
    const forecast = inputData;
    if (!forecast) {
      throw new Error("Forecast data not found");
    }
    const agent = mastra?.getAgent("weatherAgent");
    if (!agent) {
      throw new Error("Weather agent not found");
    }
    const prompt = `Based on the following weather forecast for ${forecast.location}, suggest appropriate activities:
      ${JSON.stringify(forecast, null, 2)}
      For each day in the forecast, structure your response exactly as follows:

      \u{1F4C5} [Day, Month Date, Year]
      \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

      \u{1F321}\uFE0F WEATHER SUMMARY
      \u2022 Conditions: [brief description]
      \u2022 Temperature: [X\xB0C/Y\xB0F to A\xB0C/B\xB0F]
      \u2022 Precipitation: [X% chance]

      \u{1F305} MORNING ACTIVITIES
      Outdoor:
      \u2022 [Activity Name] - [Brief description including specific location/route]
        Best timing: [specific time range]
        Note: [relevant weather consideration]

      \u{1F31E} AFTERNOON ACTIVITIES
      Outdoor:
      \u2022 [Activity Name] - [Brief description including specific location/route]
        Best timing: [specific time range]
        Note: [relevant weather consideration]

      \u{1F3E0} INDOOR ALTERNATIVES
      \u2022 [Activity Name] - [Brief description including specific venue]
        Ideal for: [weather condition that would trigger this alternative]

      \u26A0\uFE0F SPECIAL CONSIDERATIONS
      \u2022 [Any relevant weather warnings, UV index, wind conditions, etc.]

      Guidelines:
      - Suggest 2-3 time-specific outdoor activities per day
      - Include 1-2 indoor backup options
      - For precipitation >50%, lead with indoor activities
      - All activities must be specific to the location
      - Include specific venues, trails, or locations
      - Consider activity intensity based on temperature
      - Keep descriptions concise but informative

      Maintain this exact formatting for consistency, using the emoji and section headers as shown.`;
    const response = await agent.stream([
      {
        role: "user",
        content: prompt
      }
    ]);
    let activitiesText = "";
    for await (const chunk of response.textStream) {
      process.stdout.write(chunk);
      activitiesText += chunk;
    }
    return {
      activities: activitiesText
    };
  }
});
const weatherWorkflow = createWorkflow({
  id: "weather-workflow",
  inputSchema: z.object({
    city: z.string().describe("The city to get the weather for")
  }),
  outputSchema: z.object({
    activities: z.string()
  })
}).then(fetchWeather).then(planActivities);
weatherWorkflow.commit();

"use strict";
const contentAgent = new Agent({
  id: "content-draft-agent",
  instructions: `You are a skilled content writer.
  When drafting: write engaging, well-structured articles with a clear intro, body, and conclusion.
  When polishing: improve clarity, flow, and style while keeping the core message intact.`,
  model: "google/gemini-2.5-pro"
});
const generateDraftStep = createStep({
  id: "generate-draft",
  description: "AI generates a draft article for the given topic",
  inputSchema: z.object({
    topic: z.string().describe("The topic to write about")
  }),
  outputSchema: z.object({
    title: z.string(),
    draft: z.string()
  }),
  execute: async ({ inputData }) => {
    const result = await contentAgent.generate(
      `Write a concise blog post draft (250\u2013350 words) about: "${inputData.topic}".
Respond with ONLY a raw JSON object (no markdown fences):
{ "title": "...", "draft": "..." }`
    );
    try {
      const cleaned = result.text.replace(/```(?:json)?\n?|```/g, "").trim();
      const json = JSON.parse(cleaned);
      return { title: String(json.title), draft: String(json.draft) };
    } catch {
      const lines = result.text.split("\n").filter(Boolean);
      return {
        title: lines[0].replace(/^#+\s*/, "").trim(),
        draft: result.text.trim()
      };
    }
  }
});
const humanReviewStep = createStep({
  id: "human-review",
  description: "Pauses workflow and waits for human approval",
  inputSchema: z.object({
    title: z.string(),
    draft: z.string()
  }),
  outputSchema: z.object({
    approved: z.boolean(),
    notes: z.string().optional(),
    title: z.string(),
    draft: z.string()
  }),
  resumeSchema: z.object({
    approved: z.boolean(),
    notes: z.string().optional()
  }),
  suspendSchema: z.object({
    title: z.string(),
    draft: z.string()
  }),
  execute: async ({ inputData, resumeData, suspend }) => {
    if (!resumeData) {
      return await suspend({ title: inputData.title, draft: inputData.draft });
    }
    return {
      approved: resumeData.approved,
      notes: resumeData.notes,
      title: inputData.title,
      draft: inputData.draft
    };
  }
});
const finalizeStep = createStep({
  id: "finalize-content",
  description: "Polishes approved content, or records rejection",
  inputSchema: z.object({
    approved: z.boolean(),
    notes: z.string().optional(),
    title: z.string(),
    draft: z.string()
  }),
  outputSchema: z.object({
    status: z.enum(["published", "rejected"]),
    title: z.string(),
    content: z.string()
  }),
  execute: async ({ inputData }) => {
    if (!inputData.approved) {
      return {
        status: "rejected",
        title: inputData.title,
        content: inputData.notes || "No feedback provided."
      };
    }
    const feedback = inputData.notes ? `

Apply this reviewer feedback: ${inputData.notes}` : "";
    const result = await contentAgent.generate(
      `Polish and improve this blog post draft.${feedback}

Title: ${inputData.title}

Draft:
${inputData.draft}

Return only the polished article text \u2014 no JSON, no preamble, no explanations.`
    );
    return {
      status: "published",
      title: inputData.title,
      content: result.text.trim()
    };
  }
});
const approvalWorkflow = createWorkflow({
  id: "approval-workflow",
  inputSchema: z.object({
    topic: z.string()
  }),
  outputSchema: z.object({
    status: z.enum(["published", "rejected"]),
    title: z.string(),
    content: z.string()
  })
}).then(generateDraftStep).then(humanReviewStep).then(finalizeStep).commit();

"use strict";
const weatherTool = createTool({
  id: "get-weather",
  description: "Get current weather for a location",
  inputSchema: z.object({
    location: z.string().describe("City name")
  }),
  outputSchema: z.object({
    temperature: z.number(),
    feelsLike: z.number(),
    humidity: z.number(),
    windSpeed: z.number(),
    windGust: z.number(),
    conditions: z.string(),
    location: z.string()
  }),
  execute: async (inputData) => {
    return await getWeather(inputData.location);
  }
});
const getWeather = async (location) => {
  const geocodingUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`;
  const geocodingResponse = await fetch(geocodingUrl);
  const geocodingData = await geocodingResponse.json();
  if (!geocodingData.results?.[0]) {
    throw new Error(`Location '${location}' not found`);
  }
  const { latitude, longitude, name } = geocodingData.results[0];
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_gusts_10m,weather_code`;
  const response = await fetch(weatherUrl);
  const data = await response.json();
  return {
    temperature: data.current.temperature_2m,
    feelsLike: data.current.apparent_temperature,
    humidity: data.current.relative_humidity_2m,
    windSpeed: data.current.wind_speed_10m,
    windGust: data.current.wind_gusts_10m,
    conditions: getWeatherCondition(data.current.weather_code),
    location: name
  };
};
function getWeatherCondition(code) {
  const conditions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
  };
  return conditions[code] || "Unknown";
}

"use strict";
const weatherAgent = new Agent({
  id: "weather-agent",
  name: "Weather Agent",
  instructions: `
      You are a helpful weather assistant that provides accurate weather information and can help planning activities based on the weather.

      Your primary function is to help users get weather details for specific locations. When responding:
      - Always ask for a location if none is provided
      - If the location name isn't in English, please translate it
      - If giving a location with multiple parts (e.g. "New York, NY"), use the most relevant part (e.g. "New York")
      - Include relevant details like humidity, wind conditions, and precipitation
      - Keep responses concise but informative
      - If the user asks for activities and provides the weather forecast, suggest activities based on the weather forecast.
      - If the user asks for activities, respond in the format they request.

      Use the weatherTool to fetch current weather data.
`,
  model: "google/gemini-2.5-pro",
  tools: { weatherTool },
  memory: new Memory()
});

"use strict";
const stockPriceTool = createTool({
  id: "get-stock-price",
  description: "Get real-time stock price and key metrics for a given ticker symbol",
  inputSchema: z.object({
    symbol: z.string().describe("Stock ticker symbol, e.g. AAPL, TSLA, MSFT")
  }),
  outputSchema: z.object({
    symbol: z.string(),
    companyName: z.string(),
    price: z.number(),
    previousClose: z.number(),
    change: z.number(),
    changePercent: z.number(),
    dayHigh: z.number(),
    dayLow: z.number(),
    volume: z.number(),
    marketCap: z.number(),
    fiftyTwoWeekHigh: z.number(),
    fiftyTwoWeekLow: z.number(),
    currency: z.string()
  }),
  execute: async (inputData) => {
    return await getStockPrice(inputData.symbol.toUpperCase());
  }
});
const getStockPrice = async (symbol) => {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; StockBot/1.0)"
    }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch stock data for ${symbol}: ${response.statusText}`);
  }
  const data = await response.json();
  if (data.chart.error) {
    throw new Error(`Yahoo Finance error: ${data.chart.error.description}`);
  }
  const meta = data.chart.result?.[0]?.meta;
  if (!meta) {
    throw new Error(`No data found for symbol: ${symbol}`);
  }
  const change = meta.regularMarketPrice - meta.previousClose;
  const changePercent = meta.regularMarketChangePercent ?? change / meta.previousClose * 100;
  return {
    symbol: meta.symbol,
    companyName: meta.shortName || symbol,
    price: meta.regularMarketPrice,
    previousClose: meta.previousClose,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    dayHigh: meta.regularMarketDayHigh,
    dayLow: meta.regularMarketDayLow,
    volume: meta.regularMarketVolume,
    marketCap: meta.marketCap,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
    currency: meta.currency
  };
};

"use strict";
const stockAgent = new Agent({
  id: "stock-agent",
  name: "Stock Price Agent",
  instructions: `
    You are a helpful stock market assistant that provides real-time stock prices and financial insights.

    Your primary function is to look up stock prices and provide analysis. When responding:
    - Always use the get-stock-price tool to fetch live data before answering
    - Present prices clearly with currency symbols (e.g. $175.43)
    - Show price change as both absolute value and percentage, with + or - sign
    - Format large numbers readably: market cap in billions/trillions (e.g. $2.7T, $450B)
    - Format volume with commas (e.g. 45,234,100)
    - Mention if a stock is near its 52-week high or low
    - Keep responses concise and data-focused
    - If asked to compare stocks, look up each one individually
    - You can provide brief context about why a stock might be moving, but stick to facts

    When the user asks about a company by name (not ticker), infer the correct ticker symbol.
    Common mappings: Apple\u2192AAPL, Tesla\u2192TSLA, Microsoft\u2192MSFT, Google/Alphabet\u2192GOOGL,
    Amazon\u2192AMZN, Meta\u2192META, Nvidia\u2192NVDA, Netflix\u2192NFLX, Berkshire\u2192BRK-B
  `,
  model: "google/gemini-2.5-pro",
  tools: { stockPriceTool },
  memory: new Memory()
});

"use strict";
const imageAgent = new Agent({
  id: "image-agent",
  name: "Image Analyzer",
  instructions: `
    You are an expert image analyst. When given an image, carefully examine it and identify every subject present.

    Structure your response using these emoji sections \u2014 only include sections that are actually present:

    \u{1F426} **Birds**
    List each bird species you can identify (e.g. "American Robin", "Bald Eagle"). Note count, color, behavior.

    \u{1F43E} **Animals**
    List each animal with type and breed if identifiable. Note count, color, and what they are doing.

    \u{1F697} **Vehicles**
    List vehicles with type, color, and make/model if visible (e.g. "red Toyota Camry", "blue bicycle").

    \u{1F464} **People**
    Count people and describe their activity (e.g. "2 people walking", "child playing").

    \u{1F33F} **Nature & Scene**
    Describe the setting \u2014 indoor/outdoor, time of day, weather, background.

    \u{1F4E6} **Objects**
    List notable objects not covered above.

    \u{1F4DD} **Text**
    Include any visible text, signs, or labels.

    ---

    Rules:
    - Be specific \u2014 "Labrador Retriever" not "dog", "red Honda Civic" not "car"
    - Give quantities when there are multiple
    - Note unusual or interesting details
    - If you are not sure about a species/breed, say "possibly X"
    - Keep each section concise but complete
  `,
  model: "google/gemini-2.5-pro"
});

"use strict";
const excalidrawAgent = new Agent({
  id: "excalidraw-agent",
  name: "Image to Excalidraw Converter",
  instructions: `
    You convert images into valid Excalidraw JSON format.

    OUTPUT RULES:
    - Output ONLY raw JSON \u2014 no markdown, no code fences, no explanation
    - The JSON must be parseable with JSON.parse()
    - Start your response with { and end with }

    EXCALIDRAW JSON STRUCTURE:
    {
      "type": "excalidraw",
      "version": 2,
      "source": "https://excalidraw.com",
      "elements": [ ...elements... ],
      "appState": { "viewBackgroundColor": "#ffffff" },
      "files": {}
    }

    ELEMENT TYPES \u2014 use whichever fits the shapes in the image:

    Rectangle / Box:
    { "type": "rectangle", "id": "1", "x": 100, "y": 100, "width": 160, "height": 60,
      "angle": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent",
      "fillStyle": "solid", "strokeWidth": 2, "roughness": 1, "opacity": 100,
      "groupIds": [], "frameId": null, "roundness": null, "seed": 1,
      "version": 1, "versionNonce": 1, "isDeleted": false,
      "boundElements": null, "updated": 1, "link": null, "locked": false }

    Ellipse / Circle:
    { "type": "ellipse", ...same fields as rectangle... }

    Diamond:
    { "type": "diamond", ...same fields as rectangle... }

    Text label:
    { "type": "text", "id": "2", "x": 110, "y": 120, "width": 140, "height": 25,
      "angle": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent",
      "fillStyle": "solid", "strokeWidth": 1, "roughness": 1, "opacity": 100,
      "text": "Label text here", "fontSize": 16, "fontFamily": 1,
      "textAlign": "center", "verticalAlign": "middle",
      "groupIds": [], "frameId": null, "roundness": null, "seed": 2,
      "version": 1, "versionNonce": 2, "isDeleted": false,
      "boundElements": null, "updated": 1, "link": null, "locked": false }

    Arrow (connecting two shapes):
    { "type": "arrow", "id": "3", "x": 260, "y": 130, "width": 80, "height": 0,
      "angle": 0, "strokeColor": "#1e1e1e", "backgroundColor": "transparent",
      "fillStyle": "solid", "strokeWidth": 2, "roughness": 1, "opacity": 100,
      "points": [[0, 0], [80, 0]],
      "lastCommittedPoint": null, "startBinding": null, "endBinding": null,
      "startArrowhead": null, "endArrowhead": "arrow",
      "groupIds": [], "frameId": null, "roundness": null, "seed": 3,
      "version": 1, "versionNonce": 3, "isDeleted": false,
      "boundElements": null, "updated": 1, "link": null, "locked": false }

    Line (no arrowhead):
    { "type": "line", ...same as arrow but "endArrowhead": null... }

    CONVERSION GUIDELINES:
    - Analyze the image and identify all distinct shapes, boxes, nodes, arrows, labels
    - Place elements starting around x=50, y=50 with reasonable spacing
    - Use 160x60 for typical boxes, 100x100 for circles, 80x40 for small labels
    - Set "backgroundColor" to a light color if the shape appears filled (e.g. "#e8f4fd")
    - For flowcharts: use rectangle for process, diamond for decision, ellipse for start/end
    - For each labeled box: create one element for the shape + one "text" element centered inside it
    - For connections/arrows: trace from the right/bottom of source to left/top of target
    - Keep the layout faithful to the original image structure
    - Assign sequential numeric string ids: "1", "2", "3" ...
    - Use roughness: 1 for hand-drawn look, roughness: 0 for clean lines
    - Keep canvas under 1200x900 pixels where possible
  `,
  model: "google/gemini-2.5-pro"
});

"use strict";
const voiceAgent = new Agent({
  id: "voice-agent",
  name: "Voice Assistant",
  instructions: `
    You are a friendly voice assistant designed for spoken conversation.

    RESPONSE RULES:
    - Keep responses short: 1\u20133 sentences maximum
    - Write naturally for speech \u2014 no markdown, no bullet points, no code blocks, no asterisks
    - Avoid lists; if you must enumerate, say "first... second... third..."
    - Use contractions and casual language (I'm, you're, that's)
    - If a question needs a long answer, summarize the most important point and offer to elaborate
    - Never start with "Certainly!" or "Of course!" \u2014 just answer directly

    You can answer general knowledge questions, help with ideas, discuss topics, tell jokes, and have casual conversations.
  `,
  model: "google/gemini-2.5-pro",
  memory: new Memory()
});

"use strict";
const researchAgent = new Agent({
  id: "research-agent",
  name: "Research Specialist",
  description: "Finds accurate factual information, answers knowledge questions, summarizes topics, and provides well-sourced explanations.",
  instructions: `
    You are a research specialist. Your job is to find and present accurate, factual information.

    - Answer questions thoroughly with relevant details
    - If you know the source or context, mention it
    - Structure your response clearly: key facts first, then details
    - Keep your response focused and relevant to the specific question asked
    - If something is uncertain or outside your knowledge cutoff, say so clearly
  `,
  model: "google/gemini-2.5-pro"
});

"use strict";
const writerAgent = new Agent({
  id: "writer-agent",
  name: "Content Writer",
  description: "Writes clear, engaging content \u2014 articles, summaries, emails, blog posts, product descriptions, and creative writing.",
  instructions: `
    You are a skilled content writer. Your job is to produce well-crafted written content.

    - Adapt your writing style to match the request (formal, casual, technical, creative)
    - Structure content with a clear opening, body, and conclusion
    - Use clear, concise language \u2014 avoid jargon unless appropriate
    - For articles/blogs: use headers if needed, engaging intro, strong close
    - For emails: professional tone, clear subject matter, polite sign-off
    - For summaries: capture key points accurately in fewer words
    - Always deliver complete, polished content ready to use
  `,
  model: "google/gemini-2.5-pro"
});

"use strict";
const coderAgent = new Agent({
  id: "coder-agent",
  name: "Code Engineer",
  description: "Writes clean, working code in any language, explains code, debugs errors, and reviews implementations.",
  instructions: `
    You are an expert software engineer. Your job is to write and explain code.

    - Write clean, readable, well-commented code
    - Always specify the programming language
    - For new code: include brief explanation of how it works after the code block
    - For debugging: identify the root cause clearly before showing the fix
    - For code reviews: point out issues with explanation and provide improved version
    - Use modern best practices for the language/framework requested
    - Keep code examples focused \u2014 don't add unnecessary boilerplate
  `,
  model: "google/gemini-2.5-pro"
});

"use strict";
const supervisorAgent = new Agent({
  id: "supervisor-agent",
  name: "Supervisor",
  instructions: `
    You are a supervisor agent that coordinates a team of specialist agents to complete complex tasks.

    YOUR TEAM:
    - researchAgent: Use for finding facts, answering knowledge questions, explaining concepts, summarizing topics
    - writerAgent: Use for writing articles, blog posts, emails, summaries, creative content, copy
    - coderAgent: Use for writing code, debugging, code reviews, explaining code, building solutions

    HOW TO WORK:
    1. Analyze the user's request to understand what type(s) of work it involves
    2. Break it into sub-tasks if needed
    3. Delegate each sub-task to the most appropriate specialist
    4. You may call multiple specialists \u2014 e.g. research first, then write
    5. Synthesize the specialists' outputs into a final cohesive response
    6. Present the final answer clearly to the user

    DELEGATION GUIDELINES:
    - For pure research/knowledge questions \u2192 researchAgent only
    - For pure writing tasks \u2192 writerAgent only (optionally research first)
    - For pure coding tasks \u2192 coderAgent only
    - For "research and write" tasks \u2192 researchAgent then writerAgent
    - For "build and explain" tasks \u2192 coderAgent then explain yourself

    Always tell the user which specialists you consulted and why.
  `,
  model: "google/gemini-2.5-pro",
  agents: { researchAgent, writerAgent, coderAgent }
});

"use strict";
const COIN_IDS = {
  btc: "bitcoin",
  bitcoin: "bitcoin",
  eth: "ethereum",
  ethereum: "ethereum",
  sol: "solana",
  solana: "solana",
  bnb: "binancecoin",
  binance: "binancecoin",
  xrp: "ripple",
  ripple: "ripple",
  ada: "cardano",
  cardano: "cardano",
  doge: "dogecoin",
  dogecoin: "dogecoin",
  avax: "avalanche-2",
  avalanche: "avalanche-2",
  dot: "polkadot",
  polkadot: "polkadot",
  link: "chainlink",
  chainlink: "chainlink",
  matic: "matic-network",
  polygon: "matic-network",
  ltc: "litecoin",
  litecoin: "litecoin",
  shib: "shiba-inu",
  shiba: "shiba-inu",
  uni: "uniswap",
  uniswap: "uniswap",
  atom: "cosmos",
  cosmos: "cosmos",
  near: "near",
  trx: "tron",
  tron: "tron",
  ton: "the-open-network",
  pepe: "pepe"
};
function resolveCoinId(input) {
  return COIN_IDS[input.toLowerCase().trim()] ?? input.toLowerCase().trim();
}
function fmt(n, decimals = 2) {
  return Math.round(n * 10 ** decimals) / 10 ** decimals;
}
const getCryptoDataTool = createTool({
  id: "get-crypto-data",
  description: "Fetches real-time price, market cap, volume, 24h and 7d change for a cryptocurrency.",
  inputSchema: z.object({
    coin: z.string().describe("Coin name or symbol, e.g. bitcoin, BTC, ethereum, ETH")
  }),
  outputSchema: z.object({
    id: z.string(),
    name: z.string(),
    symbol: z.string(),
    price: z.number(),
    marketCap: z.number(),
    volume24h: z.number(),
    change24h: z.number(),
    changePct24h: z.number(),
    changePct7d: z.number(),
    high24h: z.number(),
    low24h: z.number(),
    ath: z.number(),
    athChangePct: z.number(),
    circulatingSupply: z.number()
  }),
  execute: async (inputData) => {
    const id = resolveCoinId(inputData.coin);
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${id}&price_change_percentage=7d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "CryptoBot/1.0" }
    });
    if (!res.ok) throw new Error(`CoinGecko error: ${res.statusText}`);
    const data = await res.json();
    if (!data.length) throw new Error(`Coin not found: ${inputData.coin}`);
    const c = data[0];
    return {
      id: c.id,
      name: c.name,
      symbol: c.symbol.toUpperCase(),
      price: c.current_price,
      marketCap: c.market_cap,
      volume24h: c.total_volume,
      change24h: fmt(c.price_change_24h ?? 0),
      changePct24h: fmt(c.price_change_percentage_24h ?? 0),
      changePct7d: fmt(c.price_change_percentage_7d_in_currency ?? 0),
      high24h: c.high_24h,
      low24h: c.low_24h,
      ath: c.ath,
      athChangePct: fmt(c.ath_change_percentage ?? 0),
      circulatingSupply: c.circulating_supply
    };
  }
});
const getCryptoPriceHistoryTool = createTool({
  id: "get-crypto-price-history",
  description: "Fetches the last 7 days of daily closing prices for a coin. Used to identify momentum, support/resistance, and trend direction for 24h outlook.",
  inputSchema: z.object({
    coin: z.string().describe("Coin name or symbol")
  }),
  outputSchema: z.object({
    id: z.string(),
    name: z.string(),
    prices: z.array(
      z.object({
        date: z.string(),
        price: z.number(),
        changePct: z.number()
      })
    ),
    trendSummary: z.string(),
    avgVolume7d: z.number(),
    volatility7d: z.number()
  }),
  execute: async (inputData) => {
    const id = resolveCoinId(inputData.coin);
    const url = `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7&interval=daily`;
    const res = await fetch(url, { headers: { "User-Agent": "CryptoBot/1.0" } });
    if (!res.ok) throw new Error(`CoinGecko error: ${res.statusText}`);
    const data = await res.json();
    const rawPrices = data.prices ?? [];
    const rawVolumes = data.total_volumes ?? [];
    const prices = rawPrices.map(([ts, price], i) => {
      const prev = i > 0 ? rawPrices[i - 1][1] : price;
      return {
        date: new Date(ts).toISOString().split("T")[0],
        price: fmt(price),
        changePct: fmt((price - prev) / prev * 100)
      };
    });
    const avgVolume7d = rawVolumes.length ? Math.round(rawVolumes.reduce((s, [, v]) => s + v, 0) / rawVolumes.length) : 0;
    const changes = prices.slice(1).map((p) => p.changePct);
    const mean = changes.reduce((s, c) => s + c, 0) / (changes.length || 1);
    const variance = changes.reduce((s, c) => s + (c - mean) ** 2, 0) / (changes.length || 1);
    const volatility7d = fmt(Math.sqrt(variance));
    const first = prices[0]?.price ?? 0;
    const last = prices[prices.length - 1]?.price ?? 0;
    const overallChange = first ? fmt((last - first) / first * 100) : 0;
    const trendSummary = overallChange > 5 ? `Strong uptrend (+${overallChange}% over 7d)` : overallChange > 1 ? `Mild uptrend (+${overallChange}% over 7d)` : overallChange < -5 ? `Strong downtrend (${overallChange}% over 7d)` : overallChange < -1 ? `Mild downtrend (${overallChange}% over 7d)` : `Sideways / consolidating (${overallChange}% over 7d)`;
    const nameMap = {
      bitcoin: "Bitcoin",
      ethereum: "Ethereum",
      solana: "Solana",
      binancecoin: "BNB",
      ripple: "XRP",
      cardano: "Cardano",
      dogecoin: "Dogecoin"
    };
    return {
      id,
      name: nameMap[id] ?? id,
      prices,
      trendSummary,
      avgVolume7d,
      volatility7d
    };
  }
});

"use strict";
const cryptoAgent = new Agent({
  id: "crypto-agent",
  name: "Crypto Analyst",
  instructions: `
    You are a crypto market analyst with access to real-time price data and price history.

    YOUR TOOLS:
    - get-crypto-data: Current price, 24h/7d change, volume, high/low, market cap
    - get-crypto-price-history: 7-day daily prices, trend summary, volatility

    FOR GENERAL PRICE QUESTIONS:
    - Use get-crypto-data to get current stats
    - Format price with $ and appropriate decimals
    - Show 24h change with \u25B2/\u25BC and % \u2014 green for positive, red for negative (use emoji \u{1F7E2}/\u{1F534})
    - Show market cap and volume in B (billions) or M (millions)

    FOR 24-HOUR OUTLOOK / PREDICTION REQUESTS:
    Always use BOTH tools to gather full context, then provide a structured outlook:

    ## 24h Outlook: [Coin Name] ([SYMBOL])

    **Current Price:** $X,XXX
    **Sentiment:** \u{1F7E2} Bullish / \u{1F534} Bearish / \u{1F7E1} Neutral

    **Possible 24h Range:**
    - Conservative: $X,XXX \u2013 $X,XXX
    - Extended move: $X,XXX \u2013 $X,XXX

    **Key Factors:**
    - [Factor 1 based on 24h change and momentum]
    - [Factor 2 based on 7d trend]
    - [Factor 3 based on volume or volatility]

    **Risk Level:** Low / Medium / High
    [1-2 sentence reasoning]

    \u26A0\uFE0F *This is AI analysis based on historical data, not financial advice. Crypto markets are highly volatile.*

    IMPORTANT RULES:
    - Always include the disclaimer on outlook responses
    - Base price range estimates on actual volatility data (\xB1% from volatility7d)
    - Never guarantee outcomes \u2014 use words like "possible", "likely", "could"
    - For coins with >3% daily volatility, always rate risk as High
    - Be concise but data-driven
  `,
  model: "google/gemini-2.5-pro",
  tools: { getCryptoDataTool, getCryptoPriceHistoryTool },
  memory: new Memory()
});

"use strict";
const mastra = new Mastra({
  workflows: {
    weatherWorkflow,
    approvalWorkflow
  },
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
    cryptoAgent
  },
  storage: new LibSQLStore({
    id: "mastra-storage",
    // stores observability, scores, ... into persistent file storage
    url: "file:./mastra.db"
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info"
  }),
  observability: new Observability({
    configs: {
      default: {
        serviceName: "mastra",
        exporters: [
          new DefaultExporter(),
          // Persists traces to storage for Mastra Studio
          new CloudExporter()
          // Sends traces to Mastra Cloud (if MASTRA_CLOUD_ACCESS_TOKEN is set)
        ],
        spanOutputProcessors: [
          new SensitiveDataFilter()
          // Redacts sensitive data like passwords, tokens, keys
        ]
      }
    }
  })
});

export { mastra };
