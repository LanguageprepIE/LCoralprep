// Keep the existing Lambda-compatible endpoint and the existing Gemini model.
const MAX_BODY_BYTES = 1024 * 1024; // Whole prompt, including complete mocks and review context.
const UPSTREAM_TIMEOUT_MS = 45000;
const messages = {
    invalid: 'The practice request could not be read. Please try again.',
    large: 'This practice request is too large to send. Your answer has not been sent.',
    unavailable: 'AI practice is temporarily unavailable. Your answer is still on this page. Please try again later.',
    busy: 'AI practice is busy or its usage allowance has been reached. Your answer is still on this page. Please try again later.',
    timeout: 'The AI took too long to respond. Your answer is still on this page. Please try again.',
    response: 'The AI did not return a complete response. Your answer is still on this page. Please try again.'
};
const reply = (statusCode, code, message, extraHeaders = {}) => ({
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extraHeaders },
    body: JSON.stringify({ error: { code, message } })
});

function validContents(contents) {
    return Array.isArray(contents) && contents.length > 0 && contents.length <= 64 && contents.every(content =>
        content && typeof content === 'object' && !Array.isArray(content) &&
        Object.keys(content).every(key => key === 'role' || key === 'parts') &&
        (content.role === undefined || content.role === 'user' || content.role === 'model') &&
        Array.isArray(content.parts) && content.parts.length > 0 && content.parts.length <= 64 &&
        content.parts.every(part => part && typeof part === 'object' && !Array.isArray(part) &&
            Object.keys(part).length === 1 && typeof part.text === 'string' && part.text.trim().length > 0)
    );
}

export const handler = async (event) => {
    if (event.httpMethod !== 'POST') return reply(405, 'METHOD', messages.invalid, { Allow: 'POST' });
    const contentType = Object.entries(event.headers || {}).find(([key]) => key.toLowerCase() === 'content-type')?.[1] || '';
    if (!/^application\/json(?:\s*;|\s*$)/i.test(contentType)) return reply(415, 'CONTENT_TYPE', messages.invalid);
    if (typeof event.body !== 'string' || event.isBase64Encoded) return reply(400, 'INVALID_REQUEST', messages.invalid);
    if (Buffer.byteLength(event.body, 'utf8') > MAX_BODY_BYTES) return reply(413, 'REQUEST_TOO_LARGE', messages.large);
    let body;
    try { body = JSON.parse(event.body); } catch { return reply(400, 'INVALID_REQUEST', messages.invalid); }
    if (!body || typeof body !== 'object' || Array.isArray(body) ||
        Object.keys(body).length !== 1 || !validContents(body.contents)) return reply(400, 'INVALID_REQUEST', messages.invalid);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return reply(503, 'UNAVAILABLE', messages.unavailable);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: body.contents }),
            signal: controller.signal
        });
        // Never relay provider errors, billing details, URLs or stack traces.
        if (!response.ok) {
            if (response.status === 429) return reply(429, 'BUSY', messages.busy);
            if (response.status === 401 || response.status === 403 || response.status === 402) return reply(503, 'UNAVAILABLE', messages.unavailable);
            return reply(response.status >= 500 ? 503 : 502, 'UPSTREAM_ERROR', messages.unavailable);
        }
        let data;
        try { data = await response.json(); } catch (error) {
            if (controller.signal.aborted) throw error;
            return reply(502, 'INVALID_RESPONSE', messages.response);
        }
        const candidate = data?.candidates?.[0];
        const parts = candidate?.content?.parts;
        if (!Array.isArray(data?.candidates) || data?.error || data?.promptFeedback?.blockReason ||
            (candidate?.finishReason && candidate.finishReason !== 'STOP') ||
            !Array.isArray(parts) || !parts.length ||
            parts.some(part => typeof part?.text !== 'string') || !parts.map(part => part.text).join('').trim()) {
            return reply(502, 'INVALID_RESPONSE', messages.response);
        }
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
            // Keep the caller contract; concatenate text parts without changing their text.
            body: JSON.stringify({ candidates: [{ content: { parts: [{ text: parts.map(part => part.text).join('') }] } }] })
        };
    } catch {
        return controller.signal.aborted ? reply(504, 'TIMEOUT', messages.timeout) : reply(503, 'UNAVAILABLE', messages.unavailable);
    } finally {
        clearTimeout(timer);
    }
};
