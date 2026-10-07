const GENESIS = 'AEGIS-DEMO-GENESIS';
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function material(row, previousHash) {
  return JSON.stringify({
    eventId: row.id,
    time: row.time,
    agent: row.agent,
    action: row.action,
    trust: row.trust,
    blast: row.blast,
    decision: row.decision,
    reviewer: row.reviewer || '—',
    previousHash
  });
}

async function digest(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map(n => n.toString(16).padStart(2, '0')).join('');
}

export async function ensureReceiptChain(rows) {
  try {
    if (!crypto?.subtle) return 'UNAVAILABLE';
    let previous = GENESIS;
    let changed = false;
    for (const row of [...rows].reverse()) {
      if (row.receiptHash) {
        const expected = await digest(material(row, previous));
        if (row.previousHash !== previous || row.receiptHash !== expected) return 'TAMPERED';
      } else {
        row.previousHash = previous;
        row.receiptHash = await digest(material(row, previous));
        changed = true;
      }
      previous = row.receiptHash;
    }
    return changed ? 'SEALED' : 'VERIFIED';
  } catch {
    return 'UNAVAILABLE';
  }
}

export async function verifyReceiptChain(rows) {
  try {
    if (!crypto?.subtle) return 'UNAVAILABLE';
    let previous = GENESIS;
    for (const row of [...rows].reverse()) {
      if (!row.receiptHash || row.previousHash !== previous) return 'TAMPERED';
      if (await digest(material(row, previous)) !== row.receiptHash) return 'TAMPERED';
      previous = row.receiptHash;
    }
    return 'VERIFIED';
  } catch {
    return 'UNAVAILABLE';
  }
}

export function renderReceiptLedger(rows, status, expanded) {
  const recent = rows.slice(0, 4).reverse();
  const label = status === 'VERIFIED' ? 'CHAIN VERIFIED' : status === 'TAMPERED' ? 'INTEGRITY MISMATCH' : status === 'UNAVAILABLE' ? 'CRYPTO UNAVAILABLE' : status === 'SEALED' ? 'RECEIPTS SEALED' : 'VERIFYING RECEIPTS';
  const detail = status === 'VERIFIED' ? `All ${rows.length} receipts match their previous-hash link.` : status === 'TAMPERED' ? 'A receipt or predecessor link no longer matches.' : status === 'UNAVAILABLE' ? 'Web Crypto is unavailable in this browser.' : 'Hashing records locally in this browser.';
  return `<section class="panel receipt-ledger"><div class="receipt-head"><div><span class="eyebrow">WEB3-INSPIRED PROVENANCE</span><h2>Decision receipt chain</h2><p>Local SHA-256 links connect each governance decision to its predecessor.</p></div><button class="outline" id="verify-chain">VERIFY CHAIN ↻</button></div><div class="receipt-status ${status === 'VERIFIED' || status === 'SEALED' ? 'verified' : status === 'TAMPERED' ? 'tampered' : ''}"><span class="chain-pulse">◈</span><b>${label}</b><span>${detail}</span><i class="tag">NOT ON-CHAIN</i></div><div class="receipt-chain">${recent.map((row, i) => {
    const open = expanded === row.receiptHash;
    const number = String(Math.max(1, rows.length - recent.length + i + 1)).padStart(4, '0');
    return `<button class="receipt-block ${i === recent.length - 1 ? 'latest' : ''}" data-receipt="${escapeHtml(row.receiptHash || row.id)}" aria-expanded="${open}"><span class="block-number">${number}</span><span class="block-main"><span class="block-top"><b>${escapeHtml(row.decision)} · ${escapeHtml(row.agent)}</b><small>${escapeHtml(row.time)}</small></span><span class="block-action">${escapeHtml(row.action)}</span><span class="block-hash"><i>HASH</i> ${row.receiptHash ? `${row.receiptHash.slice(0, 24)}…` : 'AWAITING LOCAL DIGEST'}</span>${open ? `<span class="block-full"><i>SHA-256</i> ${escapeHtml(row.receiptHash || 'Pending')}<br><i>PREVIOUS</i> ${escapeHtml(row.previousHash || GENESIS)}</span>` : ''}</span><span class="block-seal">${row.receiptHash ? '✓' : '◌'}</span></button>`;
  }).join('<div class="receipt-link"><span></span><b>PREVIOUS HASH LINK</b></div>')}</div><div class="receipt-disclaimer"><span>SIMULATED LOCAL PROVENANCE</span><span>Browser storage only · not anchored to a public chain · not tamper-proof</span></div></section>`;
}
