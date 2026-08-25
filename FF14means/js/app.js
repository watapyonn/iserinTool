/**
 * FFXIV Craft & Market Profit Calculator - Main Application & UI Interactions
 */

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    applyTheme(state.settings.theme);

    // Initial default rows
    if (state.materials.length === 0) addMaterialRow('主素材', 0, 1, false);
    if (state.catalysts.length === 0) addCatalystRow('ファイア', 'クリスタル', 50, 1, false);

    renderMaterials();
    renderCatalysts();
    calculate();

    // Bind settings form values
    const taxRateInput = document.getElementById('setting-tax-rate');
    const lotSizeInput = document.getElementById('setting-lot-size');
    const lotCountInput = document.getElementById('setting-lot-count');

    if (taxRateInput) taxRateInput.value = state.settings.taxRate;
    if (lotSizeInput) lotSizeInput.value = state.settings.lotSize;
    if (lotCountInput) lotCountInput.value = state.settings.lotCount;
});

// --- Theme Management ---
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    state.settings.theme = theme;
    saveData();

    document.querySelectorAll('.theme-btn').forEach(btn => {
        if (btn.getAttribute('data-theme-name') === theme) {
            btn.classList.add('ff-button-primary');
        } else {
            btn.classList.remove('ff-button-primary');
        }
    });
}

// --- Tabs Management ---
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.ff-tab').forEach(el => el.classList.remove('ff-tab-active'));

    const activeContent = document.getElementById(`tab-content-${tabId}`);
    const activeTab = document.getElementById(`tab-btn-${tabId}`);
    if (activeContent) activeContent.classList.remove('hidden');
    if (activeTab) activeTab.classList.add('ff-tab-active');

    if (tabId === 'history') renderHistory();
    if (tabId === 'compare') updateCompareOptions();
}

// --- Settings Modal ---
function openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) modal.classList.add('hidden');
}

function saveSettings() {
    const taxRate = parseFloat(document.getElementById('setting-tax-rate').value) || 0;
    const lotSize = parseInt(document.getElementById('setting-lot-size').value) || 99;
    const lotCount = parseInt(document.getElementById('setting-lot-count').value) || 20;

    state.settings.taxRate = Math.max(0, taxRate);
    state.settings.lotSize = Math.max(1, lotSize);
    state.settings.lotCount = Math.max(1, lotCount);

    saveData();
    calculate();
    closeSettingsModal();
}

// --- Confirm Modal ---
function showConfirm(message, callback) {
    const modal = document.getElementById('confirm-modal');
    const msgEl = document.getElementById('confirm-message');
    if (modal && msgEl) {
        msgEl.innerHTML = message;
        confirmCallback = callback;
        modal.classList.remove('hidden');
    }
}

function closeConfirm(isConfirmed) {
    const modal = document.getElementById('confirm-modal');
    if (modal) modal.classList.add('hidden');
    if (isConfirmed && confirmCallback) {
        confirmCallback();
    }
    confirmCallback = null;
}

// --- Material Rows ---
function addMaterialRow(name = '', unitPrice = 0, amount = 1, isFree = false) {
    state.materials.push({ id: generateId(), name, unitPrice, amount, isFree });
    renderMaterials();
    calculate();
}

function updateMaterial(id, field, value) {
    const item = state.materials.find(m => m.id === id);
    if (item) {
        item[field] = value;
        if (field === 'isFree') {
            const input = document.querySelector(`#material-row-${id} .material-price-input`);
            if (input) {
                input.disabled = value;
                if (value) { item.unitPrice = 0; input.value = 0; }
            }
        }
        calculate();
    }
}

function removeMaterial(id) {
    state.materials = state.materials.filter(m => m.id !== id);
    renderMaterials();
    calculate();
}

