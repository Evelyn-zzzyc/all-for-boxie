// 通用工具函数

// 读取 JSON 文件
export async function loadJSON(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`加载失败: ${path}`);
  return res.json();
}

// 数组求和
export function sum(arr, sel = x => x) {
  return arr.reduce((a, b) => a + sel(b), 0);
}

// 按月份分组
export function groupByMonth(items, getDate) {
  const map = new Map();
  for (const it of items) {
    const d = new Date(getDate(it));
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    map.set(key, (map.get(key) || []).concat([it]));
  }
  return map;
}

// 美化版折线图 SVG，带坐标轴
export function lineChartSVG(points, { minY, maxY } = {}) {
  if (!points.length) return "<svg></svg>";
  const w = 600, h = 300, p = 40; // 增加高度和边距
  const xs = points.map(p => new Date(p.x).getTime());
  const ys = points.map(p => p.y);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const yMin = minY ?? Math.min(...ys), yMax = maxY ?? Math.max(...ys);

  const scaleX = t => p + (t - xMin) * (w - 2*p) / (xMax - xMin || 1);
  const scaleY = v => h - p - (v - yMin) * (h - 2*p) / (yMax - yMin || 1);

  // 折线
  const path = points.map((pt, i) =>
    `${i ? "L" : "M"} ${scaleX(new Date(pt.x).getTime())} ${scaleY(pt.y)}`
  ).join(" ");

  // 坐标轴
  const axisX = `<line x1="${p}" y1="${h-p}" x2="${w-p}" y2="${h-p}" stroke="#ccc"/>`;
  const axisY = `<line x1="${p}" y1="${p}" x2="${p}" y2="${h-p}" stroke="#ccc"/>`;

  // 刻度（横轴日期）
  const xTicks = xs.map((t,i) => {
    const x = scaleX(t);
    const dateStr = new Date(t).toISOString().slice(5,10); // MM-DD
    return `<line x1="${x}" y1="${h-p}" x2="${x}" y2="${h-p+5}" stroke="#999"/>
            <text x="${x}" y="${h-p+20}" text-anchor="middle" font-size="10" fill="#ccc">${dateStr}</text>`;
  }).join("");

  // 刻度（纵轴体重）
  const yTicks = [];
  const step = (yMax - yMin) / 5;
  for (let v=yMin; v<=yMax; v+=step) {
    const y = scaleY(v);
    yTicks.push(`<line x1="${p-5}" y1="${y}" x2="${p}" y2="${y}" stroke="#999"/>
                 <text x="${p-10}" y="${y+3}" text-anchor="end" font-size="10" fill="#ccc">${v.toFixed(1)}</text>`);
  }

  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="line chart">
    ${axisX}${axisY}
    ${xTicks}${yTicks.join("")}
    <path d="${path}" fill="none" stroke="#7e57c2" stroke-width="2"/>
  </svg>`;
}


export function pieChartSVG(data) {
  if (!data.length) return "<svg></svg>";
  const w = 320, h = 220, r = 80; // 稍微加大画布，避免裁剪
  const total = sum(data, d => d.value);
  let angle = -Math.PI/2;
  const colors = ["#4B0082","#483D8B","#6A5ACD","#2E2E8B","#3A3A75","#1E3A5F","#2F4F4F"];
  let colorIndex = 0;

  // 先生成扇形
  const paths = data.map(d => {
    const frac = d.value / total;
    const x1 = w/2 + r * Math.cos(angle);
    const y1 = h/2 + r * Math.sin(angle);
    angle += frac * 2 * Math.PI;
    const x2 = w/2 + r * Math.cos(angle);
    const y2 = h/2 + r * Math.sin(angle);
    const large = frac > 0.5 ? 1 : 0;
    const color = colors[colorIndex++ % colors.length];
    return `<path d="M${w/2},${h/2} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z" fill="${color}"></path>`;
  }).join("");

  // 再生成文字（保证在最上层）
  angle = -Math.PI/2;
  colorIndex = 0;
  const texts = data.map(d => {
    const frac = d.value / total;
    angle += frac * 2 * Math.PI;
    const midAngle = angle - frac * Math.PI;
    const lx = w/2 + (r+25) * Math.cos(midAngle);
    const ly = h/2 + (r+25) * Math.sin(midAngle);
    return `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" font-size="12" fill="#FFFFFF">
      ${d.label} ¥${d.value.toFixed(2)}
    </text>`;
  }).join("");

  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="pie chart">${paths}${texts}</svg>`;
}


//  SVG
export function barChartSVG(series) {
  if (!series.length) return "<svg></svg>";
  const w = 600, h = 220, p = 24;
  const max = Math.max(...series.map(s => s.value));
  const barW = (w - 2*p) / series.length;
  const bars = series.map((s, i) => {
    const x = p + i * barW;
    const y = h - p - (s.value / max) * (h - 2*p);
    const height = (s.value / max) * (h - 2*p);
    return `<rect x="${x}" y="${y}" width="${barW*0.8}" height="${height}" fill="${randomColor(s.label)}">
      <title>${s.label}: ${s.value}</title></rect>`;
  }).join("");
  return `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="bar chart">${bars}</svg>`;
}

// 随机颜色生成（保证不同类别有不同颜色）
function randomColor(seed) {
  let hash = 0;
  for (let i=0; i<seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
}
