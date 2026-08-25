let currentIconIndex = 0;

// ページネーション設定
const itemsPerPage = 10; // 1ページあたりの表示数
let currentPage = 1;
const totalPages = Math.ceil(voiceLines.length / itemsPerPage);

const listContainer = document.getElementById('voice-list-container');
const paginationContainer = document.getElementById('pagination-container');
const scrollArea = document.getElementById('scroll-area');

const portraitContainer = document.getElementById('portrait-container');
const portraitImg = document.getElementById('portrait-img');
const portraitSvg = document.getElementById('portrait-svg');
const statusText = document.getElementById('status-text');

// --- アイコン切り替えロジック ---
function cycleIcon() {
    currentIconIndex = (currentIconIndex + 1) % iconImages.length;
    updateIconDisplay();
}

function updateIconDisplay() {
    const currentSrc = iconImages[currentIconIndex];
    if (currentSrc && currentSrc.trim() !== "") {
        portraitImg.src = currentSrc;
        portraitImg.style.display = 'block';
        portraitSvg.style.display = 'none';
    } else {
        portraitImg.style.display = 'none';
        portraitSvg.style.display = 'block';
    }
}

// --- 音声再生・合成の設定 ---
const synth = window.speechSynthesis;
let jpVoice = null;
let activeBtnId = null;
let currentAudio = null;

const loadVoices = () => {
    const voices = synth.getVoices();
    jpVoice = voices.find(voice => voice.lang.includes('ja') || voice.lang.includes('JP'));
};
synth.onvoiceschanged = loadVoices;
loadVoices();

// すべての再生を停止
function stopAllAudio() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.onended = null;
        currentAudio.onerror = null;
        currentAudio = null;
    }
    synth.cancel();
    resetUI();
}

// --- 画面描画ロジック ---

// ボイスリストの描画
function renderVoiceList() {
    listContainer.innerHTML = '';
    
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const currentItems = voiceLines.slice(startIdx, endIdx);

    currentItems.forEach((line) => {
        const btn = document.createElement('button');
        btn.id = `btn-${line.id}`;
        btn.className = 'voice-btn w-full p-2 sm:p-3 rounded flex items-center gap-2 sm:gap-3 text-left group';
        
        // ナンバリングを追加
        const displayNum = String(line.id).padStart(3, '0');
        
        btn.innerHTML = `
            <div class="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-700 border border-gray-500 flex items-center justify-center group-hover:border-yellow-500 transition-colors relative overflow-hidden">
                <span class="play-icon text-gray-300 group-hover:text-yellow-300 text-xs sm:text-sm z-10 transition-colors">▶</span>
            </div>
            <div class="flex flex-col overflow-hidden w-full">
                <span class="text-xs text-gray-400">NO.${displayNum}</span>
                <span class="truncate text-sm sm:text-base tracking-wide">${line.label}</span>
            </div>
        `;
        
        btn.addEventListener('click', () => playVoice(line, btn.id));
        listContainer.appendChild(btn);
    });
    
    // リスト更新時にスクロールを上に戻す
    scrollArea.scrollTop = 0;
}

// ページネーションボタンの描画
function renderPagination() {
    paginationContainer.innerHTML = '';

    // 前へボタン
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn px-2 py-1 sm:px-3 sm:py-2 rounded font-bold text-xs sm:text-sm';
    prevBtn.innerText = '◀';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateView();
        }
    });
    paginationContainer.appendChild(prevBtn);

    // スマートなページ番号表示
    let pageRange = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pageRange.push(i);
    } else {
        if (currentPage <= 4) {
            pageRange = [1, 2, 3, 4, 5, '...', totalPages];
        } else if (currentPage >= totalPages - 3) {
            pageRange = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        } else {
            pageRange = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
        }
    }

    pageRange.forEach(page => {
        const pageBtn = document.createElement('button');
        
        if (page === '...') {
            pageBtn.className = 'px-1 sm:px-2 py-1 sm:py-2 text-gray-500 cursor-default text-xs sm:text-sm';
            pageBtn.innerText = '...';
            pageBtn.disabled = true;
        } else {
            pageBtn.className = `page-btn px-2 py-1 sm:px-3 sm:py-2 rounded font-bold text-xs sm:text-sm ${currentPage === page ? 'active' : ''}`;
            pageBtn.innerText = page;
            pageBtn.addEventListener('click', () => {
                currentPage = page;
                updateView();
            });
        }
        paginationContainer.appendChild(pageBtn);
    });

    // 次へボタン
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn px-2 py-1 sm:px-3 sm:py-2 rounded font-bold text-xs sm:text-sm';
    nextBtn.innerText = '▶';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            updateView();
        }
    });
    paginationContainer.appendChild(nextBtn);
}

