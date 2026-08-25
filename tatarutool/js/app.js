/**
 * FFXIV Tataru Translator - Main Application Logic
 */

// 1. 画像アップロードのプレビュー処理
function previewImage(event) {
    const input = event.target;
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('char-image').src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// 2. ランダムなセリフをセットする処理
function setRandomQuote() {
    if (typeof tataruQuotes === 'undefined' || !tataruQuotes.length) return;
    const randomIndex = Math.floor(Math.random() * tataruQuotes.length);
    const inputElement = document.getElementById('input-text');
    inputElement.value = tataruQuotes[randomIndex];
    convertText();
}

// 3. タタル語変換のメインロジック
function convertText() {
    const inputElement = document.getElementById('input-text');
    const outputElement = document.getElementById('output-text');
    if (!inputElement || !outputElement) return;

    const inputText = inputElement.value;
    
    // 入力が空の場合はデフォルトテキストを表示
    if (!inputText.trim()) {
        outputElement.textContent = "ここに変換された文章が表示されまっす！";
        outputElement.classList.add("output-placeholder");
        return;
    }

    outputElement.classList.remove("output-placeholder");

    let convertedText = inputText;
    if (typeof tataruRules !== 'undefined') {
        tataruRules.forEach(rule => {
            convertedText = convertedText.replace(rule.pattern, rule.replacement);
        });
    }

    outputElement.textContent = convertedText;
}

// 4. クリップボードへのコピー処理
function copyToClipboard() {
    const outputElement = document.getElementById('output-text');
    const inputElement = document.getElementById('input-text');
    if (!outputElement) return;

    const outputText = outputElement.textContent;
    if (outputText === "ここに変換された文章が表示されまっす！" && (!inputElement || inputElement.value.trim() === "")) {
        return;
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(outputText).then(() => {
            showToast();
        }).catch(() => {
            fallbackCopy(outputText);
        });
    } else {
        fallbackCopy(outputText);
    }
}

function fallbackCopy(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
        showToast();
    } catch (err) {
        console.error('Copy failed', err);
    }
    document.body.removeChild(textArea);
}

// 5. トースト通知の表示
function showToast() {
    const toast = document.getElementById('copy-toast');
    if (!toast) return;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}
