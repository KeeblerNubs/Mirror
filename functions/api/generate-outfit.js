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

    const { items, occasion, mood, dressCode, profile, weather, styleLearning, ootdMode, remixMode, pinnedItemIndex, pinnedItemName } = body;
    if (!items || !occasion || !mood) {
        return new Response('Missing required fields: items, occasion, mood', { status: 400 });
    }

    const content = [];

    content.push({
        type: 'text',
        text: buildGeneratePrompt(items, occasion, mood, dressCode, profile, weather, styleLearning, { ootdMode, remixMode, pinnedItemIndex, pinnedItemName }),
    });

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
                        content: SYSTEM_PROMPT,
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

const SYSTEM_PROMPT = `You are Mirror, a confident, inclusive fashion AI with deep knowledge of color theory and styling. You help people build outfits from their actual wardrobe. Be specific, supportive, and honest. Never body-shame.

COLOR THEORY RULES you MUST follow:
- Complementary pairs work for bold looks: red+green, blue+orange, purple+yellow
- Analogous combinations (neighbors on the color wheel) create harmonious looks
- Monochromatic outfits (shades of one color) always work for elegant simplicity
- Neutrals (black, white, grey, beige, navy, khaki) pair with everything
- Warm tones (red, orange, yellow, brown) and cool tones (blue, green, purple) can clash if mixed carelessly
- Earth tones (olive, rust, tan, cream) work together naturally
- Avoid combining more than 3 bold colors unless intentionally maximalist
- Metallics (gold, silver) count as neutrals but don't mix gold and silver in formal looks
- Denim is a neutral — it goes with everything
- Pattern mixing: pair different scale patterns (small stripe + large plaid), not same-scale

Always respond with valid JSON.`;

function buildGeneratePrompt(items, occasion, mood, dressCode, profile, weather, styleLearning, modes) {
    const itemList = items.map((item, idx) => {
        let desc = 'Item ' + (idx + 1) + ' (' + item.category + ')';
        if (item.name) desc += ' — ' + item.name;
        if (item.notes) desc += ' [' + item.notes + ']';
        return desc;
    }).join('\n');

    let prompt = 'The user wants outfit suggestions for this occasion: "' + occasion + '"\n';
    prompt += 'They want to feel: "' + mood + '"\n';

    if (dressCode) {
        prompt += 'Dress code: "' + dressCode + '"\n';
    }

    prompt += '\n';

    if (weather) {
        prompt += 'Current weather: ' + weather.temp + '°F, ' + weather.desc + ', Season: ' + weather.season + '\n';
        prompt += 'IMPORTANT: Factor weather into your suggestions. ';
        if (weather.temp < 45) prompt += 'It\'s cold — layer up, suggest outerwear. ';
        else if (weather.temp < 60) prompt += 'It\'s cool — light layers or jackets recommended. ';
        else if (weather.temp > 85) prompt += 'It\'s hot — suggest breathable, lightweight items. ';
        if (weather.desc.toLowerCase().includes('rain') || weather.desc.toLowerCase().includes('drizzle'))
            prompt += 'Rain expected — suggest water-resistant outerwear if available. ';
        if (weather.desc.toLowerCase().includes('snow'))
            prompt += 'Snowy conditions — warm layers and appropriate footwear essential. ';
        prompt += '\n\n';
    }

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

    prompt += 'Apply color theory: ensure colors complement or harmonize. ';
    prompt += 'Flag if any combination would clash and explain why you avoided it.\n\n';

    if (dressCode) {
        prompt += 'The outfit MUST be appropriate for the "' + dressCode + '" dress code. ';
        prompt += 'Formal = no sneakers, no casual tees. ';
        prompt += 'Business casual = polished but no suit required. ';
        prompt += 'Streetwear = sneakers welcome, oversized fits okay. ';
        prompt += 'Athletic = performance fabrics, comfort first.\n\n';
    }

    // Handle special modes
    if (modes && modes.remixMode && modes.pinnedItemIndex) {
        prompt += '\n\nREMIX MODE: Create exactly 5 different outfit variations, and EVERY outfit MUST include Item ' + modes.pinnedItemIndex;
        if (modes.pinnedItemName) prompt += ' ("' + modes.pinnedItemName + '")';
        prompt += ' as a core piece. Show diverse styling — from casual to dressy, different color pairings, different vibes.\n';
    } else if (modes && modes.ootdMode) {
        prompt += '\n\nOOTD MODE: Create exactly 1 perfect outfit for today. Consider the weather, time of year, and aim for maximum confidence with minimal effort. This is the ONE best look.\n';
    }

    const outfitCount = (modes && modes.remixMode) ? 5 : ((modes && modes.ootdMode) ? 1 : 3);

    prompt += 'Respond with this exact JSON structure:\n';
    prompt += '{\n';
    prompt += '  "outfits": [\n';
    prompt += '    {\n';
    prompt += '      "name": "Short creative name for the look",\n';
    prompt += '      "itemIndices": [1, 3, 5],\n';
    prompt += '      "reasoning": "2-3 sentences explaining why this outfit works for the occasion, mood, colors, and weather"\n';
    prompt += '    }\n';
    prompt += '  ]\n';
    prompt += '}\n';
    prompt += 'Create exactly ' + outfitCount + ' outfit(s). ';
    prompt += 'Use the item numbers (1-based) from the list above. Be specific about why each piece works together, including color harmony.';

    if (styleLearning) {
        prompt += '\n\n' + styleLearning;
    }

    return prompt;
}
