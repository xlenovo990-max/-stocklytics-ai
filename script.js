// ==========================================
// 1. Global Variables & Localization (i18n)
// ==========================================
let currentLang = 'en'; // Default to English for the global market
let rawAiText = "";     // Stores the original AI response for the one-click copy feature

const i18n = {
    zh: {
        copied: "已複製！",
        loading: "AI 智囊團正在精算中...",
        error: "解碼回應失敗。",
        promptIntro: "你是一位專業的電商財務長 (CFO)。請幫我評估以下商品的庫存與利潤，並給予補貨與營運建議：",
        promptOutro: "請用繁體中文回答，簡短有力，語氣要專業且對店主有實質幫助。"
    },
    en: {
        copied: "Copied!",
        loading: "AI CFO is analyzing...",
        error: "Error decoding response.",
        promptIntro: "You are a professional E-commerce Chief Financial Officer (CFO). Please evaluate the inventory and profit for the following product, and provide strategic restocking and operational advice:",
        promptOutro: "Please reply in English. Keep it concise, professional, and highly actionable for the e-commerce store owner."
    }
};

// ==========================================
// 2. On Page Load: Handle API Key with LocalStorage
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // Automatically detect the password input field for the API Key
    const apiKeyInput = document.querySelector("input[type='password']") || document.getElementById("apiKey");
    
    if (apiKeyInput) {
        // Retrieve the saved key from the browser's secure local storage
        const savedKey = localStorage.getItem("openrouter_api_key");
        if (savedKey) {
            apiKeyInput.value = savedKey;
        }

        // Listen for input changes and securely save the key locally
        apiKeyInput.addEventListener("input", (e) => {
            localStorage.setItem("openrouter_api_key", e.target.value.trim());
        });
    }
});

// ==========================================
// 3. Core Logic: Call OpenRouter AI API
// ==========================================
async function analyzeInventory() {
    const resultDiv = document.getElementById("result"); 
    
    // Get the current saved API Key
    const savedKey = localStorage.getItem("openrouter_api_key");
    if (!savedKey) {
        alert(currentLang === 'zh' ? "請先在頂部填入您的 OpenRouter API Key 喔！" : "Please enter your OpenRouter API Key first!");
        return;
    }

    // Fetch values from the HTML input fields
    const productName = document.getElementById("productName")?.value || "Unnamed Product";
    const currency = document.getElementById("currency")?.value || "USD";
    const currentStock = document.getElementById("currentStock")?.value || 0;
    const alertThreshold = document.getElementById("alertThreshold")?.value || 5;
    const cost = document.getElementById("cost")?.value || 0;
    const price = document.getElementById("price")?.value || 0;

    // Dynamically build the prompt based on the selected language
    const intro = i18n[currentLang].promptIntro;
    const outro = i18n[currentLang].promptOutro;
    
    const promptText = `${intro}
    - Product Name: ${productName}
    - Currency: ${currency}
    - Current Stock Level: ${currentStock} (Alert Threshold: ${alertThreshold})
    - Cost per Item: ${cost}
    - Expected Retail Price: ${price}
    
    ${outro}`;

    if (resultDiv) resultDiv.innerText = i18n[currentLang].loading;

    try {
        // Send secure asynchronous request to OpenRouter
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + savedKey, // Secure BYOK injection
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "deepseek/deepseek-chat",
                "messages": [
                    { "role": "user", "content": promptText }
                ]
            })
        });

        const data = await response.json();
        
        if (data.choices && data.choices[0]) {
            rawAiText = data.choices[0].message.content;
            if (resultDiv) {
                resultDiv.innerText = rawAiText;
            }
        } else {
            if (resultDiv) resultDiv.innerText = i18n[currentLang].error;
        }

    } catch (error) {
        if (resultDiv) {
            resultDiv.innerText = `Failed: ${error.message}`;
        }
    }
}

// ==========================================
// 4. Clipboard Feature: One-Click Copy
// ==========================================
function copyReport() {
    if (!rawAiText) return;

    navigator.clipboard.writeText(rawAiText).then(() => {
        const copyBtn = document.getElementById('btnCopy');
        if (copyBtn) {
            const originalText = copyBtn.innerText;
            copyBtn.innerText = i18n[currentLang].copied;
            
            setTimeout(() => {
                copyBtn.innerText = originalText;
            }, 2000);
        }
    }).catch(err => {
        console.error("Clipboard copy failed:", err);
    });
                    }
