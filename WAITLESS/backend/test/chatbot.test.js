import assert from "node:assert/strict";
import test from "node:test";

import { processChatbotMessage } from "../src/services/aiService.js";
import { withChatbotRateLimit } from "../src/middleware/chatbotRateLimit.js";

test("chatbot keeps the guided FAQ experience available", async () => {
  const result = await processChatbotMessage("hello");

  assert.equal(result.intent, "hello");
  assert.match(result.response, /WaitLess assistant/i);
});

test("chatbot rejects oversized messages before processing them", async () => {
  await assert.rejects(
    () => processChatbotMessage("x".repeat(501)),
    (error) => error.status === 400 && /500 characters/i.test(error.message),
  );
});

test("chatbot rate limiting returns 429 after the public request budget is used", async () => {
  const handler = withChatbotRateLimit(async () => ({ status: 200, body: {} }));
  const request = {
    req: { headers: {}, socket: { remoteAddress: `test-${Date.now()}` } },
    res: { setHeader() {} },
  };

  for (let attempt = 0; attempt < 30; attempt += 1) {
    await handler(request);
  }

  await assert.rejects(
    () => handler(request),
    (error) => error.status === 429 && /too many requests/i.test(error.message),
  );
});

