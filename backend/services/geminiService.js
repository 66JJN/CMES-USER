import fetch from "node-fetch";

const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];

const prompt = `คุณคือเทพแคปชั่นสาย Party สไตล์ไทย Gen Z

บริบท: แอปนี้ใช้ในร้านเหล้า ผับ บาร์ — ลูกค้าส่งรูปขึ้นจอเพื่ออวด แอคสาว/หนุ่ม ชวนชนแก้ว หรือสร้างบรรยากาศปาร์ตี้

ดูรูปนี้แล้วเขียนแคปชั่นภาษาไทย โดย:
- สังเกตว่าในรูปเป็นผู้ชายหรือผู้หญิง กี่คน บรรยากาศแบบไหน
- ถ้าเป็นผู้ชาย → แคปชั่นแนวอวดหล่อ แอคสาว ชวนชนแก้ว เช่น "พี่หล่อมั้ยน้อง ชนแก้วกัน" "ใครว่างมาชนแก้วกัน"
- ถ้าเป็นผู้หญิง → แนวสวยแซ่บ มั่นใจ ชวนหนุ่ม เช่น "โต๊ะข้างๆน่ารักจัง" "สวยขนาดนี้ยังโสดอยู่นะ"
- ถ้าเป็นกลุ่มเพื่อน → แนวปาร์ตี้ ชนแก้ว สนุก เช่น "คืนนี้ไม่เมาไม่กลับ" "แก๊งนี้ไม่มีใครเบรค"
- ใช้คำ Gen Z ที่ฮิต เช่น: 67, scuba, เริส, ปัง, แม่, ตัวแม่, slay, คือดี, ถูกใจ, real, vibe, ชิลไปไหน
- สไตล์ casual ชิลๆ เหมือนคนโพสเอง ไม่เป็นทางการ
- ห้ามใส่ hashtag และ emoji เด็ดขาด
- ความยาวไม่เกิน 36 ตัวอักษร
- ตอบแค่แคปชั่นเดียวเท่านั้น ไม่ต้องอธิบายอะไรเพิ่ม ไม่ต้องใส่เครื่องหมายคำพูด`;

/**
 * Call Google Gemini API with a strict timeout limit to avoid thread blocking.
 */
async function callGeminiWithTimeout(model, apiKey, base64Data, detectedMime, timeoutMs = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: detectedMime,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 1.0,
            maxOutputTokens: 100,
            topP: 0.95,
            topK: 40,
          },
        }),
        signal: controller.signal,
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { success: true, data, model };
    }

    const status = response.status;
    const errText = await response.text();
    return { success: false, status, errText, model };
  } catch (error) {
    const isTimeout = error.name === "AbortError" || error.message?.includes("aborted");
    return {
      success: false,
      status: isTimeout ? 408 : 500,
      errText: isTimeout ? "Timeout" : error.message,
      model,
    };
  } finally {
    clearTimeout(id);
  }
}

/**
 * Generate visual party captions using Gemini API with retry logic and fallback models.
 */
export async function generatePartyCaption(apiKey, base64Data, detectedMime) {
  let lastResult = null;

  for (const model of models) {
    // Attempt with retry logic
    for (let attempt = 0; attempt < 2; attempt++) {
      lastResult = await callGeminiWithTimeout(model, apiKey, base64Data, detectedMime);
      if (lastResult.success) {
        return lastResult;
      }

      // If rate limited, wait a brief duration before retry
      if (lastResult.status === 429 && attempt === 0) {
        console.warn(`[Gemini Service] Model ${model} rate limited, retrying in 1s...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      // For other errors, skip attempts and try the fallback model immediately
      break;
    }
  }

  return lastResult || { success: false, status: 500, errText: "No response from Gemini API models" };
}
