export async function onRequestPost(context) {
    const { env, request } = context;
    const apiKey = env.OPENAI_API_KEY;

    if (!apiKey) {
        return new Response('OPENAI_API_KEY not configured.', { status: 500 });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return new Response('Invalid JSON body', { status: 400 });
    }

    const { stats, profile } = body;
    if (!stats) {
        return new Response('Missing required field: stats', { status: 400 });
    }

    const prompt = buildReportPrompt(stats, profile);

    try {
        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: prompt },
                ],
                max_tokens: 1500,
                temperature: 0.7,
                response_format: { type: 'json_object' },
            }),
        });

        if (!openaiRes.ok) {
            const err = await openaiRes.text();
            return new Response('OpenAI API error: ' + err, { status: 502 });
        }

        const data = await openaiRes.json();
        const message = data.choices?.[0]?.message?.content;
        if (!message) return new Response('No response from AI', { status: 502 });

        return new Response(message, { headers: { 'Content-Type': 'application/json' } });
    } catch (err) {
        return new Response('Error: ' + err.message, { status: 500 });
    }
}

const SYSTEM_PROMPT = `You are Mirror's style analyst. You write fun, insightful monthly style reports. Be encouraging, specific, and use fashion terminology. Keep it concise but valuable. Always respond with valid JSON.`;

function buildReportPrompt(stats, profile) {
    let prompt = 'Generate a monthly style report for this user.\n\n';

    if (profile) {
        prompt += 'User profile: vibe=' + (profile.vibe || 'unknown') + ', expression=' + (profile.expression || 'unknown') + '\n\n';
    }

    prompt += 'Stats:\n';
    prompt += '- Total wardrobe items: ' + (stats.totalItems || 0) + '\n';
    prompt += '- Total saved outfits: ' + (stats.totalOutfits || 0) + '\n';
    prompt += '- Liked outfits: ' + (stats.likedOutfits || 0) + '\n';

    if (stats.categoryBreakdown) {
        prompt += '- Category breakdown: ' + JSON.stringify(stats.categoryBreakdown) + '\n';
    }
    if (stats.topItems) {
        prompt += '- Most-used items: ' + JSON.stringify(stats.topItems) + '\n';
    }
    if (stats.occasions) {
        prompt += '- Most common occasions: ' + JSON.stringify(stats.occasions) + '\n';
    }
    if (stats.moods) {
        prompt += '- Most common moods: ' + JSON.stringify(stats.moods) + '\n';
    }
    if (stats.totalSpent) {
        prompt += '- Total spent on wardrobe: $' + stats.totalSpent + '\n';
    }
    if (stats.avgCostPerWear) {
        prompt += '- Average cost-per-wear: $' + stats.avgCostPerWear + '\n';
    }

    prompt += '\nRespond with this JSON structure:\n';
    prompt += '{\n';
    prompt += '  "title": "Fun creative title for the report",\n';
    prompt += '  "stylePersonality": "1-2 sentence style personality description",\n';
    prompt += '  "topInsight": "Most interesting insight about their style",\n';
    prompt += '  "colorStory": "Analysis of their color preferences",\n';
    prompt += '  "suggestions": ["3 specific actionable suggestions"],\n';
    prompt += '  "challenge": "A fun style challenge for next month",\n';
    prompt += '  "styleScore": 85\n';
    prompt += '}\n';
    prompt += 'styleScore is 1-100 based on wardrobe diversity, outfit frequency, and experimentation.';

    return prompt;
}
