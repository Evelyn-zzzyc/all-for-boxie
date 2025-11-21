import { loadJSON, sum, groupByMonth, pieChartSVG } from "./utils.js";

(async function(){
  const expenses = await loadJSON("./data/expenses.json");
  const daily = expenses.daily || [];

  // 最近消费（取最后一条记录）
  if (daily.length > 0) {
    const latest = daily[daily.length - 1];
    document.getElementById("recentExpense").textContent = `¥${latest.cost.toFixed(2)}`;
    document.getElementById("recentExpenseDate").textContent = latest.date;
  }

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

    // 饼图或类别消费统计
    const pieDiv = document.getElementById("pie");
    if (tag === "all") {
      const cats = ["食物","玩具","用品","设备","医疗"];
      const pieData = cats.map(cat => ({
        label: cat,
        value: sum(filtered, e => e.category === cat ? e.cost : 0)
      })).filter(e => e.value > 0);

      pieDiv.innerHTML = pieData.length 
        ? pieChartSVG(pieData) 
        : "<small>暂无数据</small>";
    } else {
      const totalCatMonth = sum(current.filter(e => e.category === tag), e => e.cost);
      const totalCatAll = sum(daily.filter(e => e.category === tag), e => e.cost);

      let extraLine = "";
      if (month === "all") {
        const overall = sum(daily, e => e.cost);
        extraLine = `<p>整体累计消费：¥${overall.toFixed(2)}</p>`;
      } else {
        const totalMonth = sum(current, e => e.cost);
        extraLine = `<p>本月总计消费：¥${totalMonth.toFixed(2)}</p>`;
      }

      pieDiv.innerHTML = `
        <p>${tag}本月消费：¥${totalCatMonth.toFixed(2)}</p>
        <p>${tag}累计消费：¥${totalCatAll.toFixed(2)}</p>
        ${extraLine}
      `;
    }

    // 表格
    const tbody = document.querySelector("#table tbody");
    tbody.innerHTML = filtered.slice().reverse().map(e =>
      `<tr>
        <td>${e.date}</td>
        <td>${e.category}</td>
        <td>${e.item}${e.brand ? `(${e.brand})` : ""}</td>
        <td>¥${e.cost.toFixed(2)}</td>
        <td>${e.note || ""}</td>
      </tr>`
    ).join("");

    // 顶部汇总信息（仅在 tag === "all" 时显示）
    if (tag === "all") {
      let monthTotalText = "";
      if (month === "all") {
        const totalAll = sum(daily, e => e.cost);
        monthTotalText = `累计总消费：¥${totalAll.toFixed(2)}`;
      } else {
        const totalMonth = sum(current, e => e.cost);
        monthTotalText = `本月总消费：¥${totalMonth.toFixed(2)}`;
      }
      document.getElementById("monthTotal").textContent = monthTotalText;

      const overall = sum(daily, e => e.cost);
      document.getElementById("allTotal").textContent = `整体累计消费：¥${overall.toFixed(2)}`;
    } else {
      document.getElementById("monthTotal").textContent = "";
      document.getElementById("allTotal").textContent = "";
    }
  }

  // 事件绑定
  monthSelect.addEventListener("change", render);
  tagSelect.addEventListener("change", render);

  // 初始渲染
  render();
})();
