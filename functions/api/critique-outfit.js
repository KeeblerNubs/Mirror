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

    selectedItems.forEach((item) => {
        if (item.image) {
            content.push({
                type: 'image_url',
                image_url: { url: item.image, detail: 'low' },
            });
        }
    });

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
                        content: SYSTEM_PROMPT,
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

const SYSTEM_PROMPT = `You are Mirror, a confident, inclusive fashion AI with expert knowledge of color theory and styling. You critique outfits honestly but kindly. Never body-shame. Give actionable, specific feedback.

COLOR THEORY RULES to apply in your critique:
- Complementary colors (opposite on color wheel) create vibrant contrast: red+green, blue+orange, purple+yellow
- Analogous colors (adjacent on wheel) create harmony: blue+teal+green
- Monochromatic (shades of one hue) always reads as intentional and polished
- Neutrals (black, white, grey, beige, navy, khaki) are universal — they never clash
- Warm tones (red, orange, yellow, brown, rust) and cool tones (blue, green, purple, teal) can fight if combined without a neutral anchor
- Earth tones (olive, rust, tan, cream, forest green) harmonize naturally
- More than 3 bold colors = visual noise unless the person's vibe is intentionally maximalist
- Metallics (gold/silver) function as neutrals but mixing gold and silver reads messy in formal settings
- Denim counts as a neutral — it bridges almost any color
- Pattern clashes: two patterns of similar scale compete; mix large+small scale for sophistication

When critiquing, specifically mention color relationships (e.g., "the navy and rust create a warm complementary pair").

Always respond with valid JSON.`;

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

    prompt += 'Critique this outfit with special attention to COLOR HARMONY. Respond with this exact JSON structure:\n';
    prompt += '{\n';
    prompt += '  "positives": "2-3 sentences about what works well — mention specific color relationships, silhouette harmony, vibe alignment",\n';
    prompt += '  "negatives": "1-2 sentences of honest constructive feedback — call out any color clashes, proportion issues, or pieces that don\'t serve the look",\n';
    prompt += '  "suggestions": "1-2 specific swap suggestions using the alternative items from their wardrobe, explaining the color/style improvement each swap brings"\n';
    prompt += '}\n';
    prompt += 'Be specific about colors, textures, proportions, and color theory principles. Reference actual items by their category/name.';

    return prompt;
}
