import { loadJSON } from "./utils.js";

(async function(){
  const h = await loadJSON("./data/health.json");

  // 整理事件数据
  const events = [
    ...(h.deworming||[]).map(d=>({type:"驱虫", date:d.date, note:d.drug||d.note||""})),
    ...(h.vaccines||[]).map(v=>({type:"疫苗", date:v.date, note:(v.type||"") + (v.hospital?` · ${v.hospital}`:"")})),
    ...(h.neuter?.date ? [{type:"绝育", date:h.neuter.date, note:h.neuter.hospital||h.neuter.note||""}] : [])
  ].sort((a,b)=> new Date(b.date) - new Date(a.date));

  // 最近健康事件摘要
  if (events.length) {
    document.getElementById("healthSummary").textContent = `${events[0].type} · ${events[0].note}`;
    document.getElementById("healthDate").textContent = `${events[0].date}`;
  } else {
    document.getElementById("healthSummary").textContent = "暂无健康事件";
    document.getElementById("healthDate").textContent = "";
  }

  // 时间轴（最近 10 条）
  const timelineEvents = events.slice(0,10);
  document.getElementById("timeline").innerHTML = timelineEvents.length
    ? timelineEvents.map(e=>`<li>${e.date} · ${e.type} · ${e.note}</li>`).join("")
    : "<li>暂无记录</li>";

  // 表格填充函数
  const fill = (id, rows, map) => {
    const tbody = document.querySelector(`#${id} tbody`);
    tbody.innerHTML = rows.map(map).join("");
  };

  // 驱虫表格
  fill("deworm", (h.deworming||[]).slice().reverse(),
    d=>`<tr><td>${d.date}</td><td>${d.drug||""}</td><td>${d.note||""}</td></tr>`);

  // 疫苗表格
  fill("vacc", (h.vaccines||[]).slice().reverse(),
    v=>`<tr><td>${v.date}</td><td>${v.type||""}</td><td>${v.hospital||""}</td><td>${v.note||""}</td></tr>`);

  // 绝育表格
  fill("neuter", h.neuter?.date ? [h.neuter] : [],
    n=>`<tr><td>${n.date}</td><td>${n.hospital||""}</td><td>${n.note||""}</td></tr>`);
})();
