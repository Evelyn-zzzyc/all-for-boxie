import { loadJSON, lineChartSVG } from "./utils.js";

(async function(){
  const weights = await loadJSON("./data/weight.json");

  // 折线图数据
  const points = weights.map(w => ({ x: w.date, y: w.kg }));
  document.getElementById("chart").innerHTML = lineChartSVG(points);

  // 表格
  const tbody = document.querySelector("#table tbody");
  tbody.innerHTML = weights.slice().reverse().map(w =>
    `<tr>
      <td>${w.date}</td>
      <td>${w.kg}</td>
    </tr>`
  ).join("");
})();
