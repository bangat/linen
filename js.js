/* js.js (module) — 린넨실: 실시간 공지(Firebase) + UI 로직 정리 */
/* index.html 예:
   <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
   <script type="module" src="js.js?v=20250820d"></script>
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

document.addEventListener("DOMContentLoaded", () => {
  // ===== 0) Firebase
  const firebaseConfig = (window.FB_CONFIG ?? {
    apiKey: "AIzaSyAlzPWmeLacWdnW0we7CtfnU2szvxgdIzc",
    authDomain: "hallymlinen.firebaseapp.com",
    databaseURL: "https://hallymlinen-default-rtdb.firebaseio.com",
    projectId: "hallymlinen",
    storageBucket: "hallymlinen.appspot.com",
    messagingSenderId: "867775830688",
    appId: "1:867775830688:web:cef3ed4e70ae9818f347c5",
    measurementId: "G-T02ZFK18L3"
  });
  const app = initializeApp(firebaseConfig);
  const db  = getDatabase(app); // 필요시 .app 도메인 주소 명시 가능

  // ===== A) 레거시 UI 강제 제거(캐시 대비) + hover 멈춤 무력화
  ["#menuBar", "#dropdownMenu", ".notice-actions", "#noticeRefreshBtn"].forEach(sel => {
    document.querySelectorAll(sel).forEach(el => el.remove());
  });
  const __patch = document.createElement("style");
  __patch.textContent = `
    .notice-track:hover { animation-play-state: running !important; }
    #menuBar, .dropdown-menu, .notice-actions, #noticeRefreshBtn { display: none !important; }
  `;
  document.head.appendChild(__patch);

  // ===== 1) 공지 마퀴: /notice 실시간
  const noticeTrack = document.getElementById("noticeTrack");
  const noticeBar   = document.getElementById("noticeBar");
  if (noticeTrack) {
    noticeTrack.style.whiteSpace = "nowrap";
    noticeTrack.style.overflow   = "hidden";
    noticeTrack.style.display    = "block";
  }
  if (noticeBar) noticeBar.style.overflow = "hidden";

  function renderNotice(text) {
    const clean = (text ?? "").toString().trim().replace(/\s+/g, " ");
    if (!noticeTrack) return;
    noticeTrack.textContent = clean ? (clean + "   •   " + clean) : "공지 없음";
  }
  window.renderNotice = renderNotice;

  const noticeRef = ref(db, "notice"); // 슬래시 없이
  onValue(
    noticeRef,
    (snap) => {
      const val = snap.val();
      let out = "";
      if (val && typeof val === "object") {
        out = val.text ?? val.message ?? "";
      } else if (typeof val === "string") {
        try {
          const obj = JSON.parse(val);
          out = (obj && typeof obj === "object") ? (obj.text ?? obj.message ?? val) : val;
        } catch {
          out = val;
        }
      }
      renderNotice(out);
    },
    (err) => {
      console.error("[공지 구독 오류]", { code: err?.code, name: err?.name, message: err?.message });
      renderNotice(String(err?.code).includes("permission_denied")
        ? "공지 권한(읽기) 없음 — RTDB 규칙 확인"
        : "공지 로드 실패");
    }
  );

  // ===== 2) 병동 캐시 + 오늘 날짜
  const SAVED_WARD_KEY = "linen_last_ward";
  const $ward = $("#wardDropdown");
  const savedWard = localStorage.getItem(SAVED_WARD_KEY);
  if (savedWard && $('#wardDropdown option[value="' + savedWard + '"]').length) $ward.val(savedWard);
  $ward.off("change.saveWard").on("change.saveWard", function () {
    localStorage.setItem(SAVED_WARD_KEY, $(this).val() || "");
  });
  function getTodayYYYYMMDD() {
    const d = new Date(); const y = d.getFullYear();
    const m = ("0" + (d.getMonth() + 1)).slice(-2);
    const day = ("0" + d.getDate()).slice(-2);
    return `${y}-${m}-${day}`;
  }
  if (!$("#requestDate").val()) $("#requestDate").val(getTodayYYYYMMDD()).trigger("change");

  // ===== 3) 헤더 클릭 초기화
  $("h1").off("click.headerReset").on("click.headerReset", function () {
    $(".tab").removeClass("active").css("background-color", "");
    $(".tab[data-tab='sheet']").addClass("active").css("background-color", "#4CAF50");
    $(".form-section").removeClass("active");
    $("#sheet").addClass("active");
    $('input[type="number"]').val("");
    $("#wardDropdown").val("");
    $("#requestDate").val("").trigger("change");
  });

  // ===== 4) 탭 전환
  $("[data-tab='normal'], [data-tab='ortho'], [data-tab='uniform']").addClass("disabled");
  $(".tab").off("click.tabs").on("click.tabs", function () {
    if ($(this).hasClass("disabled")) return;
    const tabId = $(this).attr("data-tab");
    $(".tab").removeClass("active").css("background-color", "");
    $(this).addClass("active").css("background-color", "#4CAF50");
    $(".form-section").removeClass("active");
    $("#" + tabId).addClass("active");
  });

  // ===== 5) 카메라/미리보기(압축)
  $("#cameraButton").off("click.camera").on("click.camera", () => $("#inventoryPhoto").click());
  $("#inventoryPhoto").off("change.preview").on("change.preview", function (event) {
    const file = event.target?.files?.[0]; if (!file) return;
    const maxWidth = 1024, maxHeight = 1024, quality = 0.7;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio; height *= ratio;
        }
        canvas.width = width; canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        $("#preview").attr("src", compressedDataUrl).show();
        canvas.toBlob((blob) => {
          const compressedFile = new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() });
          const dt = new DataTransfer();
          dt.items.add(compressedFile);
          $("#inventoryPhoto")[0].files = dt.files;
        }, "image/jpeg", quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  // ===== 6) 제출(Telegram)
  function highlightInvalid($el) {
    $el.addClass("invalid");
    $el[0]?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    try { $el.focus(); } catch {}
    setTimeout(() => $el.removeClass("invalid"), 1500);
  }

  $("#linenRequestForm").off("submit.submitLinen").on("submit.submitLinen", function (event) {
    event.preventDefault();

    const wardValue   = String($("#wardDropdown").val() || "").trim();
    const requestDate = $("#requestDate").val();
    const photoFile   = $("#inventoryPhoto")[0]?.files?.[0] || null;

    if (!wardValue) { alert("병동을 선택해주세요."); highlightInvalid($("#wardDropdown")); return; }
    if (!requestDate) { alert("입고 날짜를 선택해주세요."); highlightInvalid($("#requestDate")); return; }

    $("#submitBtn").prop("disabled", true);
    $("#statusMessage").fadeIn();

    let message = "";
    message += "병동명 : " + wardValue + "\n";
    message += "입고날짜 : " + requestDate + "\n\n";

    function collect(sectionId, title) {
      let buf = "";
      $("#" + sectionId + " input[type='number']").each(function () {
        const itemName  = $(this).closest("tr").find("td:first").text().trim();
        const itemCount = Number($(this).val());
        if (itemCount > 0) buf += itemName + " " + itemCount + "장\n";
      });
      if (buf) message += "[" + title + "]\n" + buf + "\n";
    }
    collect("sheet", "시트/기타");
    collect("normal", "일반환의");
    collect("ortho", "정형환의");
    collect("uniform", "근무복");

    const chatId = "5432510881";
    const token  = "6253877113:AAEyEqwqf5m0A5YB5Ag6vpez3ceCfIasKj0";

    const onDone = () => {
      $("#submitBtn").prop("disabled", false);
      $("#statusMessage").fadeOut();
    };

    if (photoFile) {
      const url1 = `https://api.telegram.org/bot${token}/sendPhoto`;
      const fd   = new FormData();
      fd.append("chat_id", chatId);
      fd.append("photo", photoFile, photoFile.name || "photo.jpg");
      fd.append("caption", message);

      fetch(url1, { method: "POST", body: fd })
        .then(r => r.json())
        .then(data => {
          if (!data.ok) throw new Error(data.description || "전송 실패");
          playNotificationSound();
          alert("요청이 성공적으로 전송되었습니다.");
          $("#linenRequestForm")[0].reset();
          $("#preview").attr("src", "#").hide();
          $("#requestDate").val(getTodayYYYYMMDD()).trigger("change");
          const saved = localStorage.getItem(SAVED_WARD_KEY);
          if (saved && $('#wardDropdown option[value="' + saved + '"]').length) $('#wardDropdown').val(saved);
        })
        .catch(err => {
          console.error("TG sendPhoto error:", err);
          alert("전송 오류: " + err.message);
        })
        .finally(onDone);

    } else {
      const url2 = `https://api.telegram.org/bot${token}/sendMessage`;
      const payload = JSON.stringify({ chat_id: chatId, parse_mode: "HTML", text: message });

      fetch(url2, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload })
        .then(r => r.json())
        .then(data => {
          if (!data.ok) throw new Error(data.description || "전송 실패");
          playNotificationSound();
          alert("요청이 성공적으로 전송되었습니다.");
          $("#linenRequestForm")[0].reset();
          $("#requestDate").val(getTodayYYYYMMDD()).trigger("change");
          const saved = localStorage.getItem(SAVED_WARD_KEY);
          if (saved && $('#wardDropdown option[value="' + saved + '"]').length) $('#wardDropdown').val(saved);
        })
        .catch(err => {
          console.error("TG sendMessage error:", err);
          alert("전송 오류: " + err.message);
        })
        .finally(onDone);
    }
  });

  // ===== 7) 관리자 링크
  $("#adminPageLink").off("click.adminLink").on("click.adminLink", function (e) {
    e.preventDefault();
    const password = prompt("관리자 페이지 암호를 입력하세요.");
    if (password === "9") window.location.href = "admin.html";
    else alert("암호가 일치하지 않습니다.");
  });

  // ===== 8) 날짜 placeholder 동기화
  const dateInput = document.getElementById("requestDate");
  const datePlaceholder = document.querySelector(".date-placeholder");
  function syncDatePlaceholder() {
    if (!dateInput || !datePlaceholder) return;
    datePlaceholder.style.display = dateInput.value ? "none" : "block";
  }
  dateInput?.addEventListener("input",  syncDatePlaceholder);
  dateInput?.addEventListener("change", syncDatePlaceholder);
  syncDatePlaceholder();

  if ($.fn && $.fn.datepicker) {
    $("#requestDate").datepicker({ dateFormat: "yy-mm-dd", onSelect: syncDatePlaceholder });
  }

  // ===== 9) 알림음
  function playNotificationSound() {
    const audio = document.getElementById("notificationSound");
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }

  // ===== (옵션) 에러 헬퍼: 콘솔에서 즉시 확인
  window.addEventListener("error", (e) => console.error("[window.error]", e.message, e.filename, e.lineno));
  window.addEventListener("unhandledrejection", (e) => console.error("[unhandledrejection]", e.reason));
});