function renderMaterials() {
    const container = document.getElementById('materials-container');
    if (!container) return;
    container.innerHTML = '';
    state.materials.forEach(m => {
        const isFree = m.isFree ? 'checked' : '';
        const dis = m.isFree ? 'disabled' : '';
        container.insertAdjacentHTML('beforeend', `
            <div id="material-row-${m.id}" style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 10px;" class="theme-panel" style="border-radius: 4px;">
                <div style="flex: 1 1 180px; min-width: 140px; display: flex; align-items: center; gap: 6px;">
                    <input type="text" placeholder="材料名" value="${m.name}" oninput="updateMaterial('${m.id}', 'name', this.value)" class="ff-input" style="flex-grow: 1; padding: 6px 8px; font-size: 13px;">
                    <button onclick="removeMaterial('${m.id}')" class="ff-button ff-button-danger sm-hide-btn" style="padding: 4px 8px;" title="削除"><i class="fas fa-times"></i></button>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; max-width: 380px;">
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <span class="theme-text-muted" style="font-size: 12px;">¥</span>
                        <input type="number" min="0" step="any" placeholder="単価" value="${m.unitPrice}" oninput="if(this.value<0)this.value=0; updateMaterial('${m.id}', 'unitPrice', parseFloat(this.value)||0)" ${dis} class="ff-input material-price-input" style="width: 80px; padding: 6px; font-size: 13px;">
                    </div>
                    <span class="theme-text-muted" style="font-size: 12px;">×</span>
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <input type="number" min="0" step="any" placeholder="数量" value="${m.amount}" oninput="if(this.value<0)this.value=0; updateMaterial('${m.id}', 'amount', parseFloat(this.value)||0)" class="ff-input" style="width: 60px; padding: 6px; font-size: 13px;">
                    </div>
                    <label style="display: flex; align-items: center; gap: 4px; font-size: 11px; cursor: pointer; white-space: nowrap;">
                        <input type="checkbox" ${isFree} onchange="updateMaterial('${m.id}', 'isFree', this.checked)" class="ff-checkbox">自家調達
                    </label>
                    <button onclick="removeMaterial('${m.id}')" class="ff-button ff-button-danger lg-show-btn" style="padding: 6px 10px; margin-left: auto;" title="削除"><i class="fas fa-times"></i></button>
                </div>
            </div>
        `);
    });
}

// --- Catalyst Rows ---
function addCatalystRow(attr = 'ファイア', type = 'クリスタル', unitPrice = 50, amount = 1, isFree = false) {
    state.catalysts.push({ id: generateId(), attr, type, unitPrice, amount, isFree });
    renderCatalysts();
    calculate();
}

function updateCatalyst(id, field, value) {
    const item = state.catalysts.find(c => c.id === id);
    if (item) {
        item[field] = value;
        if (field === 'isFree') {
            const input = document.querySelector(`#catalyst-row-${id} .catalyst-price-input`);
            if (input) {
                input.disabled = value;
                if (value) { item.unitPrice = 0; input.value = 0; }
            }
        }
        calculate();
    }
}

function removeCatalyst(id) {
    state.catalysts = state.catalysts.filter(c => c.id !== id);
    renderCatalysts();
    calculate();
}

function renderCatalysts() {
    const container = document.getElementById('catalysts-container');
    if (!container) return;
    container.innerHTML = '';
    state.catalysts.forEach(c => {
        const isFree = c.isFree ? 'checked' : '';
        const dis = c.isFree ? 'disabled' : '';
        const attrOpts = ATTRIBUTES.map(a => `<option value="${a}" ${c.attr===a?'selected':''}>${a}</option>`).join('');
        const typeOpts = CATALYST_TYPES.map(t => `<option value="${t}" ${c.type===t?'selected':''}>${t}</option>`).join('');
        container.insertAdjacentHTML('beforeend', `
            <div id="catalyst-row-${c.id}" style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 10px;" class="theme-panel" style="border-radius: 4px;">
                <div style="flex: 1 1 180px; min-width: 140px; display: flex; align-items: center; gap: 6px;">
                    <select onchange="updateCatalyst('${c.id}', 'attr', this.value)" class="ff-input" style="flex: 1; padding: 6px; font-size: 13px; cursor: pointer;">${attrOpts}</select>
                    <select onchange="updateCatalyst('${c.id}', 'type', this.value)" class="ff-input" style="flex: 1; padding: 6px; font-size: 13px; cursor: pointer;">${typeOpts}</select>
                    <button onclick="removeCatalyst('${c.id}')" class="ff-button ff-button-danger sm-hide-btn" style="padding: 4px 8px;" title="削除"><i class="fas fa-times"></i></button>
                </div>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; max-width: 380px;">
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <span class="theme-text-muted" style="font-size: 12px;">¥</span>
                        <input type="number" min="0" step="any" placeholder="単価" value="${c.unitPrice}" oninput="if(this.value<0)this.value=0; updateCatalyst('${c.id}', 'unitPrice', parseFloat(this.value)||0)" ${dis} class="ff-input catalyst-price-input" style="width: 80px; padding: 6px; font-size: 13px;">
                    </div>
                    <span class="theme-text-muted" style="font-size: 12px;">×</span>
                    <div style="display: flex; align-items: center; gap: 4px;">
                        <input type="number" min="0" step="any" placeholder="数量" value="${c.amount}" oninput="if(this.value<0)this.value=0; updateCatalyst('${c.id}', 'amount', parseFloat(this.value)||0)" class="ff-input" style="width: 60px; padding: 6px; font-size: 13px;">
                    </div>
                    <label style="display: flex; align-items: center; gap: 4px; font-size: 11px; cursor: pointer; white-space: nowrap;">
                        <input type="checkbox" ${isFree} onchange="updateCatalyst('${c.id}', 'isFree', this.checked)" class="ff-checkbox">自家調達
                    </label>
                    <button onclick="removeCatalyst('${c.id}')" class="ff-button ff-button-danger lg-show-btn" style="padding: 6px 10px; margin-left: auto;" title="削除"><i class="fas fa-times"></i></button>
                </div>
            </div>
        `);
    });
}

