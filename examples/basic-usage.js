import {
  createRequestEnvelope,
  createResponseEnvelope,
  validateRequestEnvelope,
  validateResponseEnvelope
} from "../src/index.js";

const request = createRequestEnvelope({
  task: "summarization",
  prompt: "Summarize the passage in 3 sentences.",
  context: [
    {
      id: "doc-1",
      content: "AI infrastructure includes multiple layers that must work together reliably."
    }
  ],
  constraints: {
    format: "plain_text",
    maxTokens: 180
  }
});

validateRequestEnvelope(request);
console.log("Validated request:\n", JSON.stringify(request, null, 2));

const response = createResponseEnvelope({
  status: "success",
  output: {
    text: "AI infrastructure depends on coordination between hardware, software, and system layers.",
    structured: null
  },
  meta: {
    model: "demo-model",
    latencyMs: 320
  }
});

validateResponseEnvelope(response);
console.log("\nValidated response:\n", JSON.stringify(response, null, 2));
