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

    const { selectedItems, otherItems, profile } = body;
    if (!selectedItems || selectedItems.length < 2) {
        return new Response('Need at least 2 selected items to critique', { status: 400 });
    }

    const content = [];

    content.push({
        type: 'text',
        text: buildCritiquePrompt(selectedItems, otherItems, profile),
    });

    // Attach selected item images
    selectedItems.forEach((item) => {
        if (item.image) {
            content.push({
                type: 'image_url',
                image_url: { url: item.image, detail: 'low' },
            });
        }
    });

    // Attach other item images (swap candidates)
    if (otherItems && otherItems.length > 0) {
        otherItems.forEach((item) => {
            if (item.image) {
                content.push({
                    type: 'image_url',
                    image_url: { url: item.image, detail: 'low' },
                });
            }
        });
    }

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
                        content: 'You are Mirror, a confident, inclusive fashion AI. You critique outfits honestly but kindly. Never body-shame. Give actionable, specific feedback. Always respond with valid JSON.',
                    },
                    { role: 'user', content: content },
                ],
                max_tokens: 1200,
                temperature: 0.7,
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

function buildCritiquePrompt(selectedItems, otherItems, profile) {
    const selectedList = selectedItems.map((item, idx) => {
        let desc = 'Selected Item ' + (idx + 1) + ' (' + item.category + ')';
        if (item.name) desc += ' — ' + item.name;
        if (item.notes) desc += ' [' + item.notes + ']';
        return desc;
    }).join('\n');

    let prompt = 'The user has put together this outfit (images follow in order, selected items first, then alternative items from their wardrobe):\n\n';
    prompt += 'SELECTED OUTFIT:\n' + selectedList + '\n\n';

    if (otherItems && otherItems.length > 0) {
        const otherList = otherItems.map((item, idx) => {
            let desc = 'Alt Item ' + (idx + 1) + ' (' + item.category + ')';
            if (item.name) desc += ' — ' + item.name;
            if (item.notes) desc += ' [' + item.notes + ']';
            return desc;
        }).join('\n');
        prompt += 'ALTERNATIVE ITEMS IN WARDROBE:\n' + otherList + '\n\n';
    }

    if (profile) {
        prompt += 'User style profile:\n';
        if (profile.vibe) prompt += '- Vibe: ' + profile.vibe + '\n';
        if (profile.expression) prompt += '- Expression: ' + profile.expression + '\n';
        if (profile.adventure) prompt += '- Adventure level: ' + profile.adventure + '\n';
        prompt += '\n';
    }

    prompt += 'Critique this outfit. Respond with this exact JSON structure:\n';
    prompt += '{\n';
    prompt += '  "positives": "2-3 sentences about what works well — colors, silhouette, vibe, coordination",\n';
    prompt += '  "negatives": "1-2 sentences of honest constructive feedback — what clashes or could be improved",\n';
    prompt += '  "suggestions": "1-2 specific swap suggestions using the alternative items from their wardrobe, explaining why the swap improves the look"\n';
    prompt += '}\n';
    prompt += 'Be specific about colors, textures, proportions. Reference actual items by their category/name.';

    return prompt;
}
