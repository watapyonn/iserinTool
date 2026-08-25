/**
 * FFXIV Craft & Market Profit Calculator - Data Store & Constants
 */

const ATTRIBUTES = ['ファイア', 'アイス', 'ウィンド', 'アース', 'ライトニング', 'ウォーター'];
const CATALYST_TYPES = ['シャード', 'クリスタル', 'クラスター'];

let state = {
    settings: {
        theme: 'modern',
        taxRate: 5,
        lotSize: 99,
        lotCount: 20
    },
    materials: [],
    catalysts: [],
    history: [],
    currentLoadedId: null
};

let confirmCallback = null;

function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

function saveData() {
    try {
        localStorage.setItem('marketCalcDataFF14', JSON.stringify({
            settings: state.settings,
            history: state.history
        }));
    } catch (e) {
        console.error("Failed to save data", e);
    }
}

function loadData() {
    const saved = localStorage.getItem('marketCalcDataFF14');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.settings) state.settings = { ...state.settings, ...parsed.settings };
            if (parsed.history) state.history = parsed.history;
        } catch (e) {
            console.error("Failed to load data", e);
        }
    }
}
