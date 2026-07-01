// ==========================================================================
// Product: Stocklytics AI (Stateless & Enterprise-Grade Security Edition)
// Core Features: Multi-language AI Switching, Zero-Trace Local Privacy, Fully i18n Optimized
// ==========================================================================

let rawAiText = ""; // Securely stores the current session's AI response for clipboard action

// Multi-language dictionary for local UI states and dynamic AI prompts
const i18n = {
    zh: {
        loading: "AI 智囊團正在精算中，請稍候...",
        error: "無法解析 AI 的回應。請檢查您的 API Key 是否有效或額度是否充足。",
        noKey: "請先填入您的 OpenRouter API Key 喔！",
        copied: "已複製報告！",
        promptIntro: "你是一位專業的電商財務長 (CFO)。請幫我評估以下商品的庫存與利潤，並給予補貨與營運建議：",
        promptOutro: "請用繁體中文回答，結構清晰（多使用列點），語氣要專業且對店主有實質幫助。"
    },
    en: {
        loading: "AI CFO is analyzing your data, please wait...",
        error: "Failed to decode AI response. Please check your API Key or account balance.",
        noKey: "Please enter your OpenRouter API Key first!",
        copied: "Report Copied!",
        promptIntro: "You are a professional E-commerce Chief Financial Officer (CFO). Please evaluate the inventory and profit for the following product, and provide strategic restocking and operational advice:",
        promptOutro: "Please reply in English. Keep it concise, professional, well-structured with bullet points, and highly actionable for the store owner."
    }
};

/**
 * Main function to securely trigger AI evaluation from OpenRouter
 */
async function analyzeInventory() {
    const resultDiv = document.getElementById("result");
    if (!resultDiv) return;

    // 1. Dynamic Language Detection (Looks for a dropdown menu, defaults to English)
    const langSelect = document.getElementById("languageSelect");
    const currentLang = langSelect ? langSelect.value : "en";

    // 2. STAGE 1 SECURITY MODE: Directly fetch from input field on-click. 
    // ZERO localStorage reads/writes. No permanent footprint left on the device (Malware-Proof).
    const apiKeyInput = document.getElementById("apiKey");
    const apiKey = apiKeyInput ? apiKeyInput.value.trim() : "";

    if (!apiKey) {
        alert(i18n[currentLang].noKey);
        return;
    }

    // 3. Dynamic DOM Data Collection
    const productName = document.getElementById("productName")?.value || "Unnamed Product";
    const currency = document.getElementById("currency")?.value || "USD";
    const currentStock = document.getElementById("currentStock")?.value || "0";
    const alertThreshold = document.getElementById("alertThreshold")?.value || "5";
    const cost = document.getElementById("cost")?.value || "0";
    const price = document.getElementById("price")?.value || "0";

    // 4. Constructing the Dynamic Bilingual Prompt Payload
    const intro = i18n[currentLang].promptIntro;
    const outro = i18n[currentLang].promptOutro;

    const promptText = `${intro}
    - Product Name: ${productName}
    - Currency: ${currency}
    - Current Stock Level: ${currentStock} (Alert Threshold: ${alertThreshold})
    - Cost per Item: ${cost}
    - Expected Retail Price: ${price}

    ${outro}`;

    // 5. Instantly transition UI into loading state
    resultDiv.innerText = i18n[currentLang].loading;

    try {
        // 6. Asynchronous secure tunnel request to OpenRouter Gateway
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`, // Just-in-time runtime authentication injection
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "deepseek/deepseek-chat", // Highly efficient model configuration
                "messages": [
                    { "role": "user", "content": promptText }
                ]
            })
        });

        const data = await response.json();

        // Error boundary handling for API-side execution failure
        if (data.error) {
            resultDiv.innerText = `API Error: ${data.error.message || "Authentication Failed"}`;
            return;
        }

        if (data.choices && data.choices[0]) {
            rawAiText = data.choices[0].message.content;
            resultDiv.innerText = rawAiText; // Render report output
        } else {
            resultDiv.innerText = i18n[currentLang].error;
        }

    } catch (error) {
        // Network layer error handling (e.g., completely offline or blocked by local firewall)
        resultDiv.innerText = `Network/System Error: ${error.message}`;
    }
}

/**
 * One-click text extraction system utilizing the web clipboard API
 */
function copyReport() {
    if (!rawAiText) return;

    const langSelect = document.getElementById("languageSelect");
    const currentLang = langSelect ? langSelect.value : "en";

    navigator.clipboard.writeText(rawAiText).then(() => {
        const copyBtn = document.getElementById("btnCopy");
        if (copyBtn) {
            const originalText = copyBtn.innerText;
            copyBtn.innerText = i18n[currentLang].copied;
            
            // Revert state back after a short visual delay
            setTimeout(() => {
                copyBtn.innerText = originalText;
            }, 2000);
        }
    }).catch(err => {
        console.error("Clipboard permission denied: ", err);
    });
            }
