// static/js/sector-gold.js
// Render trang ngành Vàng — 6 khối A–F

(async function SectorGold() {
  let data;
  try {
    const res = await fetch('/api/sector/gold/cache');
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (e) {
    document.getElementById('sector-name').textContent = 'Vàng — Lỗi tải dữ liệu';
    return;
  }

  document.getElementById('sector-name').textContent = 'Ngành Vàng';
  document.getElementById('last-updated').textContent =
    'Cập nhật: ' + new Date(data.updated_at).toLocaleString('vi-VN');
  document.title = 'Vàng — Sector Hub';

  renderBlockA(data.block_a);
  renderBlockB(data.block_b);
  renderBlockC(data.block_c);
  renderBlockD(data.block_a);
  renderBlockE(data.block_e);
  renderBlockF(data.block_f);
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');
  const macro35 = blockA?.macro_35 || [];

  // Chart 1: Giá vàng quốc tế (USD/t.oz) + quy đổi VNĐ
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y,MAX">
      <div class="chart-header">
        <span class="chart-title">Giá vàng ICE (USD/t.oz)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-gold-ice"></div>
    </div>
  `);

  const card1 = container.lastElementChild;
  const goldIce = parseFindicatorSeries(macro35.filter(r => r.nameId === 78));

  function renderGoldIce(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-gold-ice', {
      series: [{ name: 'Vàng ICE (USD/t.oz)', data: goldIce.filter(p => p[0] >= cutoff), color: HC_COLORS[4] }],
    });
  }
  initYearButtons(card1, renderGoldIce);
  renderGoldIce('1Y');

  // Chart 2: Giá vàng nội địa (SJC mua/bán vs quy đổi ICE)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Vàng SJC & Quy đổi ICE (Triệu VNĐ/lượng)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-gold-sjc"></div>
    </div>
  `);

  const card2 = container.lastElementChild;
  const goldQd   = parseFindicatorSeries(macro35.filter(r => r.nameId === 730));
  const sjcBuy   = parseFindicatorSeries(macro35.filter(r => r.nameId === 584));
  const sjcSell  = parseFindicatorSeries(macro35.filter(r => r.nameId === 585));

  function renderSjc(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-gold-sjc', {
      series: [
        { name: 'Quy đổi ICE (VNĐ/lượng)', data: goldQd.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'SJC mua vào', data: sjcBuy.filter(p => p[0] >= cutoff), color: HC_COLORS[2] },
        { name: 'SJC bán ra', data: sjcSell.filter(p => p[0] >= cutoff), color: HC_COLORS[3] },
      ],
    });
  }
  initYearButtons(card2, renderSjc);
  renderSjc('1Y');

  // Chart 3: USD/VND + DXY
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">USD/VND & DXY Index</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-gold-usd-dxy"></div>
    </div>
  `);

  const card3 = container.lastElementChild;
  const usdvnd = parseFindicatorSeries(blockA?.usd_vnd);
  const dxy    = parseFindicatorSeries(blockA?.dxy);

  function renderUsdDxy(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-gold-usd-dxy', {
      yAxis: [
        { title: { text: 'USD/VND' } },
        { title: { text: 'DXY' }, opposite: true },
      ],
      series: [
        { name: 'USD/VND', data: usdvnd.filter(p => p[0] >= cutoff), color: HC_COLORS[0] },
        { name: 'DXY', data: dxy.filter(p => p[0] >= cutoff), color: HC_COLORS[2], yAxis: 1 },
      ],
    });
  }
  initYearButtons(card3, renderUsdDxy);
  renderUsdDxy('1Y');
}


function renderBlockB(blockB) {
  const container = document.getElementById('block-b-charts');

  // Chart: Bán lẻ VN (proxy trang sức)
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Bán lẻ hàng hoá VN (Proxy nhu cầu trang sức)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-gold-retail"></div>
    </div>
  `);

  const card = container.lastElementChild;
  const retail = parseFindicatorSeries(blockB?.retail);

  function renderRetail(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-gold-retail', {
      series: [{ name: 'Bán lẻ HH VN', data: retail.filter(p => p[0] >= cutoff), color: HC_COLORS[0] }],
    });
  }
  initYearButtons(card, renderRetail);
  renderRetail('1Y');
}