// --- History & Save Actions ---
function saveToHistory() {
    const currentData = calculate();
    const owEl = document.getElementById('overwrite-check');
    if (state.currentLoadedId && owEl && owEl.checked) {
        const index = state.history.findIndex(h => h.id === state.currentLoadedId);
        if (index !== -1) {
            currentData.id = state.currentLoadedId;
            state.history.splice(index, 1);
            state.history.unshift(currentData);
        } else {
            currentData.id = Date.now().toString();
            state.history.unshift(currentData);
            state.currentLoadedId = currentData.id;
        }
    } else {
        currentData.id = Date.now().toString();
        state.history.unshift(currentData);
        state.currentLoadedId = currentData.id;
        const owContainer = document.getElementById('overwrite-container');
        if (owContainer) owContainer.classList.remove('hidden');
        if (owEl) owEl.checked = true;
    }
    saveData();
    const btn = document.getElementById('btn-save-history');
    if (btn) {
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check mr-2"></i>保存しました！';
        setTimeout(() => btn.innerHTML = orig, 2000);
    }
}

function deleteHistory(id) {
    showConfirm('この履歴を削除しますか？', () => {
        state.history = state.history.filter(h => h.id !== id);
        if (state.currentLoadedId === id) {
            state.currentLoadedId = null;
            const owContainer = document.getElementById('overwrite-container');
            if (owContainer) owContainer.classList.add('hidden');
        }
        saveData();
        renderHistory();
    });
}

function clearHistory() {
    if (state.history.length === 0) return;
    showConfirm('全ての保存済み履歴を削除しますか？<br>この操作は元に戻せません。', () => {
        state.history = [];
        state.currentLoadedId = null;
        const owContainer = document.getElementById('overwrite-container');
        if (owContainer) owContainer.classList.add('hidden');
        saveData();
        renderHistory();
    });
}

