export interface Env {
  ANTHROPIC_API_KEY: string;
  APP_SHARED_SECRET: string;
}

const SYSTEM_PROMPT = `Você é um nutricionista estimando calorias a partir de uma foto de comida.
Responda ESTRITAMENTE em JSON, sem nenhum texto antes ou depois, exatamente neste formato:
{"prato":"nome do prato em português","calorias_estimadas":number,"proteina_g":number,"carboidrato_g":number,"gordura_g":number,"confianca":"baixa"|"media"|"alta","observacao":"nota curta sobre a estimativa"}
Se a imagem não mostrar comida claramente, defina "prato" como "Não identificado" e "confianca" como "baixa".`;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'method_not_allowed' }, 405);
    }

    const secret = request.headers.get('x-app-secret');
    if (!env.APP_SHARED_SECRET || secret !== env.APP_SHARED_SECRET) {
      return jsonResponse({ error: 'unauthorized' }, 401);
    }

    let body: { imageBase64?: string; mediaType?: string };
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ error: 'invalid_json' }, 400);
    }

    if (!body.imageBase64) {
      return jsonResponse({ error: 'missing_image' }, 400);
    }

    const mediaType = body.mediaType || 'image/jpeg';

    let anthropicRes: Response;
    try {
      anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          temperature: 0.2,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'image', source: { type: 'base64', media_type: mediaType, data: body.imageBase64 } },
                { type: 'text', text: 'Analise esta foto de comida e estime as calorias.' },
              ],
            },
          ],
        }),
      });
    } catch (err: any) {
      return jsonResponse({ error: 'anthropic_unreachable', detail: String(err?.message ?? err) }, 502);
    }

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      return jsonResponse({ error: 'anthropic_error', detail: errText }, 502);
    }

    const data: any = await anthropicRes.json();
    const text: string = data?.content?.[0]?.text ?? '';

    try {
      const match = text.match(/\{[\s\S]*\}/);
      const parsed = JSON.parse(match ? match[0] : text);
      return jsonResponse(parsed);
    } catch {
      return jsonResponse({ error: 'parse_error', raw: text }, 502);
    }
  },
};
