(function () {
  "use strict";

  /* ---------- DOM activity log ---------- */
  var logList = document.getElementById("dwx-log");
  var logStarted = false;

  function logDom(message) {
    if (!logStarted) { logList.innerHTML = ""; logStarted = true; }
    var li = document.createElement("li");
    li.textContent = message;
    logList.appendChild(li);
    while (logList.children.length > 7) {
      logList.removeChild(logList.firstChild);
    }
  }

  /* ---------- 1. Interactive form: access elements and validate input ---------- */
  var form = document.getElementById("dwx-form");
  var nameInput = document.getElementById("dwx-name");
  var emailInput = document.getElementById("dwx-email");
  var speedInput = document.getElementById("dwx-speed");
  var okMsg = document.getElementById("dwx-form-ok");

  var chosenDistrict = "";
  var chosenAdvice = "";
  var lastRequest = null;

  function setFieldState(input, errId, message) {
    var errEl = document.getElementById(errId);
    errEl.textContent = message;
    input.classList.toggle("dwx-invalid", !!message);
    input.classList.toggle("dwx-valid", !message && input.value.trim() !== "");
    return !message;
  }

  function checkName() {
    var v = nameInput.value.trim();
    return setFieldState(nameInput, "dwx-name-err", v.length < 2 ? "Please enter at least 2 characters." : "");
  }
  function checkEmail() {
    var v = emailInput.value.trim();
    var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    return setFieldState(emailInput, "dwx-email-err", ok ? "" : "Enter a valid email address.");
  }
  function checkSpeed() {
    var raw = speedInput.value.trim();
    var v = Number(raw);
    var msg = "";
    if (raw === "" || isNaN(v)) msg = "Enter a number.";
    else if (v < 3 || v > 25) msg = "Wind speed must be between 3 and 25 m/s.";
    return setFieldState(speedInput, "dwx-speed-err", msg);
  }

  [[nameInput, checkName, "name"], [emailInput, checkEmail, "email"], [speedInput, checkSpeed, "speed"]]
    .forEach(function (item) {
      item[0].addEventListener("blur", function () {
        item[1]();
        logDom("getElementById('dwx-" + item[2] + "') -> validated on blur");
      });
    });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var results = [checkName(), checkEmail(), checkSpeed()];
    var allOk = results.every(Boolean);
    if (allOk) {
      var speed = Number(speedInput.value);
      var rating = speed >= 12 ? "excellent" : speed >= 7 ? "good" : "modest";
      lastRequest = { name: nameInput.value.trim(), speed: speed, rating: rating };
      okMsg.textContent = "Thanks, " + lastRequest.name + "! A " + rating + " wind site. Survey requested.";
      logDom("addEventListener('submit') -> form valid, status text updated");
    } else {
      okMsg.textContent = "";
      logDom("addEventListener('submit') -> errors shown, form blocked");
    }
  });

  /* ---------- 2. Dropdown menu: modify elements to toggle visibility ---------- */
  var dropdown = document.getElementById("dwx-dropdown");
  var dropBtn = document.getElementById("dwx-drop-btn");
  var dropLabel = document.getElementById("dwx-drop-label");
  var menu = document.getElementById("dwx-menu");
  var dropResult = document.getElementById("dwx-drop-result");
  var options = menu.querySelectorAll("li");

  function openMenu() {
    menu.hidden = false;
    dropBtn.setAttribute("aria-expanded", "true");
    logDom("menu.hidden = false -> dropdown shown");
  }
  function closeMenu() {
    if (menu.hidden) return;
    menu.hidden = true;
    dropBtn.setAttribute("aria-expanded", "false");
    logDom("menu.hidden = true -> dropdown hidden");
  }
  function selectOption(li) {
    options.forEach(function (o) { o.classList.remove("dwx-selected"); });
    li.classList.add("dwx-selected");
    chosenDistrict = li.getAttribute("data-district");
    chosenAdvice = li.getAttribute("data-advice");
    dropLabel.textContent = chosenDistrict;
    dropResult.textContent = chosenAdvice;
    logDom("querySelectorAll('li') -> selected " + chosenDistrict);
    closeMenu();
    dropBtn.focus();
  }

  dropBtn.addEventListener("click", function () {
    if (menu.hidden) openMenu(); else closeMenu();
  });
  options.forEach(function (li) {
    li.addEventListener("click", function () { selectOption(li); });
    li.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectOption(li); }
    });
  });
  document.addEventListener("click", function (e) {
    if (!dropdown.contains(e.target)) closeMenu();
  });

  /* ---------- 3. Modal: manipulate elements to display modal ---------- */
  var modal = document.getElementById("dwx-modal");
  var modalBody = document.getElementById("dwx-modal-body");
  var openBtn = document.getElementById("dwx-open-modal");
  var closeBtn = document.getElementById("dwx-close-modal");

  function openModal() {
    var parts = [];
    parts.push(chosenDistrict ? "District: " + chosenDistrict + ". " + chosenAdvice
                              : "No district chosen yet. Pick one from the dropdown.");
    parts.push(lastRequest
      ? "Survey requested by " + lastRequest.name + " at " + lastRequest.speed + " m/s (" + lastRequest.rating + " wind)."
      : "No survey submitted yet. Fill in the form.");
    modalBody.textContent = parts.join(" ");
    modal.hidden = false;
    requestAnimationFrame(function () { modal.classList.add("dwx-open"); });
    closeBtn.focus();
    logDom("modal.hidden = false -> content set with textContent");
  }
  function closeModal() {
    modal.classList.remove("dwx-open");
    setTimeout(function () { modal.hidden = true; openBtn.focus(); }, 250);
    logDom("modal closed -> focus returned to button");
  }

  openBtn.addEventListener("click", openModal);
  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!modal.hidden) closeModal();
    else closeMenu();
  });
})();
