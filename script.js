// ==========================================
// 1. 全局變數與多國語言設定 (i18n)
// ==========================================
let currentLang = 'zh'; // 預設為中文
let rawAiText = "";     // 用來儲存 AI 回傳的原始文字，供一鍵複製功能使用

const i18n = {
    zh: {
        copied: "已複製！",
        loading: "AI 智囊團正在精算中...",
        error: "解碼回應失敗。"
    },
    en: {
        copied: "Copied!",
        loading: "AI is calculating...",
        error: "Error decoding response."
    }
};

// ==========================================
// 2. 頁面載入時：自動從瀏覽器拿取並記住 API Key
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // 🔍 自動抓取你畫面上第一個密碼輸入框（API Key 欄位）
    const apiKeyInput = document.querySelector("input[type='password']") || document.getElementById("apiKey");
    
    if (apiKeyInput) {
        // 從瀏覽器的 localStorage 保險箱拿取之前存過的 Key
        const savedKey = localStorage.getItem("openrouter_api_key");
        if (savedKey) {
            apiKeyInput.value = savedKey;
        }

        // 監聽輸入：只要老闆一打字或貼上 Key，立刻悄悄幫他存進瀏覽器
        apiKeyInput.addEventListener("input", (e) => {
            localStorage.setItem("openrouter_api_key", e.target.value.trim());
        });
    }
});

// ==========================================
// 3. 核心功能：呼叫 OpenRouter AI API
// ==========================================
async function analyzeInventory() {
    const resultDiv = document.getElementById("result"); // 假設你顯示 AI 結果的容器 ID 是 result
    
    // 取得當前的 API Key
    const savedKey = localStorage.getItem("openrouter_api_key");
    if (!savedKey) {
        alert(currentLang === 'zh' ? "請先在頂部填入您的 OpenRouter API Key 喔！" : "Please enter your OpenRouter API Key first!");
        return;
    }

    // ─── 這裡抓取你網頁表單上的所有欄位數值 ───
    // (請確保你 index.html 裡的 input ID 與下面對得口)
    const productName = document.getElementById("productName")?.value || "未命名商品";
    const currency = document.getElementById("currency")?.value || "HKD";
    const currentStock = document.getElementById("currentStock")?.value || 0;
    const alertThreshold = document.getElementById("alertThreshold")?.value || 5;
    const cost = document.getElementById("cost")?.value || 0;
    const price = document.getElementById("price")?.value || 0;

    // 建立發送給 AI 的指令 (Prompt)
    const promptText = `你是一位專業的電商財務長 (CFO)。請幫我評估以下商品的庫存與利潤，並給予補貨與營運建議：
    - 商品名稱: ${productName}
    - 貨幣單位: ${currency}
    - 目前庫存量: ${currentStock} (警戒值: ${alertThreshold})
    - 單件商品成本: ${cost}
    - 單件預計售價: ${price}
    
    請用繁體中文回答，簡短有力，語氣要專業且對店主有實質幫助。`;

    if (resultDiv) resultDiv.innerText = i18n[currentLang].loading;

    try {
        // 🚀 發送安全的非同步請求
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                // 🔐 關鍵安全修正：動態帶入剛剛讀取到的 Key，絕不外洩
                "Authorization": "Bearer " + savedKey, 
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
// 4. 📋 一鍵複製功能 (完整保留你的排版邏輯)
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
        console.error("複製失敗:", err);
    });
}