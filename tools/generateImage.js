import OpenAI from "openai";
import { config } from "../src/config.js";

const openai = new OpenAI({ apiKey: config.openai.apiKey });

export async function generateImage(args) {
  const { prompt, style = "realistic" } = args;

  const styleModifiers = {
    realistic: "photorealistic, professional photography, high quality, 4K",
    illustrative: "digital illustration, modern flat design, vibrant colors",
    minimalist: "minimalist, clean design, simple shapes, white background",
  };

  const enhancedPrompt = `${prompt}. Style: ${styleModifiers[style]}. 
No text, no watermarks. Suitable for a professional blog featured image.`;

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: enhancedPrompt,
    n: 1,
    size: "1792x1024",  // Blog banner için ideal boyut (16:9)
    quality: "hd",
    style: style === "realistic" ? "natural" : "vivid",
  });

  const imageUrl = response.data[0].url;
  const revisedPrompt = response.data[0].revised_prompt;

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            success: true,
            image_url: imageUrl,
            revised_prompt: revisedPrompt,
            dimensions: "1792x1024",
            message: `✅ Görsel oluşturuldu! URL 1 saat geçerlidir. WordPress'e yüklemek için publish_to_wordpress aracında featured_image_url olarak kullanın.`,
            note: "DALL-E URL'leri geçici. Production'da görseli kendi sunucunuza indirip yüklemeniz önerilir.",
          },
          null,
          2
        ),
      },
    ],
  };
}
