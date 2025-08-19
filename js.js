$(document).ready(function () {
  /* ========== 공통 ========== */
  var SAVED_WARD_KEY = 'linen_last_ward';
  function getTodayYYYYMMDD() {
    var d = new Date();
    var y = d.getFullYear();
    var m = ('0' + (d.getMonth() + 1)).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    return y + '-' + m + '-' + day;
  }

  /* ========== 1) 병동 캐시 & 오늘 날짜 자동 ========== */
  // 병동 복원
  var savedWard = localStorage.getItem(SAVED_WARD_KEY);
  if (savedWard && $('#wardDropdown option[value="' + savedWard + '"]').length) {
    $('#wardDropdown').val(savedWard);
  }
  // 변경 시 저장
  $('#wardDropdown').off('change.saveWard').on('change.saveWard', function () {
    localStorage.setItem(SAVED_WARD_KEY, $(this).val() || '');
  });
  // 날짜 기본값 (비어있으면 오늘)
  if (!$('#requestDate').val()) {
    $('#requestDate').val(getTodayYYYYMMDD()).trigger('change');
  }

  /* ========== 2) 공지(Firebase RTDB) ========== */
  // GitHub 읽기 → Firebase로 복구
  // 데이터 구조 예: { "text": "공지내용", "updatedAt": 1699999999999 }
  var NOTICE_URL = "https://hallymlinen-default-rtdb.firebaseio.com/notice.json";

  function setNotice(text) {
    var clean = (text || "").trim().replace(/\s+/g, " ");
    var track = document.getElementById("noticeTrack");
    if (!track) return;
    // 끊김 없는 마퀴 느낌: 텍스트 반복
    track.textContent = clean ? (clean + "   •   " + clean) : "공지 없음";
  }

  function fetchNotice() {
    fetch(NOTICE_URL + "?t=" + Date.now(), { cache: "no-store" })
      .then(function(res){ if(!res.ok) throw new Error('fail'); return res.json(); })
      .then(function(data){
        var txt = (data && typeof data === "object") ? (data.text || "") : (data || "");
        setNotice(txt);
      })
      .catch(function(){ setNotice("공지 로드 실패"); });
  }

  // 새로고침 버튼/일시정지 없음 → 자동 폴링만
  fetchNotice();
  setInterval(fetchNotice, 10 * 60 * 1000);

  /* ========== 3) 탭 (비활성 무시) ========== */
  $("[data-tab='normal'], [data-tab='ortho'], [data-tab='uniform']").addClass("disabled");
  $(".tab").off("click.tabs").on("click.tabs", function () {
    if ($(this).hasClass("disabled")) return;
    var tabId = $(this).attr("data-tab");
    $(".tab").removeClass("active").css("background-color", "");
    $(this).addClass("active").css("background-color", "#4CAF50");
    $(".form-section").removeClass("active");
    $("#" + tabId).addClass("active");
  });

  /* ========== 4) 카메라/미리보기(압축) ========== */
  $("#cameraButton").off("click.camera").on("click.camera", function () {
    $("#inventoryPhoto").click();
  });

  $("#inventoryPhoto").off("change.preview").on("change.preview", function (event) {
    var file = event.target && event.target.files && event.target.files[0];
    if (!file) return;

    var maxWidth = 1024, maxHeight = 1024, quality = 0.7;
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function() {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        var width = img.width, height = img.height;

        if (width > maxWidth || height > maxHeight) {
          var ratio = Math.min(maxWidth / width, maxHeight / height);
          width = width * ratio; height = height * ratio;
        }
        canvas.width = width; canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        var compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        $("#preview").attr("src", compressedDataUrl).show();

        canvas.toBlob(function(blob) {
          var compressedFile = new File([blob], file.name, {
            type: 'image/jpeg', lastModified: Date.now()
          });
          var dt = new DataTransfer();
          dt.items.add(compressedFile);
          $("#inventoryPhoto")[0].files = dt.files;
        }, 'image/jpeg', quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  /* ========== 5) (삭제됨) 메뉴 토글 관련 코드 제거 ========== */
  // #menuBar / #dropdownMenu DOM 자체가 없음 → 바인딩도 제거

  /* ========== 6) 제출(유효성 검사 + TG 전송) ========== */
  function highlightInvalid($el) {
    $el.addClass("invalid");
    if ($el[0] && $el[0].scrollIntoView) $el[0].scrollIntoView({ behavior: "smooth", block: "center" });
    try { $el.focus(); } catch(e) {}
    setTimeout(function(){ $el.removeClass("invalid"); }, 1500);
  }

  $("#linenRequestForm").off("submit.submitLinen").on("submit.submitLinen", function (event) {
    event.preventDefault();

    var wardValRaw = $("#wardDropdown").val();
    var wardValue = (wardValRaw ? String(wardValRaw) : "").trim();
    var requestDate = $("#requestDate").val();
    var photoFile = ($("#inventoryPhoto")[0] && $("#inventoryPhoto")[0].files && $("#inventoryPhoto")[0].files[0]) || null;

    if (!wardValue) { alert("병동을 선택해주세요."); highlightInvalid($("#wardDropdown")); return; }
    if (!requestDate) { alert("입고 날짜를 선택해주세요."); highlightInvalid($("#requestDate")); return; }

    $("#submitBtn").prop("disabled", true);
    $("#statusMessage").fadeIn();

    var message = "병동명 : " + wardValue + "\n";
    message += "입고날짜 : " + requestDate + "\n\n";

    function collectItems(sectionId, title) {
      var buf = "";
      $(sectionId + " input[type='number']").each(function(){
        var name = $(this).closest("tr").find("td:first").text().trim();
        var cnt = $(this).val();
        if (cnt > 0) buf += name + " " + cnt + "장\n";
      });
      return buf ? ("[" + title + "]\n" + buf + "\n") : "";
    }
    message += collectItems("#sheet", "시트/기타");
    message += collectItems("#normal", "일반환의");
    message += collectItems("#ortho", "정형환의");
    message += collectItems("#uniform", "근무복");

    var chatId = "5432510881";
    var token  = "6253877113:AAEyEqwqf5m0A5YB5Ag6vpez3ceCfIasKj0";

    if (photoFile) {
      var url1 = "https://api.telegram.org/bot" + token + "/sendPhoto";
      var fd = new FormData();
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
          $("#requestDate").val(getTodayYYYYMMDD()).trigger('change');
          var saved = localStorage.getItem(SAVED_WARD_KEY);
          if (saved && $('#wardDropdown option[value="' + saved + '"]').length) {
            $('#wardDropdown').val(saved);
          }
        })
        .catch(err => { alert("전송 오류: " + err.message); })
        .finally(() => { $("#submitBtn").prop("disabled", false); $("#statusMessage").fadeOut(); });

    } else {
      var url2 = "https://api.telegram.org/bot" + token + "/sendMessage";
      var payload = JSON.stringify({ chat_id: chatId, parse_mode: "HTML", text: message });

      fetch(url2, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload })
        .then(r => r.json())
        .then(data => {
          if (!data.ok) throw new Error(data.description || "전송 실패");
          playNotificationSound();
          alert("요청이 성공적으로 전송되었습니다.");
          $("#linenRequestForm")[0].reset();
          $("#requestDate").val(getTodayYYYYMMDD()).trigger('change');
          var saved = localStorage.getItem(SAVED_WARD_KEY);
          if (saved && $('#wardDropdown option[value="' + saved + '"]').length) {
            $('#wardDropdown').val(saved);
          }
        })
        .catch(err => { alert("전송 오류: " + err.message); })
        .finally(() => { $("#submitBtn").prop("disabled", false); $("#statusMessage").fadeOut(); });
    }
  });

  /* ========== 7) 날짜 라벨 네이티브 처리 ========== */
  var dateInput = document.getElementById("requestDate");
  var datePlaceholder = document.querySelector(".date-placeholder");
  function syncDatePlaceholder() {
    if (!dateInput || !datePlaceholder) return;
    datePlaceholder.style.display = dateInput.value ? "none" : "block";
  }
  if (dateInput) {
    dateInput.addEventListener("input", syncDatePlaceholder);
    dateInput.addEventListener("change", syncDatePlaceholder);
  }
  syncDatePlaceholder();

  /* ========== 8) 알림음 ========== */
  function playNotificationSound() {
    var audio = document.getElementById("notificationSound");
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(function(){});
  }
});
