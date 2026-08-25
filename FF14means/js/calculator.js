/**
 * FFXIV Craft & Market Profit Calculator - Calculation Core Module
 */

function calculate() {
    const sellingPriceInput = document.getElementById('selling-price');
    const sellingPriceStr = sellingPriceInput ? sellingPriceInput.value : '0';
    const sellingPrice = Math.max(0, parseFloat(sellingPriceStr) || 0);
    
    let matCost = 0, catCost = 0;
    state.materials.forEach(m => { if (!m.isFree) matCost += ((m.unitPrice || 0) * (m.amount || 0)); });
    state.catalysts.forEach(c => { if (!c.isFree) catCost += ((c.unitPrice || 0) * (c.amount || 0)); });
    const cost1 = Math.floor(matCost + catCost);
    
    const lotSize = Math.floor(state.settings.lotSize || 99);
    const lotCount = Math.floor(state.settings.lotCount || 20);
    const feeRate = (state.settings.taxRate || 0) / 100;

    const rev1 = Math.floor(sellingPrice);
    const fee1 = Math.floor(rev1 * feeRate);
    const profit1 = rev1 - fee1 - cost1;

    const revLot = Math.floor(rev1 * lotSize);
    const feeLot = Math.floor(revLot * feeRate);
    const costLot = Math.floor(cost1 * lotSize);
    const profitLot = revLot - feeLot - costLot;

    const revTotal = Math.floor(revLot * lotCount);
    const feeTotal = Math.floor(revTotal * feeRate);
    const costTotal = Math.floor(costLot * lotCount);
    const profitTotal = revTotal - feeTotal - costTotal;

    let profitMargin = '0.0', costMargin = '0.0';
    if (rev1 > 0) {
        profitMargin = ((profit1 / rev1) * 100).toFixed(1);
        costMargin = ((cost1 / rev1) * 100).toFixed(1);
    }

    const fmt = { maximumFractionDigits: 0 };
    
    // Summary UI Updates
    const setElemText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    };

    setElemText('total-material-cost', Math.floor(matCost).toLocaleString('ja-JP', fmt));
    setElemText('total-catalyst-cost', Math.floor(catCost).toLocaleString('ja-JP', fmt));
    
    setElemText('calc-rev-1', rev1.toLocaleString('ja-JP', fmt));
    setElemText('calc-rev-lot', revLot.toLocaleString('ja-JP', fmt));
    setElemText('calc-rev-total', revTotal.toLocaleString('ja-JP', fmt));

    setElemText('calc-fee-1', fee1.toLocaleString('ja-JP', fmt));
    setElemText('calc-fee-lot', feeLot.toLocaleString('ja-JP', fmt));
    setElemText('calc-fee-total', feeTotal.toLocaleString('ja-JP', fmt));

    setElemText('calc-cost-1', cost1.toLocaleString('ja-JP', fmt));
    setElemText('calc-cost-lot', costLot.toLocaleString('ja-JP', fmt));
    setElemText('calc-cost-total', costTotal.toLocaleString('ja-JP', fmt));

    setElemText('calc-profit-1', profit1.toLocaleString('ja-JP', fmt));
    setElemText('calc-profit-lot', profitLot.toLocaleString('ja-JP', fmt));
    setElemText('calc-profit-total', profitTotal.toLocaleString('ja-JP', fmt));

    let hasDeficit = false;
    [
        { el: document.getElementById('calc-profit-1'), val: profit1 },
        { el: document.getElementById('calc-profit-lot'), val: profitLot },
        { el: document.getElementById('calc-profit-total'), val: profitTotal }
    ].forEach(item => {
        if (item.el) {
            if (item.val < 0) {
                item.el.classList.remove('ff-text-green');
                item.el.classList.add('ff-text-red');
                hasDeficit = true;
            } else {
                item.el.classList.add('ff-text-green');
                item.el.classList.remove('ff-text-red');
            }
        }
    });

    const adviceEl = document.getElementById('profit-advice');
    if (adviceEl) {
        adviceEl.className = 'mt-4 p-3 border rounded text-sm text-center font-bold transition-all';
        const pm = parseFloat(profitMargin);
        if (sellingPrice === 0 && cost1 === 0) {
            adviceEl.classList.add('hidden');
        } else if (hasDeficit || pm < 0) {
            adviceEl.innerHTML = '<i class="fas fa-skull-crossbones mr-2"></i>大赤字です！素材を買って作るなら、やめておいた方がいいでしょう。';
            adviceEl.style.backgroundColor = 'rgba(127, 29, 29, 0.4)';
            adviceEl.style.borderColor = 'rgba(239, 68, 68, 0.5)';
            adviceEl.style.color = '#f87171';
            adviceEl.classList.remove('hidden');
        } else if (pm >= 80) {
            adviceEl.innerHTML = '<i class="fas fa-crown mr-2"></i>素晴らしい利益率です！ボロ儲けのチャンス、ガンガン作りましょう！';
            adviceEl.style.backgroundColor = 'rgba(113, 63, 18, 0.4)';
            adviceEl.style.borderColor = 'rgba(234, 179, 8, 0.5)';
            adviceEl.style.color = '#facc15';
            adviceEl.classList.remove('hidden');
        } else if (pm >= 40) {
            adviceEl.innerHTML = '<i class="fas fa-thumbs-up mr-2"></i>十分な利益が見込めます。安定した金策として優秀です。';
            adviceEl.style.backgroundColor = 'rgba(20, 83, 45, 0.4)';
            adviceEl.style.borderColor = 'rgba(34, 197, 94, 0.5)';
            adviceEl.style.color = '#4ade80';
            adviceEl.classList.remove('hidden');
        } else if (pm >= 15) {
            adviceEl.innerHTML = '<i class="fas fa-info-circle mr-2"></i>利益は出ますが薄利です。大量生産して数で稼ぐ必要があります。';
            adviceEl.style.backgroundColor = 'rgba(30, 58, 138, 0.4)';
            adviceEl.style.borderColor = 'rgba(59, 130, 246, 0.5)';
            adviceEl.style.color = '#60a5fa';
            adviceEl.classList.remove('hidden');
        } else {
            adviceEl.innerHTML = '<i class="fas fa-exclamation-triangle mr-2"></i>利益がごく僅かです。相場変動で簡単に赤字になるリスクがあります。';
            adviceEl.style.backgroundColor = 'rgba(31, 41, 55, 0.8)';
            adviceEl.style.borderColor = '#6b7280';
            adviceEl.style.color = '#9ca3af';
            adviceEl.classList.remove('hidden');
        }
    }

    setElemText('summary-profit-margin', profitMargin);
    setElemText('summary-cost-margin', costMargin);

    const productNameInput = document.getElementById('product-name');
    return {
        date: new Date().toISOString(),
        productName: (productNameInput && productNameInput.value.trim()) || '名称未設定',
        sellingPrice, cost1, profit1, profitLot, profitTotal, profitMargin, costMargin,
        lotSize, lotCount, feeRate, rev1, fee1, revTotal, feeTotal, costTotal,
        materialsSnapshot: JSON.parse(JSON.stringify(state.materials)),
        catalystsSnapshot: JSON.parse(JSON.stringify(state.catalysts))
    };
}
