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

    const { image } = body;
    if (!image) {
        return new Response('Missing required field: image', { status: 400 });
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
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: 'Analyze this image and identify all individual clothing items, shoes, accessories, bags, jewelry, and hats visible. For each item, provide a name, category, and brief description including color and style.',
                            },
                            {
                                type: 'image_url',
                                image_url: { url: image, detail: 'high' },
                            },
                        ],
                    },
                ],
                max_tokens: 2000,
                temperature: 0.3,
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

const SYSTEM_PROMPT = `You are Mirror's wardrobe scanner. You analyze photos of closets, clothing racks, flat lays, or individual items and identify every distinct clothing item visible.

For each item you detect, classify it into one of these categories:
- tops (shirts, blouses, t-shirts, sweaters, hoodies, tanks)
- bottoms (pants, jeans, shorts, skirts)
- shoes (sneakers, boots, heels, sandals, loafers)
- outerwear (jackets, coats, blazers, vests)
- accessories (scarves, belts, sunglasses, watches)
- bags (purses, backpacks, totes, clutches)
- jewelry (necklaces, bracelets, earrings, rings)
- hats (caps, beanies, fedoras, visors)

Respond with this exact JSON structure:
{
  "items": [
    {
      "name": "Navy Blue Crew Neck T-Shirt",
      "category": "tops",
      "notes": "Dark navy, cotton, regular fit"
    }
  ]
}

Be specific about colors, materials, and style. If you can identify the brand, include it in the name. List every distinct item you can see, even partially visible ones.`;
