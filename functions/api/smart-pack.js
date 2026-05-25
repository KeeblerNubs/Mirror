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

    const { items, destination, duration, activities, weather, profile } = body;
    if (!items || !destination || !duration) {
        return new Response('Missing required fields: items, destination, duration', { status: 400 });
    }

    const content = [];
    content.push({ type: 'text', text: buildPackingPrompt(items, destination, duration, activities, weather, profile) });

    items.forEach((item) => {
        if (item.image) {
            content.push({ type: 'image_url', image_url: { url: item.image, detail: 'low' } });
        }
    });

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
                    { role: 'user', content: content },
                ],
                max_tokens: 2000,
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

const SYSTEM_PROMPT = `You are Mirror's travel packing expert. You build capsule travel wardrobes from the user's existing closet. Focus on versatility — items that can be mixed and matched for multiple outfits. Consider weather, activities, and luggage space. Always respond with valid JSON.`;

function buildPackingPrompt(items, destination, duration, activities, weather, profile) {
    const itemList = items.map((item, idx) => {
        let desc = 'Item ' + (idx + 1) + ' (' + item.category + ')';
        if (item.name) desc += ' — ' + item.name;
        if (item.notes) desc += ' [' + item.notes + ']';
        return desc;
    }).join('\n');

    let prompt = 'Build a smart packing list for this trip:\n';
    prompt += '- Destination: ' + destination + '\n';
    prompt += '- Duration: ' + duration + ' days\n';
    if (activities) prompt += '- Activities: ' + activities + '\n';
    if (weather) prompt += '- Expected weather: ' + weather + '\n';
    if (profile) prompt += '- Style: ' + (profile.vibe || '') + ', ' + (profile.expression || '') + '\n';

    prompt += '\nAvailable wardrobe items:\n' + itemList + '\n\n';

    prompt += 'Select the minimum items needed from the wardrobe above. Each item should work in multiple outfits.\n\n';

    prompt += 'Respond with:\n{\n';
    prompt += '  "packingList": [\n';
    prompt += '    { "itemIndex": 1, "reason": "Why this item is essential for the trip" }\n';
    prompt += '  ],\n';
    prompt += '  "outfitCombos": [\n';
    prompt += '    { "name": "Day 1 — Exploring", "itemIndices": [1, 3, 5] }\n';
    prompt += '  ],\n';
    prompt += '  "missingItems": ["Items you should buy/borrow for this trip"],\n';
    prompt += '  "packingTips": ["3 packing tips specific to this destination"]\n';
    prompt += '}\n';
    prompt += 'Use item numbers (1-based) from the list. Create ' + Math.min(duration, 5) + ' outfit combos.';

    return prompt;
}
