export async function onRequestPost(context) {
    const { env, request } = context;
    const apiKey = env.OPENAI_API_KEY;

    if (!apiKey) {
        return new Response('OPENAI_API_KEY not configured. Set it as a Cloudflare Pages secret.', { status: 500 });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return new Response('Invalid JSON body', { status: 400 });
    }

    const { items, occasion, mood, profile } = body;
    if (!items || !occasion || !mood) {
        return new Response('Missing required fields: items, occasion, mood', { status: 400 });
    }

    // Build vision messages with item images
    const content = [];

    content.push({
        type: 'text',
        text: buildGeneratePrompt(items, occasion, mood, profile),
    });

    // Attach each item image (thumbnails)
    items.forEach((item) => {
        if (item.image) {
            content.push({
                type: 'image_url',
                image_url: { url: item.image, detail: 'low' },
            });
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
                    {
                        role: 'system',
                        content: 'You are Mirror, a confident, inclusive fashion AI. You help people build outfits from their actual wardrobe. Be specific, supportive, and honest. Never body-shame. Always respond with valid JSON.',
                    },
                    { role: 'user', content: content },
                ],
                max_tokens: 1500,
                temperature: 0.8,
                response_format: { type: 'json_object' },
            }),
        });

        if (!openaiRes.ok) {
            const err = await openaiRes.text();
            return new Response('OpenAI API error: ' + err, { status: 502 });
        }

        const openaiData = await openaiRes.json();
        const message = openaiData.choices?.[0]?.message?.content;

        if (!message) {
            return new Response('No response from AI', { status: 502 });
        }

        const parsed = JSON.parse(message);

        return new Response(JSON.stringify(parsed), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        return new Response('Error calling AI: ' + err.message, { status: 500 });
    }
}

function buildGeneratePrompt(items, occasion, mood, profile) {
    const itemList = items.map((item, idx) => {
        let desc = 'Item ' + (idx + 1) + ' (' + item.category + ')';
        if (item.name) desc += ' — ' + item.name;
        if (item.notes) desc += ' [' + item.notes + ']';
        return desc;
    }).join('\n');

    let prompt = 'The user wants outfit suggestions for this occasion: "' + occasion + '"\n';
    prompt += 'They want to feel: "' + mood + '"\n\n';

    if (profile) {
        prompt += 'User style profile:\n';
        if (profile.vibe) prompt += '- Vibe: ' + profile.vibe + '\n';
        if (profile.expression) prompt += '- Expression: ' + profile.expression + '\n';
        if (profile.adventure) prompt += '- Adventure level: ' + profile.adventure + '\n';
        prompt += '\n';
    }

    prompt += 'Here are the wardrobe items (images follow in order):\n' + itemList + '\n\n';
    prompt += 'Create exactly 3 complete outfit suggestions using ONLY the items shown. ';
    prompt += 'Each outfit should include at least a top and bottom (or a dress), and optionally shoes and accessories.\n\n';
    prompt += 'Respond with this exact JSON structure:\n';
    prompt += '{\n';
    prompt += '  "outfits": [\n';
    prompt += '    {\n';
    prompt += '      "name": "Short creative name for the look",\n';
    prompt += '      "itemIndices": [1, 3, 5],\n';
    prompt += '      "reasoning": "2-3 sentences explaining why this outfit works for the occasion and mood"\n';
    prompt += '    }\n';
    prompt += '  ]\n';
    prompt += '}\n';
    prompt += 'Use the item numbers (1-based) from the list above. Be specific about why each piece works together.';

    return prompt;
}
