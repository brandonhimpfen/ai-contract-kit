const VALID_STATUSES = new Set(["success", "uncertain", "refusal", "error"]);

function nowIso() {
  return new Date().toISOString();
}

function createTraceId() {
  return `trace_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export function createRequestEnvelope({
  version = "1.0",
  task,
  prompt,
  context = [],
  constraints = {},
  meta = {}
} = {}) {
  return {
    version,
    task,
    prompt,
    context: context.map((item, index) => ({
      id: item?.id ?? `context-${index + 1}`,
      content: item?.content ?? "",
      source: item?.source ?? null,
      priority: item?.priority ?? index + 1
    })),
    constraints,
    meta: {
      traceId: meta.traceId ?? createTraceId(),
      createdAt: meta.createdAt ?? nowIso(),
      ...meta
    }
  };
}

export function createResponseEnvelope({
  version = "1.0",
  status,
  output = { text: null, structured: null },
  issues = [],
  meta = {}
} = {}) {
  return {
    version,
    status,
    output: {
      text: output?.text ?? null,
      structured: output?.structured ?? null
    },
    issues,
    meta: {
      createdAt: meta.createdAt ?? nowIso(),
      model: meta.model ?? null,
      latencyMs: meta.latencyMs ?? null,
      ...meta
    }
  };
}

export function validateRequestEnvelope(envelope) {
  assert(isPlainObject(envelope), "Request envelope must be an object.");
  assert(typeof envelope.version === "string" && envelope.version.length > 0, "Request envelope must include a version.");
  assert(typeof envelope.task === "string" && envelope.task.trim().length > 0, "Request envelope must include a task.");
  assert(typeof envelope.prompt === "string" && envelope.prompt.trim().length > 0, "Request envelope must include a prompt.");
  assert(Array.isArray(envelope.context), "Request envelope context must be an array.");
  assert(isPlainObject(envelope.constraints), "Request envelope constraints must be an object.");
  assert(isPlainObject(envelope.meta), "Request envelope meta must be an object.");
  assert(typeof envelope.meta.traceId === "string" && envelope.meta.traceId.length > 0, "Request envelope meta.traceId is required.");
  assert(typeof envelope.meta.createdAt === "string" && envelope.meta.createdAt.length > 0, "Request envelope meta.createdAt is required.");

  envelope.context.forEach((item, index) => {
    assert(isPlainObject(item), `Context item at index ${index} must be an object.`);
    assert(typeof item.id === "string" && item.id.length > 0, `Context item at index ${index} must include an id.`);
    assert(typeof item.content === "string", `Context item at index ${index} must include content.`);
  });

  return true;
}

export function validateResponseEnvelope(envelope) {
  assert(isPlainObject(envelope), "Response envelope must be an object.");
  assert(typeof envelope.version === "string" && envelope.version.length > 0, "Response envelope must include a version.");
  assert(typeof envelope.status === "string" && VALID_STATUSES.has(envelope.status), "Response envelope status must be success, uncertain, refusal, or error.");
  assert(isPlainObject(envelope.output), "Response envelope output must be an object.");
  assert(Array.isArray(envelope.issues), "Response envelope issues must be an array.");
  assert(isPlainObject(envelope.meta), "Response envelope meta must be an object.");
  assert(typeof envelope.meta.createdAt === "string" && envelope.meta.createdAt.length > 0, "Response envelope meta.createdAt is required.");

  return true;
}

export function toUncertainResponse(message, meta = {}) {
  return createResponseEnvelope({
    status: "uncertain",
    output: {
      text: null,
      structured: null
    },
    issues: [
      {
        type: "uncertainty",
        message
      }
    ],
    meta
  });
}

export function toRefusalResponse(message, meta = {}) {
  return createResponseEnvelope({
    status: "refusal",
    output: {
      text: null,
      structured: null
    },
    issues: [
      {
        type: "refusal",
        message
      }
    ],
    meta
  });
}

export function toErrorResponse(message, meta = {}) {
  return createResponseEnvelope({
    status: "error",
    output: {
      text: null,
      structured: null
    },
    issues: [
      {
        type: "error",
        message
      }
    ],
    meta
  });
}

export function normalizeModelTextResult(raw, meta = {}) {
  if (typeof raw === "string" && raw.trim().length > 0) {
    return createResponseEnvelope({
      status: "success",
      output: {
        text: raw,
        structured: null
      },
      meta
    });
  }

  return toUncertainResponse("Model returned empty or invalid text.", meta);
}
