/* js.js (module) — 린넨실: 실시간 공지(Firebase) + UI 로직 정리 */
/* 사용법: index.html에서
   <script type="module" src="js.js"></script>
   그리고 window.FB_CONFIG에 네 Firebase 설정을 주입하거나,
   아래 firebaseConfig에 직접 채워넣어도 됨.
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

document.addEventListener("DOMContentLoaded", () => {
  /* =========================
   * 0) Firebase 초기화
   * ========================= */
  const firebaseConfig = (window.FB_CONFIG ?? {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
  });

  const app = initializeApp(firebaseConfig);
  const db  = getDatabase(app);

  /* =========================
   * 1) 공지 마퀴: Firebase /notice 실시간
   *    - 줄바꿈 방지(모바일 1줄 강제)
   *    - 새로고침/호버멈춤 없음
   * ========================= */
  const noticeTrack = document.getElementById("noticeTrack");
  const noticeBar   = document.getElementById("noticeBar");

  // 모바일/전체 공통: 1줄 강제 세팅 (혹시 CSS 누락 대비)
  if (noticeTrack) {
    noticeTrack.style.whiteSpace   = "nowrap";
    noticeTrack.style.overflow     = "hidden";
    noticeTrack.style.display      = "block";
  }
  if (noticeBar) {
    noticeBar.style.overflow = "hidden";
  }

  function renderNotice(text) {
    const clean = (text ?? "").toString().trim().replace(/\s+/g, " ");
    if (!noticeTrack) return;
    noticeTrack.textContent = clean ? (clean + "   •   " + clean) : "공지 없음";
  }
  // 전역에서 재사용 가능하도록도 노출
  window.renderNotice = renderNotice;

  // 실시간 구독
  const noticeRef = ref(db, "/notice");
  onValue(
    noticeRef,
    (snap) => {
      const val = snap.val();
      const text = (val && typeof val === "object")
        ? (val.message ?? JSON.stringify(val))
        : (val ?? "");
      renderNotice(text);
    },
    (err) => {
      console.error("공지 구독 오류:", err);
      renderNotice("공지 로드 실패");
    }
  );

  /* =========================
   * 2) 병동 캐시 + 오늘 날짜 기본값
   * ========================= */
  const SAVED_WARD_KEY = "linen_last_ward";

  const $ward = $("#wardDropdown");
  const savedWard = localStorage.getItem(SAVED_WARD_KEY);
  if (savedWard && $('#wardDropdown option[value="' + savedWard + '"]').length) {
    $ward.val(savedWard);
  }
  $ward.off("change.saveWard").on("change.saveWard", function () {
    localStorage.setItem(SAVED_WARD_KEY, $(this).val() || "");
  });

  function getTodayYYYYMMDD() {
    const d = new Date();
    const y = d.getFullYear();
    const m = ("0" + (d.getMonth() + 1)).slice(-2);
    const day = ("0" + d.getDate()).slice(-2);
    return `${y}-${m}-${day}`;
  }
  if (!$("#requestDate").val()) {
    $("#requestDate").val(getTodayYYYYMMDD()).trigger("change");
  }

  /* =========================
   * 3) 헤더 클릭: 초기화 & 시트 탭으로
   * ========================= */
  $("h1").off("click.headerReset").on("click.headerReset", function () {
    $(".tab").removeClass("active").css("background-color", "");
    $(".tab[data-tab='sheet']").addClass("active").css("background-color", "#4CAF50");
    $(".form-section").removeClass("active");
    $("#sheet").addClass("active");

    // 입력값 초기화
    $('input[type="number"]').val("");
    $("#wardDropdown").val("");
    $("#requestDate").val("").trigger("change");
  });

  /* =========================
   * 4) 탭 전환 (비활성 탭 무시)
   * ========================= */
  $("[data-tab='normal'], [data-tab='ortho'], [data-tab='uniform']").addClass("disabled");

  $(".tab").off("click.tabs").on("click.tabs", function () {
    if ($(this).hasClass("disabled")) return;
    const tabId = $(this).attr("data-tab");

    $(".tab").removeClass("active").css("background-color", "");
    $(this).addClass("active").css("background-color", "#4CAF50");

    $(".form-section").removeClass("active");
    $("#" + tabId).addClass("active");
  });

  /* =========================
   * 5) 카메라/미리보기 (압축 업로드)
   * ========================= */
  $("#cameraButton").off("click.camera").on("click.camera", function () {
    $("#inventoryPhoto").click();
  });

  $("#inventoryPhoto").off("change.preview").on("change.preview", function (event) {
    const file = event.target?.files?.[0];
    if (!file) return;

    const maxWidth  = 1024;
    const maxHeight = 1024;
    const quality   = 0.7;

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement("canvas");
        const ctx    = canvas.getContext("2d");

        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width  = width  * ratio;
          height = height * ratio;
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
        $("#preview").attr("src", compressedDataUrl).show();

        canvas.toBlob(function (blob) {
          const compressedFile = new File([blob], file.name, {
            type: "image/jpeg",
            lastModified: Date.now()
          });
          const dt = new DataTransfer();
          dt.items.add(compressedFile);
          $("#inventoryPhoto")[0].files = dt.files;
        }, "image/jpeg", quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  /* =========================
   * 6) 폼 제출 (유효성 검사 + TG 전송)
   * ========================= */
  function highlightInvalid($el) {
    $el.addClass("invalid");
    $el[0]?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    try { $el.focus(); } catch (e) {}
    setTimeout(() => $el.removeClass("invalid"), 1500);
  }

  $("#linenRequestForm").off("submit.submitLinen").on("submit.submitLinen", function (event) {
    event.preventDefault();

    const wardValue   = (String($("#wardDropdown").val() || "")).trim();
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
    collect("sheet",   "시트/기타");
    collect("normal",  "일반환의");
    collect("ortho",   "정형환의");
    collect("uniform", "근무복");

    const chatId = "5432510881";
    const token  = "6253877113:AAEyEqwqf5m0A5YB5Ag6vpez3ceCfIasKj0";

    if (photoFile) {
      const url1 = "https://api.telegram.org/bot" + token + "/sendPhoto";
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
          if (saved && $('#wardDropdown option[value="' + saved + '"]').length) {
            $('#wardDropdown').val(saved);
          }
        })
        .catch(err => {
          console.error("TG sendPhoto error:", err);
          alert("전송 오류: " + err.message);
        })
        .finally(() => {
          $("#submitBtn").prop("disabled", false);
          $("#statusMessage").fadeOut();
        });

    } else {
      const url2 = "https://api.telegram.org/bot" + token + "/sendMessage";
      const payload = JSON.stringify({
        chat_id: chatId,
        parse_mode: "HTML",
        text: message
      });

      fetch(url2, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload
      })
        .then(r => r.json())
        .then(data => {
          if (!data.ok) throw new Error(data.description || "전송 실패");
          playNotificationSound();
          alert("요청이 성공적으로 전송되었습니다.");
          $("#linenRequestForm")[0].reset();
          $("#requestDate").val(getTodayYYYYMMDD()).trigger("change");
          const saved = localStorage.getItem(SAVED_WARD_KEY);
          if (saved && $('#wardDropdown option[value="' + saved + '"]').length) {
            $('#wardDropdown').val(saved);
          }
        })
        .catch(err => {
          console.error("TG sendMessage error:", err);
          alert("전송 오류: " + err.message);
        })
        .finally(() => {
          $("#submitBtn").prop("disabled", false);
          $("#statusMessage").fadeOut();
        });
    }
  });

  /* =========================
   * 7) 관리자 링크 (비번: "9")
   * ========================= */
  $("#adminPageLink").off("click.adminLink").on("click.adminLink", function (e) {
    e.preventDefault();
    const password = prompt("관리자 페이지 암호를 입력하세요.");
    if (password === "9") {
      window.location.href = "admin.html";
    } else {
      alert("암호가 일치하지 않습니다.");
    }
  });

  /* =========================
   * 8) 날짜 placeholder 동기화
   * ========================= */
  const dateInput       = document.getElementById("requestDate");
  const datePlaceholder = document.querySelector(".date-placeholder");
  function syncDatePlaceholder() {
    if (!dateInput || !datePlaceholder) return;
    datePlaceholder.style.display = dateInput.value ? "none" : "block";
  }
  dateInput?.addEventListener("input",  syncDatePlaceholder);
  dateInput?.addEventListener("change", syncDatePlaceholder);
  syncDatePlaceholder();

  if ($.fn && $.fn.datepicker) {
    $("#requestDate").datepicker({
      dateFormat: "yy-mm-dd",
      onSelect: function () { syncDatePlaceholder(); },
    });
  }

  /* =========================
   * 9) 알림음
   * ========================= */
  function playNotificationSound() {
    const audio = document.getElementById("notificationSound");
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
});
