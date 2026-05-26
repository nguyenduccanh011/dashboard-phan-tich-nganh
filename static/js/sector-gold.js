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
  renderBlockG(data.block_g, data.tickers, {});
})();


function renderBlockA(blockA) {
  const container = document.getElementById('block-a-charts');
  const macro35 = blockA?.gold_prices || [];

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
  const goldIce = parseFindicatorSeries(macro35.filter(r => r.name_id === 78));

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
  const goldQd   = parseFindicatorSeries(macro35.filter(r => r.name_id === 730));
  const sjcBuy   = parseFindicatorSeries(macro35.filter(r => r.name_id === 584));
  const sjcSell  = parseFindicatorSeries(macro35.filter(r => r.name_id === 585));

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

  // Chart: Khách du lịch quốc tế VN (proxy nhu cầu ngoại tệ & vàng)
  const touristData = parseFindicatorSeries(blockB?.tourists);
  if (touristData.length) {
    container.insertAdjacentHTML('beforeend', `
      <div class="chart-card" data-year-options="1Y,3Y,5Y">
        <div class="chart-header">
          <span class="chart-title">Khách du lịch quốc tế VN (Lượt người/tháng)</span>
          <div class="year-btns"></div>
        </div>
        <div class="chart-container" id="chart-gold-tourists"></div>
      </div>
    `);
    const cardT = container.lastElementChild;
    function renderTourists(year) {
      const cutoff = yearToCutoff(year);
      createStockChart('chart-gold-tourists', {
        series: [{ name: 'Khách QT VN', data: touristData.filter(p => p[0] >= cutoff), color: HC_COLORS[1] }],
      });
    }
    initYearButtons(cardT, renderTourists);
    renderTourists('1Y');
  }
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
  const macro35 = blockA?.gold_prices || [];

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
  const goldQdRaw = macro35.filter(r => r.name_id === 730);
  const sjcSellRaw = macro35.filter(r => r.name_id === 585);

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
  renderValuationTable('block-e-table', blockE, {
    accountMap: { marketCap: 35, pe: 39, pb: 40, grossMargin: 2, roe: 8, inventory: 11, inventoryDays: 13 },
    columns: ['marketCap', 'pe', 'pb', 'grossMargin', 'roe', 'inventory', 'inventoryDays'],
    pctFields: ['grossMargin', 'roe'],
  });
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
    renderBctcChart(`chart-bctc-${ticker}`, ticker, blockF);
  });
}