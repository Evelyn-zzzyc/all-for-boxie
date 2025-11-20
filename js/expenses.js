import { loadJSON, sum, groupByMonth, pieChartSVG } from "./utils.js";

(async function(){
  const expenses = await loadJSON("./data/expenses.json");
  const daily = expenses.daily || [];

  // 按月份分组
  const byMonth = groupByMonth(daily, e => e.date);
  const months = Array.from(byMonth.keys()).sort();

  // 填充月份选择器（加一个“所有累计”选项）
  const monthSelect = document.getElementById("monthSelect");
  monthSelect.innerHTML = `<option value="all">所有累计</option>` + 
    months.map(m => `<option value="${m}">${m}</option>`).join("");
  monthSelect.value = months.at(-1); // 默认选最新月份

  // 标签选择器
  const tagSelect = document.getElementById("tagSelect");

  // 渲染函数
  function render() {
    const month = monthSelect.value;
    const tag = tagSelect.value;

    // 如果选择“所有累计”，就用全部数据
    const current = month === "all" ? daily : (byMonth.get(month) || []);

    // 按标签过滤
    const filtered = tag === "all" ? current : current.filter(e => e.category === tag);

    // 饼图数据（中文类别）
    const cats = ["食物","玩具","用品","设备","医疗用品"];
    const pieData = cats.map(cat => ({
      label: cat,
      value: sum(filtered, e => e.category === cat ? e.cost : 0)
    })).filter(e => e.value > 0);

    document.getElementById("pie").innerHTML = pieData.length 
      ? pieChartSVG(pieData) 
      : "<small>暂无数据</small>";

    // 表格
    const tbody = document.querySelector("#table tbody");
    tbody.innerHTML = filtered.slice().reverse().map(e =>
      `<tr>
        <td>${e.date}</td>
        <td>${e.category}</td>
        <td>${e.item}${e.brand ? `(${e.brand})` : ""}</td>
        <td>¥${e.cost}</td>
        <td>${e.note || ""}</td>
      </tr>`
    ).join("");

    // 每月总消费或累计总消费
    const monthTotal = sum(current, e => e.cost);
    document.getElementById("monthTotal").textContent = 
      month === "all" ? `累计总消费：¥${monthTotal.toFixed(2)}` : `本月总消费：¥${monthTotal.toFixed(2)}`;

    // 累计总消费（始终显示）
    const allTotal = sum(daily, e => e.cost);
    document.getElementById("allTotal").textContent = `全部累计消费：¥${allTotal.toFixed(2)}`;
  }

  // 事件绑定
  monthSelect.addEventListener("change", render);
  tagSelect.addEventListener("change", render);

  // 初始渲染
  render();
})();
