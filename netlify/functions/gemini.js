// Keep the existing Lambda-compatible endpoint and the existing Gemini model.
const MAX_BODY_BYTES = 1024 * 1024; // Whole prompt, including complete mocks and review context.
const UPSTREAM_TIMEOUT_MS = 45000;
// Netlify's CONTEXT is documented as a *build* variable, not a reliable
// function-runtime switch. Require BOTH the preview-scoped secret and a
// preview deployment hostname. Never switch the custom production domain.
const previewHost = (headers = {}) => {
    const host = Object.entries(headers).find(([key]) => key.toLowerCase() === 'host')?.[1] || '';
    return /^(?:deploy-preview-[0-9]+|[a-f0-9]{24})--lcorals\.netlify\.app$/i.test(host);
};
const MAX_OPENAI_PROMPT_CHARS = 180000;
const MAX_OPENAI_OUTPUT_TOKENS = 3000;
// Operational diagnostics only: never log prompts, replies, provider bodies or keys.
const diagnostic = (reason) => console.warn(`[lcorals:gemini] ${reason}`);
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

    if (previewHost(event.headers)) {
        if (!process.env.OPENAI_API_KEY) return reply(503, 'UNAVAILABLE', messages.unavailable);
        return requestOpenAI(body.contents);
    }

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
            diagnostic(`upstream_http_${[400,401,402,403,429].includes(response.status) ? response.status : response.status >= 500 ? '5xx' : 'other'}`);
            if (response.status === 429) return reply(429, 'BUSY', messages.busy);
            if (response.status === 401 || response.status === 403 || response.status === 402) return reply(503, 'UNAVAILABLE', messages.unavailable);
            return reply(response.status >= 500 ? 503 : 502, 'UPSTREAM_ERROR', messages.unavailable);
        }
        let data;
        try { data = await response.json(); } catch (error) {
            if (controller.signal.aborted) throw error;
            diagnostic('upstream_json_parse');
            return reply(502, 'INVALID_RESPONSE', messages.response);
        }
        const candidate = data?.candidates?.[0];
        const parts = candidate?.content?.parts;
        if (!Array.isArray(data?.candidates) || data?.error || data?.promptFeedback?.blockReason ||
            (candidate?.finishReason && candidate.finishReason !== 'STOP') ||
            !Array.isArray(parts) || !parts.length ||
            parts.some(part => typeof part?.text !== 'string') || !parts.map(part => part.text).join('').trim()) {
            const reason = data?.promptFeedback?.blockReason ? 'prompt_blocked'
                : candidate?.finishReason && candidate.finishReason !== 'STOP' ?
                    (['MAX_TOKENS','SAFETY','RECITATION','OTHER'].includes(candidate.finishReason) ? `finish_${candidate.finishReason.toLowerCase()}` : 'finish_unexpected')
                : 'upstream_shape';
            diagnostic(reason);
            return reply(502, 'INVALID_RESPONSE', messages.response);
        }
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
            // Keep the caller contract; concatenate text parts without changing their text.
            body: JSON.stringify({ candidates: [{ content: { parts: [{ text: parts.map(part => part.text).join('') }] } }] })
        };
    } catch {
        diagnostic(controller.signal.aborted ? 'upstream_timeout' : 'upstream_network');
        return controller.signal.aborted ? reply(504, 'TIMEOUT', messages.timeout) : reply(503, 'UNAVAILABLE', messages.unavailable);
    } finally {
        clearTimeout(timer);
    }
};

async function requestOpenAI(contents) {
    // The current frontend sends text-only Gemini-shaped prompts. Preserve its
    // response contract while changing only the upstream provider on previews.
    const prompt = contents.flatMap(c => c.parts.map(p => p.text)).join('\n');
    if (prompt.length > MAX_OPENAI_PROMPT_CHARS) return reply(413, 'REQUEST_TOO_LARGE', messages.large);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    try {
        const response = await fetch('https://api.openai.com/v1/responses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
            body: JSON.stringify({ model: 'gpt-6-luna', input: prompt,
                max_output_tokens: MAX_OPENAI_OUTPUT_TOKENS,
                reasoning: { effort: 'low' }, store: false }),
            signal: controller.signal
        });
        if (!response.ok) {
            diagnostic(`openai_http_${response.status === 429 ? '429' : [401,402,403].includes(response.status) ? 'auth' : response.status >= 500 ? '5xx' : 'other'}`);
            if (response.status === 429) return reply(429, 'BUSY', messages.busy);
            if ([401,402,403].includes(response.status)) return reply(503, 'UNAVAILABLE', messages.unavailable);
            return reply(response.status >= 500 ? 503 : 502, 'UPSTREAM_ERROR', messages.unavailable);
        }
        let data;
        try { data = await response.json(); } catch { return reply(502, 'INVALID_RESPONSE', messages.response); }
        // Do not return partial JSON or feedback when token limits are reached.
        const output = data?.output;
        const texts = Array.isArray(output) ? output.flatMap(item =>
            item?.type === 'message' && Array.isArray(item.content) ?
                item.content.filter(part => part?.type === 'output_text' && typeof part.text === 'string').map(part => part.text) : []) : [];
        if (data?.status !== 'completed' || !texts.length || !texts.join('').trim()) {
            diagnostic('openai_incomplete');
            return reply(502, 'INVALID_RESPONSE', messages.response);
        }
        return { statusCode: 200,
            headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-LCorals-Provider': 'openai-luna' },
            body: JSON.stringify({ candidates: [{ content: { parts: [{ text: texts.join('') }] } }] }) };
    } catch {
        diagnostic(controller.signal.aborted ? 'openai_timeout' : 'openai_network');
        return controller.signal.aborted ? reply(504, 'TIMEOUT', messages.timeout) : reply(503, 'UNAVAILABLE', messages.unavailable);
    } finally { clearTimeout(timer); }
}