function renderBlockC(blockC) {
  const container = document.getElementById('block-c-charts');
  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card">
      <div class="chart-header"><span class="chart-title">Giá SJC — xem Khối A</span></div>
      <div class="chart-container chart-sm" id="chart-gold-c"></div>
    </div>
  `);
  showEmpty('chart-gold-c', 'Giá SJC mua/bán đã hiển thị trong Khối A');
}


function renderBlockD(blockA) {
  const container = document.getElementById('block-d-charts');
  const macro35 = blockA?.macro_35 || [];

  container.insertAdjacentHTML('beforeend', `
    <div class="chart-card" data-year-options="1Y,3Y,5Y">
      <div class="chart-header">
        <span class="chart-title">Premium SJC so với giá thế giới quy đổi (%)</span>
        <div class="year-btns"></div>
      </div>
      <div class="chart-container" id="chart-gold-spread"></div>
    </div>
  `);

  const card = container.lastElementChild;
  const goldQdRaw = macro35.filter(r => r.nameId === 730);
  const sjcSellRaw = macro35.filter(r => r.nameId === 585);

  // Tính spread: (SJC bán - Quy đổi) / Quy đổi * 100
  const qd = parseFindicatorSeries(goldQdRaw);
  const sjc = parseFindicatorSeries(sjcSellRaw);
  const qdMap = new Map(qd.map(([ts, v]) => [ts, v]));

  const spreadData = sjc
    .filter(([ts]) => qdMap.has(ts) && qdMap.get(ts) > 0)
    .map(([ts, sjcVal]) => [ts, ((sjcVal - qdMap.get(ts)) / qdMap.get(ts)) * 100]);

  function renderSpread(year) {
    const cutoff = yearToCutoff(year);
    createStockChart('chart-gold-spread', {
      yAxis: [{ title: { text: 'Premium %' }, labels: { format: '{value}%' } }],
      series: [{ name: 'Premium SJC (%)', data: spreadData.filter(p => p[0] >= cutoff), color: HC_COLORS[4] }],
    });
  }
  initYearButtons(card, renderSpread);
  renderSpread('1Y');
}


function renderBlockE(blockE) {
  const container = document.getElementById('block-e-table');
  const tickers = Object.keys(blockE || {});
  if (!tickers.length) { container.innerHTML = '<p class="text-muted">Không có dữ liệu</p>'; return; }

  const rows = tickers.map(t => {
    const tr = blockE[t]?.trailing;
    const tickerData = tr?.[t] || (Array.isArray(tr) ? tr : []);
    const get = (id) => tickerData.find?.(r => r.accountId === id)?.value;
    const analyst = blockE[t]?.analyst;
    const rec = Array.isArray(analyst) ? analyst[0] : analyst;
    return {
      ticker: t,
      marketCap: get(35), pe: get(39), pb: get(40),
      grossMargin: get(2), roe: get(8),
      inventory: get(11), inventoryDays: get(13),
      recommendation: rec?.recommend, upside: rec?.upside, targetPrice: rec?.targetPrice,
    };
  });

  const recTag = (r) => {
    if (!r) return '—';
    const map = { BUY: 'tag-buy', HOLD: 'tag-hold', SELL: 'tag-sell' };
    return `<span class="${map[r] || ''}">${r}</span>`;
  };
  const pct = v => v != null ? `<span class="${v >= 0 ? 'num-up' : 'num-down'}">${(v * 100).toFixed(1)}%</span>` : '—';
  const num = (v, dp = 1) => v != null ? Highcharts.numberFormat(v, dp) : '—';

  container.innerHTML = `
    <table class="stock-table">
      <thead>
        <tr>
          <th>Ticker</th><th>Vốn hóa (tỷ)</th><th>PE</th><th>PB</th>
          <th>Biên gộp</th><th>ROE</th><th>V.quay HTK</th><th>Ngày HTK</th>
          <th>Recommend</th><th>Upside</th><th>Target</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `
          <tr>
            <td>${r.ticker}</td>
            <td>${num(r.marketCap, 0)}</td>
            <td>${num(r.pe)}</td>
            <td>${num(r.pb)}</td>
            <td>${pct(r.grossMargin)}</td>
            <td>${pct(r.roe)}</td>
            <td>${num(r.inventory)}</td>
            <td>${num(r.inventoryDays, 0)}</td>
            <td>${recTag(r.recommendation)}</td>
            <td>${r.upside != null ? pct(r.upside / 100) : '—'}</td>
            <td>${r.targetPrice ? num(r.targetPrice, 0) : '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}


function renderBlockF(blockF) {
  const container = document.getElementById('block-f-charts');
  Object.keys(blockF || {}).forEach(ticker => {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card">
        <div class="chart-header"><span class="chart-title">BCTC ${ticker} — 8 quý</span></div>
        <div class="chart-container chart-lg" id="chart-bctc-${ticker}"></div>
      </div>
    `);

    const tickerData = blockF[ticker];
    const rows = tickerData?.[ticker] || (Array.isArray(tickerData) ? tickerData : []);
    if (!rows?.length) { showEmpty(`chart-bctc-${ticker}`); return; }

    const quarters = [...new Set(rows.map(r => r.period || `${r.year}Q${r.quarter}`))].sort().slice(-8);
    const getQ = (accId) => quarters.map(q => {
      const r = rows.find(x => (x.period || `${x.year}Q${x.quarter}`) === q && x.accountId === accId);
      return r?.value ?? null;
    });

    createChart(`chart-bctc-${ticker}`, {
      chart: { type: 'column' },
      xAxis: { categories: quarters },
      yAxis: [
        { title: { text: 'Tỷ VNĐ' } },
        { title: { text: 'Biên gộp %' }, opposite: true, labels: { format: '{value}%' } },
      ],
      series: [
        { name: 'Doanh thu', type: 'column', data: getQ(24), color: HC_COLORS[0] },
        { name: 'LN gộp', type: 'column', data: getQ(28), color: HC_COLORS[2] },
        { name: 'LNST', type: 'column', data: getQ(43), color: HC_COLORS[3] },
        { name: 'Biên gộp %', type: 'line', data: getQ(2), color: HC_COLORS[1], yAxis: 1,
          tooltip: { valueSuffix: '%' } },
      ],
    });
  });
}
