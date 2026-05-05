/*
  Search Mode frontend adapter example for the existing J.B.A.I client.

  Intended hook points in the current app:
  - settings toggle creation near script.js:901
  - transport selection near script.js:1568
  - generation lifecycle near script.js:1753
*/

export const SEARCH_PHASE_LABELS = {
    query_planning: "Optimizing search...",
    searching: "Searching the web...",
    reading: "Reading sources...",
    ranking: "Ranking evidence...",
    synthesizing: "Analyzing data...",
};

export async function streamWebSearchMode({
    apiBaseUrl,
    payload,
    signal,
    onStatus = () => {},
    onQueryPlan = () => {},
    onSources = () => {},
    onDelta = () => {},
    onComplete = () => {},
    onError = () => {},
}) {
    const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/v1/web-search/stream`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
        },
        body: JSON.stringify(payload),
        signal,
    });

    if (!response.ok || !response.body) {
        const message = await response.text().catch(() => "");
        throw new Error(message || `Search mode request failed with ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let boundaryIndex = buffer.indexOf("\n\n");

        while (boundaryIndex !== -1) {
            const chunk = buffer.slice(0, boundaryIndex);
            buffer = buffer.slice(boundaryIndex + 2);
            boundaryIndex = buffer.indexOf("\n\n");

            const event = parseSseChunk(chunk);
            if (!event) continue;

            switch (event.type) {
                case "status":
                    onStatus({
                        ...event.data,
                        label: SEARCH_PHASE_LABELS[event.data.phase] || event.data.message,
                    });
                    break;
                case "query_plan":
                    onQueryPlan(event.data);
                    break;
                case "sources":
                    onSources(event.data);
                    break;
                case "answer_delta":
                    onDelta(event.data.delta || "");
                    break;
                case "complete":
                    onComplete(event.data);
                    break;
                case "error":
                    onError(event.data);
                    break;
                default:
                    break;
            }
        }
    }
}

function parseSseChunk(chunk) {
    const lines = chunk.split("\n");
    let type = "message";
    let data = "";

    for (const line of lines) {
        if (line.startsWith("event:")) {
            type = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
            data += line.slice(5).trim();
        }
    }

    if (!data) return null;

    try {
        return { type, data: JSON.parse(data) };
    } catch {
        return { type, data };
    }
}