function loadHistoryToForm(id) {
    const h = state.history.find(x => x.id === id);
    if (!h) return;
    showConfirm('現在の入力内容を上書きして、<br>この履歴データを計算シートに読み込みますか？', () => {
        const nameInput = document.getElementById('product-name');
        const priceInput = document.getElementById('selling-price');
        if (nameInput) nameInput.value = h.productName === '名称未設定' ? '' : h.productName;
        if (priceInput) priceInput.value = h.sellingPrice || '';
        state.materials = JSON.parse(JSON.stringify(h.materialsSnapshot || []));
        state.catalysts = JSON.parse(JSON.stringify(h.catalystsSnapshot || []));
        state.currentLoadedId = id;
        
        const owContainer = document.getElementById('overwrite-container');
        const owCheck = document.getElementById('overwrite-check');
        if (owContainer) owContainer.classList.remove('hidden');
        if (owCheck) owCheck.checked = true;

        renderMaterials();
        renderCatalysts();
        calculate();
        switchTab('calc');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function createNew() {
    showConfirm('計算シートの内容をリセットしますか？<br><span style="color:#f87171;">※保存していないデータは消去されます</span>', () => {
        state.currentLoadedId = null;
        const owContainer = document.getElementById('overwrite-container');
        if (owContainer) owContainer.classList.add('hidden');
        
        const nameInput = document.getElementById('product-name');
        const priceInput = document.getElementById('selling-price');
        if (nameInput) nameInput.value = '';
        if (priceInput) priceInput.value = '';

        state.materials = [];
        state.catalysts = [];
        addMaterialRow('主素材', 0, 1, false);
        renderMaterials();
        renderCatalysts();
        calculate();
    });
}

function renderHistory() {
    const container = document.getElementById('history-container');
    const emptyMsg = document.getElementById('empty-history-msg');
    if (!container) return;

    Array.from(container.children).forEach(c => {
        if (c.id !== 'empty-history-msg') container.removeChild(c);
    });

    if (state.history.length === 0) {
        if (emptyMsg) emptyMsg.classList.remove('hidden');
        return;
    } else {
        if (emptyMsg) emptyMsg.classList.add('hidden');
    }

    const fmt = { maximumFractionDigits: 0 };

    state.history.forEach(item => {
        const d = new Date(item.date).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        const pClass = item.profit1 < 0 ? 'ff-text-red' : 'ff-text-green';
        const lotSize = Math.floor(item.lotSize || 99);
        
        const rev1 = Math.floor(item.rev1 !== undefined ? item.rev1 : item.sellingPrice);
        const feeRate = item.feeRate !== undefined ? item.feeRate : ((state.settings.taxRate || 5) / 100);
        const fee1 = Math.floor(item.fee1 !== undefined ? item.fee1 : rev1 * feeRate);
        const revLot = Math.floor(rev1 * lotSize);
        const feeLot = Math.floor(revLot * feeRate);
        const costLot = Math.floor((item.cost1 || 0) * lotSize);
        const profitLot = Math.floor(item.profitLot !== undefined ? item.profitLot : (revLot - feeLot - costLot));

        container.insertAdjacentHTML('beforeend', `
            <div class="ff-window" style="padding: 16px; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; border-bottom: 1px solid var(--panel-border); padding-bottom: 8px;">
                        <h3 class="ff-text-gold" style="font-weight: 700; font-size: 1.1rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px;">${item.productName}</h3>
                        <div class="theme-text-muted" style="font-size: 11px; white-space: nowrap;">${d}</div>
                    </div>
                    
                    <div class="theme-panel-dark" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 13px; margin-bottom: 14px; padding: 12px; border-radius: 4px;">
                        <div><span class="theme-text-muted" style="font-size: 11px; display: block;">単価</span><span style="font-weight: 700; font-family: monospace;">¥${Math.floor(item.sellingPrice||0).toLocaleString('ja-JP', fmt)}</span></div>
                        <div><span class="theme-text-muted" style="font-size: 11px; display: block;">1個原価</span><span class="ff-text-red" style="font-weight: 700; font-family: monospace;">¥${Math.floor(item.cost1||0).toLocaleString('ja-JP', fmt)}</span></div>
                        <div style="grid-column: span 2; border-top: 1px solid var(--panel-border); padding-top: 6px; margin-top: 4px;">
                            <span class="theme-text-muted" style="font-size: 11px; display: block;">想定利益 (${lotSize}個分)</span>
                            <span class="${pClass}" style="font-weight: 700; font-size: 1.15rem; font-family: monospace;">
                                ¥${(profitLot||0).toLocaleString('ja-JP', fmt)} 
                                <span class="theme-text-muted" style="font-size: 12px; font-weight: normal;">(${item.profitMargin||0}%)</span>
                            </span>
                        </div>
                    </div>
                </div>

                <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: auto;">
                    <button onclick="loadHistoryToForm('${item.id}')" class="ff-button ff-button-primary" style="padding: 6px 14px; flex-grow: 1;"><i class="fas fa-file-import mr-1"></i>読込・編集</button>
                    <button onclick="deleteHistory('${item.id}')" class="ff-button ff-button-danger" style="padding: 6px 12px;"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `);
    });
}

// --- Compare View ---
function updateCompareOptions() {
    const s1 = document.getElementById('compare-select-1');
    const s2 = document.getElementById('compare-select-2');
    if (!s1 || !s2) return;

    const v1 = s1.value, v2 = s2.value;
    const options = `<option value="">-- 選択してください --</option>` + 
        state.history.map(h => {
            const d = new Date(h.date).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
            return `<option value="${h.id}">${h.productName} (${d})</option>`;
        }).join('');

    s1.innerHTML = options;
    s2.innerHTML = options;

    if (state.history.find(h => h.id === v1)) s1.value = v1;
    if (state.history.find(h => h.id === v2)) s2.value = v2;
    updateCompareView();
}

function updateCompareView() {
    const s1 = document.getElementById('compare-select-1');
    const s2 = document.getElementById('compare-select-2');
    const container = document.getElementById('compare-result-container');
    if (!s1 || !s2 || !container) return;

    const ids = [s1.value, s2.value];
    container.innerHTML = '';
    const fmt = { maximumFractionDigits: 0 };

    ids.forEach(id => {
        const item = state.history.find(h => h.id === id);
        if (!item) {
            container.insertAdjacentHTML('beforeend', `
                <div class="theme-panel-dark" style="padding: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; border: var(--panel-border-dotted); min-height: 250px;">
                    <span class="theme-text-muted" style="font-size: 14px;">データを選択してください</span>
                </div>
            `);
            return;
        }

        const pClass = item.profit1 < 0 ? 'ff-text-red' : 'ff-text-green';
        const lotSize = Math.floor(item.lotSize || 99);
        const rev1 = Math.floor(item.rev1 !== undefined ? item.rev1 : item.sellingPrice);
        const feeRate = item.feeRate !== undefined ? item.feeRate : ((state.settings.taxRate || 5) / 100);
        const fee1 = Math.floor(item.fee1 !== undefined ? item.fee1 : rev1 * feeRate);
        const revLot = Math.floor(rev1 * lotSize);
        const feeLot = Math.floor(revLot * feeRate);
        const costLot = Math.floor((item.cost1 || 0) * lotSize);
        const profitLot = Math.floor(item.profitLot !== undefined ? item.profitLot : (revLot - feeLot - costLot));

        container.insertAdjacentHTML('beforeend', `
            <div class="ff-window" style="padding: 16px; display: flex; flex-direction: column;">
                <h3 class="ff-text-gold" style="font-weight: 700; font-size: 1.15rem; margin-bottom: 12px; border-bottom: 1px solid var(--panel-border); padding-bottom: 8px; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.productName}</h3>
                
                <table style="width: 100%; text-align: left; font-size: 13px; margin-bottom: 16px; border-collapse: collapse;">
                    <thead>
                        <tr class="theme-text-muted" style="border-bottom: 1px dashed var(--panel-border);">
                            <th style="padding: 6px 0; font-weight: normal;">項目</th>
                            <th style="padding: 6px 0; font-weight: normal; text-align: right;">1個</th>
                            <th style="padding: 6px 0; font-weight: normal; text-align: right;">${lotSize}個 (1セット)</th>
                        </tr>
                    </thead>
                    <tbody style="font-family: monospace;">
                        <tr style="border-bottom: 1px solid var(--panel-border);">
                            <td style="padding: 6px 0;">売上</td>
                            <td style="padding: 6px 0; text-align: right;">¥${(rev1||0).toLocaleString('ja-JP', fmt)}</td>
                            <td style="padding: 6px 0; text-align: right;">¥${(revLot||0).toLocaleString('ja-JP', fmt)}</td>
                        </tr>
                        <tr class="theme-text-muted" style="border-bottom: 1px solid var(--panel-border);">
                            <td style="padding: 6px 0;">手数料</td>
                            <td style="padding: 6px 0; text-align: right;">-¥${(fee1||0).toLocaleString('ja-JP', fmt)}</td>
                            <td style="padding: 6px 0; text-align: right;">-¥${(feeLot||0).toLocaleString('ja-JP', fmt)}</td>
                        </tr>
                        <tr class="theme-text-muted" style="border-bottom: 1px solid var(--panel-border);">
                            <td style="padding: 6px 0;">原価</td>
                            <td style="padding: 6px 0; text-align: right;">-¥${Math.floor(item.cost1||0).toLocaleString('ja-JP', fmt)}</td>
                            <td style="padding: 6px 0; text-align: right;">-¥${(costLot||0).toLocaleString('ja-JP', fmt)}</td>
                        </tr>
                        <tr style="font-weight: 700; font-size: 15px;">
                            <td style="padding: 10px 0;">利益</td>
                            <td class="${pClass}" style="padding: 10px 0; text-align: right;">¥${Math.floor(item.profit1||0).toLocaleString('ja-JP', fmt)}</td>
                            <td class="${pClass}" style="padding: 10px 0; text-align: right;">¥${(profitLot||0).toLocaleString('ja-JP', fmt)}</td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="theme-panel-dark" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 12px; border-radius: 4px; text-align: center; margin-top: auto;">
                    <div><div class="theme-text-muted" style="font-size: 11px; margin-bottom: 4px;">利益率</div><div style="font-weight: 700; font-size: 1.2rem; font-family: monospace;">${item.profitMargin}%</div></div>
                    <div><div class="theme-text-muted" style="font-size: 11px; margin-bottom: 4px;">原価率</div><div class="ff-text-gold" style="font-weight: 700; font-size: 1.2rem; font-family: monospace;">${item.costMargin}%</div></div>
                </div>
            </div>
        `);
    });
}
