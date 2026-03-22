# ai-contract-kit

A tiny, practical contract layer for AI systems.

This project solves a very common problem in AI applications: inputs and outputs are often treated as loose text instead of predictable interfaces. That makes systems harder to validate, debug, monitor, and improve.

`ai-contract-kit` provides a lightweight envelope for:

- requests to a model
- responses from a model
- validation of required fields
- normalization of uncertainty, refusal, and fallback states

It can be used as both a reference implementation and a lightweight standard for structuring AI interactions.

## Why this project exists

Most AI applications still rely on ad hoc conventions.

One workflow stores prompts as strings.
Another expects JSON.
A third checks for a few fields manually.
A fourth breaks when a model returns a differently shaped answer.

The result is glue code, silent failures, and inconsistent behavior.

This package creates a simple contract that sits between your application and the model layer.

## Mental model

Think of the package as a small interface boundary:

`App -> AI Request Contract -> Model -> AI Response Contract -> App`

The contract sits between your application logic and the model, creating a predictable boundary on both input and output.

This does not replace model SDKs.

It standardizes how your system talks to them.

## What is included

- Request envelope builder
- Response envelope builder
- Validation helpers
- Status normalization for `success`, `uncertain`, `refusal`, and `error`
- Minimal example showing how to wrap a model call
- Basic tests

## Install

```bash
npm install ai-contract-kit
```

## Example

```js
import {
  createRequestEnvelope,
  createResponseEnvelope,
  validateRequestEnvelope,
  validateResponseEnvelope
} from "ai-contract-kit";

const request = createRequestEnvelope({
  task: "summarization",
  prompt: "Summarize the following article in 3 sentences.",
  context: [
    {
      id: "article-1",
      content: "Long article text goes here"
    }
  ],
  constraints: {
    format: "plain_text",
    maxTokens: 250
  }
});

validateRequestEnvelope(request);

const response = createResponseEnvelope({
  status: "success",
  output: {
    text: "This is the short summary.",
    structured: null
  },
  meta: {
    model: "example-model-v1",
    latencyMs: 842
  }
});

validateResponseEnvelope(response);
```

## Request contract

A request envelope looks like this:

```json
{
  "version": "1.0",
  "task": "summarization",
  "prompt": "Summarize the following article in 3 sentences.",
  "context": [
    {
      "id": "article-1",
      "content": "Long article text goes here",
      "source": null,
      "priority": 1
    }
  ],
  "constraints": {
    "format": "plain_text",
    "maxTokens": 250
  },
  "meta": {
    "traceId": "...",
    "createdAt": "..."
  }
}
```

## Response contract

A response envelope looks like this:

```json
{
  "version": "1.0",
  "status": "success",
  "output": {
    "text": "This is the short summary.",
    "structured": null
  },
  "issues": [],
  "meta": {
    "model": "example-model-v1",
    "latencyMs": 842,
    "createdAt": "..."
  }
}
```

## Status model

The response status is intentionally narrow:

- `success` means the system produced a usable result.
- `uncertain` means the result may be incomplete or low-confidence.
- `refusal` means the model declined to answer.
- `error` means the system failed to produce a valid result.

This is useful because most AI systems currently treat all non-ideal results as generic failures. That makes debugging and fallback handling harder than it needs to be.

## Quick wrapper example

```js
import {
  createRequestEnvelope,
  createResponseEnvelope,
  validateRequestEnvelope,
  validateResponseEnvelope,
  toUncertainResponse,
  toErrorResponse
} from "ai-contract-kit";

async function runModel(modelClient, inputText) {
  const request = createRequestEnvelope({
    task: "extraction",
    prompt: "Extract the key entities from the input.",
    context: [{ id: "input", content: inputText }],
    constraints: { format: "json" }
  });

  validateRequestEnvelope(request);

  try {
    const raw = await modelClient.generate(request);

    if (!raw?.text) {
      return toUncertainResponse("Model returned no text output", {
        model: raw?.model ?? "unknown"
      });
    }

    const response = createResponseEnvelope({
      status: "success",
      output: {
        text: raw.text,
        structured: raw.structured ?? null
      },
      meta: {
        model: raw.model ?? "unknown",
        latencyMs: raw.latencyMs ?? null
      }
    });

    validateResponseEnvelope(response);
    return response;
  } catch (error) {
    return toErrorResponse(error instanceof Error ? error.message : "Unknown error");
  }
}
```

## Design Principles

This project is intentionally minimal.

It defines a small, explicit contract layer rather than a full framework. The goal is to provide a stable boundary for AI interactions that is easy to understand, easy to adopt, and easy to extend.

The design emphasizes:

- Simplicity over abstraction
- Explicit structure over implicit behavior
- Reliability over flexibility
- Composability over completeness

This allows the contract to be used across different models, tools, and systems without introducing unnecessary complexity.

## Roadmap

This project is designed as a foundation for more reliable AI systems. Future extensions may include:

- JSON Schema export for validation and interoperability
- TypeScript types for stronger developer ergonomics
- Adapters for common model providers
- Observability hooks for logging and debugging
- Fallback and retry policies
- Evaluation fixtures and reproducible test cases

## License

MIT