// 画面の更新
function updateView() {
    renderVoiceList();
    renderPagination();
    stopAllAudio();
}

// --- 音声再生メインロジック（MP3優先 + 合成音声自動フォールバック） ---
function playVoice(line, btnId) {
    stopAllAudio();

    if (line.audio && line.audio.trim() !== "") {
        const audio = new Audio(line.audio);
        currentAudio = audio;
        
        activeBtnId = btnId;
        const currentBtn = document.getElementById(btnId);

        let hasFallbackExecuted = false;

        const triggerFallback = () => {
            if (!hasFallbackExecuted) {
                hasFallbackExecuted = true;
                currentAudio = null;
                playSpeechSynthesis(line, btnId);
            }
        };

        audio.onplay = () => {
            portraitContainer.classList.add('talking-indicator');
            statusText.innerHTML = `<span class="text-cyan-300 font-bold whitespace-nowrap">▶ PLAYING: ${line.text}</span>`;
            if (currentBtn) {
                currentBtn.classList.add('playing');
                const icon = currentBtn.querySelector('.play-icon');
                if (icon) {
                    icon.innerText = '♪';
                    icon.classList.remove('text-gray-300', 'group-hover:text-yellow-300');
                }
            }
        };

        audio.onended = () => {
            currentAudio = null;
            resetUI();
        };

        audio.onerror = () => {
            // ファイルが存在しない（404等）場合、合成音声へフォールバック
            triggerFallback();
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                // 自動再生ポリシーブロックまたはロード失敗時
                triggerFallback();
            });
        }
    } else {
        // 音声パス未設定の場合は直接合成音声で再生
        playSpeechSynthesis(line, btnId);
    }
}

// --- 合成音声再生（フォールバック用） ---
function playSpeechSynthesis(line, btnId) {
    const utterance = new SpeechSynthesisUtterance(line.text);
    
    if (jpVoice) utterance.voice = jpVoice;
    utterance.pitch = 0.4;
    utterance.rate = 1.1;
    utterance.volume = 1.0;

    activeBtnId = btnId;
    const currentBtn = document.getElementById(btnId);

    utterance.onstart = () => {
        portraitContainer.classList.add('talking-indicator');
        statusText.innerHTML = `<span class="text-cyan-300 font-bold whitespace-nowrap">▶ TALKING (TTS): ${line.text}</span>`;
        
        if (currentBtn) {
            currentBtn.classList.add('playing');
            const icon = currentBtn.querySelector('.play-icon');
            if (icon) {
                icon.innerText = '♪';
                icon.classList.remove('text-gray-300', 'group-hover:text-yellow-300');
            }
        }
    };

    utterance.onend = () => {
        resetUI();
    };

    utterance.onerror = () => {
        resetUI();
        statusText.innerText = "▶ ERROR...";
    };

    synth.speak(utterance);
}

function resetUI() {
    portraitContainer.classList.remove('talking-indicator');
    statusText.innerHTML = "▶ SELECT VOICE";
    statusText.className = "text-base text-yellow-300 transition-all";
    
    if (activeBtnId) {
        const btn = document.getElementById(activeBtnId);
        if (btn) {
            btn.classList.remove('playing');
            const icon = btn.querySelector('.play-icon');
            if (icon) {
                icon.innerText = '▶';
                icon.classList.add('text-gray-300', 'group-hover:text-yellow-300');
            }
        }
        activeBtnId = null;
    }
}

// DOM読み込み完了時の初期化
document.addEventListener('DOMContentLoaded', () => {
    updateIconDisplay();
    updateView();
});
