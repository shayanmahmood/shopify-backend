(function () {
  if (window.__chatWidget) return;
  window.__chatWidget = true;

  var script =
    document.currentScript || document.querySelector('script[src*="widget.js"]');
  var API = new URL(script.src).origin + "/api/chat";
  var color = script.getAttribute("data-color") || "#111827";
  var title = script.getAttribute("data-title") || "Chat with us";
  var greeting =
    script.getAttribute("data-greeting") || "Hi! How can I help you today?";

  var history = [];
  try {
    history = JSON.parse(sessionStorage.getItem("cw_history") || "[]");
  } catch (e) {}

  var host = document.createElement("div");
  host.style.cssText = "position:fixed;bottom:20px;right:20px;z-index:2147483647;";
  document.body.appendChild(host);
  var root = host.attachShadow({ mode: "open" });

  root.innerHTML =
    "<style>" +
    "*{box-sizing:border-box;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}" +
    ".btn{width:56px;height:56px;border-radius:50%;border:0;cursor:pointer;background:" + color + ";color:#fff;font-size:24px;box-shadow:0 4px 14px rgba(0,0,0,.25)}" +
    ".panel{display:none;flex-direction:column;position:absolute;bottom:70px;right:0;width:340px;max-width:calc(100vw - 40px);height:480px;max-height:calc(100vh - 110px);background:#fff;border-radius:14px;box-shadow:0 8px 30px rgba(0,0,0,.25);overflow:hidden}" +
    ".panel.open{display:flex}" +
    ".head{background:" + color + ";color:#fff;padding:14px 16px;font-weight:600;display:flex;justify-content:space-between;align-items:center}" +
    ".x{background:none;border:0;color:#fff;font-size:20px;cursor:pointer}" +
    ".msgs{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:8px;background:#f9fafb}" +
    ".m{max-width:82%;padding:9px 12px;border-radius:12px;font-size:14px;line-height:1.4;white-space:pre-wrap;word-wrap:break-word}" +
    ".m.user{align-self:flex-end;background:" + color + ";color:#fff}" +
    ".m.bot{align-self:flex-start;background:#fff;color:#111;border:1px solid #e5e7eb}" +
    ".row{display:flex;gap:8px;padding:10px;border-top:1px solid #e5e7eb;background:#fff}" +
    ".in{flex:1;border:1px solid #d1d5db;border-radius:8px;padding:9px 10px;font-size:14px;outline:none}" +
    ".send{background:" + color + ";color:#fff;border:0;border-radius:8px;padding:0 14px;cursor:pointer;font-size:14px}" +
    ".send:disabled{opacity:.5;cursor:default}" +
    "</style>" +
    '<div class="panel">' +
    '<div class="head"><span class="t"></span><button class="x" aria-label="Close">×</button></div>' +
    '<div class="msgs"></div>' +
    '<div class="row"><input class="in" placeholder="Type a message..." maxlength="1000"/><button class="send">Send</button></div>' +
    "</div>" +
    '<button class="btn" aria-label="Open chat">💬</button>';

  var panel = root.querySelector(".panel");
  var msgs = root.querySelector(".msgs");
  var input = root.querySelector(".in");
  var send = root.querySelector(".send");
  root.querySelector(".t").textContent = title;

  function add(role, text) {
    var d = document.createElement("div");
    d.className = "m " + role;
    d.textContent = text;
    msgs.appendChild(d);
    msgs.scrollTop = msgs.scrollHeight;
    return d;
  }

  function save() {
    try {
      sessionStorage.setItem("cw_history", JSON.stringify(history.slice(-20)));
    } catch (e) {}
  }

  add("bot", greeting);
  history.forEach(function (m) {
    add(m.role === "assistant" ? "bot" : "user", m.content);
  });

  function toggle() {
    panel.classList.toggle("open");
    if (panel.classList.contains("open")) input.focus();
  }
  root.querySelector(".btn").onclick = toggle;
  root.querySelector(".x").onclick = toggle;

  async function submit() {
    var text = input.value.trim();
    if (!text || send.disabled) return;
    input.value = "";
    send.disabled = true;
    add("user", text);
    history.push({ role: "user", content: text });
    var typing = add("bot", "...");
    try {
      var res = await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      var data = await res.json();
      var reply = data.reply || "Sorry, something went wrong. Please try again.";
      typing.textContent = reply;
      history.push({ role: "assistant", content: reply });
      save();
    } catch (e) {
      typing.textContent = "Connection problem. Please try again.";
      history.pop();
    }
    send.disabled = false;
    msgs.scrollTop = msgs.scrollHeight;
    input.focus();
  }

  send.onclick = submit;
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") submit();
  });
})();