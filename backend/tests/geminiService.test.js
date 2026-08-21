import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_GEMINI_MODELS,
  generatePartyCaption,
} from "../services/geminiService.js";

function jsonResponse(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return data;
    },
    async text() {
      return JSON.stringify(data);
    },
  };
}

test("uses the current free-tier caption models in priority order", () => {
  assert.deepEqual(DEFAULT_GEMINI_MODELS, [
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash-lite",
  ]);
});

test("falls back to the second model when the first model is temporarily unavailable", async () => {
  const requestedUrls = [];
  const fetchImpl = async (url) => {
    requestedUrls.push(url);
    if (requestedUrls.length === 1) {
      return jsonResponse({ error: { message: "temporarily unavailable" } }, 503);
    }
    return jsonResponse({ candidates: [{ content: { parts: [{ text: "คืนนี้ต้องสุด" }] } }] });
  };

  const result = await generatePartyCaption("test-key", "base64", "image/jpeg", {
    fetchImpl,
    timeoutMs: 50,
  });

  assert.equal(result.success, true);
  assert.equal(result.model, "gemini-2.5-flash-lite");
  assert.match(requestedUrls[0], /gemini-3\.5-flash-lite/);
  assert.match(requestedUrls[1], /gemini-2\.5-flash-lite/);
});

test("does not try another model when the API key is rejected", async () => {
  let requestCount = 0;
  const fetchImpl = async () => {
    requestCount += 1;
    return jsonResponse({ error: { message: "invalid API key" } }, 401);
  };

  const result = await generatePartyCaption("bad-key", "base64", "image/jpeg", {
    fetchImpl,
    timeoutMs: 50,
  });

  assert.equal(result.success, false);
  assert.equal(result.status, 401);
  assert.equal(requestCount, 1);
});

test("preserves the most actionable failure when every model fails", async () => {
  let requestCount = 0;
  const fetchImpl = async () => {
    requestCount += 1;
    return requestCount === 1
      ? jsonResponse({ error: { message: "quota exhausted" } }, 429)
      : jsonResponse({ error: { message: "model not found" } }, 404);
  };

  const result = await generatePartyCaption("test-key", "base64", "image/jpeg", {
    fetchImpl,
    timeoutMs: 50,
  });

  assert.equal(result.success, false);
  assert.equal(result.status, 429);
  assert.equal(result.model, "gemini-3.5-flash-lite");
  assert.equal(result.failures.length, 2);
});
