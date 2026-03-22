import test from "node:test";
import assert from "node:assert/strict";
import {
  createRequestEnvelope,
  createResponseEnvelope,
  validateRequestEnvelope,
  validateResponseEnvelope,
  toUncertainResponse,
  toErrorResponse
} from "../src/index.js";

test("create and validate a request envelope", () => {
  const request = createRequestEnvelope({
    task: "classification",
    prompt: "Classify the input.",
    context: [{ id: "a", content: "Example input" }],
    constraints: { format: "json" }
  });

  assert.equal(validateRequestEnvelope(request), true);
  assert.equal(request.task, "classification");
  assert.ok(request.meta.traceId);
});

test("create and validate a response envelope", () => {
  const response = createResponseEnvelope({
    status: "success",
    output: { text: "ok", structured: null },
    meta: { model: "test-model" }
  });

  assert.equal(validateResponseEnvelope(response), true);
  assert.equal(response.status, "success");
});

test("uncertain response helper returns uncertain status", () => {
  const response = toUncertainResponse("Low confidence output");
  assert.equal(response.status, "uncertain");
  assert.equal(response.issues[0].type, "uncertainty");
});

test("error response helper returns error status", () => {
  const response = toErrorResponse("Request failed");
  assert.equal(response.status, "error");
  assert.equal(response.issues[0].type, "error");
});
