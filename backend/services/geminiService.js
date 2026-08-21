import fetch from "node-fetch";

export const DEFAULT_GEMINI_MODELS = Object.freeze([
  "gemini-3.5-flash-lite",
  "gemini-2.5-flash-lite",
]);

const DEFAULT_TIMEOUT_MS = 15000;

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
async function callGeminiWithTimeout(
  model,
  apiKey,
  base64Data,
  detectedMime,
  { timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl = fetch } = {}
) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
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
            maxOutputTokens: 100,
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

function shouldStopFallback(status) {
  return [400, 401, 403, 413, 422].includes(status);
}

function failurePriority(status) {
  if ([401, 403].includes(status)) return 100;
  if (status === 429) return 90;
  if ([400, 413, 422].includes(status)) return 85;
  if (status === 408) return 80;
  if (status >= 500) return 70;
  if (status === 404) return 20;
  return 50;
}

function selectMostActionableFailure(failures) {
  return failures.reduce((selected, current) => {
    if (!selected || failurePriority(current.status) > failurePriority(selected.status)) {
      return current;
    }
    return selected;
  }, null);
}

/**
 * Generate visual party captions using Gemini API with retry logic and fallback models.
 */
export async function generatePartyCaption(
  apiKey,
  base64Data,
  detectedMime,
  {
    models = DEFAULT_GEMINI_MODELS,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    fetchImpl = fetch,
  } = {}
) {
  const failures = [];

  for (const model of models) {
    const result = await callGeminiWithTimeout(model, apiKey, base64Data, detectedMime, {
      timeoutMs,
      fetchImpl,
    });

    if (result.success) {
      return result;
    }

    failures.push(result);
    if (shouldStopFallback(result.status)) {
      break;
    }
  }

  const selectedFailure = selectMostActionableFailure(failures) || {
    success: false,
    status: 500,
    errText: "No response from Gemini API models",
    model: models[0] || "unknown",
  };

  return { ...selectedFailure, failures };
}
