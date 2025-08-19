$(document).ready(function () {
  /* =========================
   * 1) 헤더 클릭: 초기화 & 시트 탭으로
   * ========================= */

  // === 병동 캐시 ===
var SAVED_WARD_KEY = 'linen_last_ward';
var savedWard = localStorage.getItem(SAVED_WARD_KEY);

// 저장된 병동이 실제 옵션에 있으면 세팅
if (savedWard && $('#wardDropdown option[value="' + savedWard + '"]').length) {
  $('#wardDropdown').val(savedWard);
}

// 변경 시마다 저장
$('#wardDropdown').off('change.saveWard').on('change.saveWard', function () {
  var v = $(this).val() || '';
  localStorage.setItem(SAVED_WARD_KEY, v);
});

  // === 오늘 날짜 기본값 ===
function getTodayYYYYMMDD() {
  var d = new Date();
  var y = d.getFullYear();
  var m = ('0' + (d.getMonth() + 1)).slice(-2);
  var day = ('0' + d.getDate()).slice(-2);
  return y + '-' + m + '-' + day;
}

var todayStr = getTodayYYYYMMDD();
if (!$('#requestDate').val()) {
  $('#requestDate').val(todayStr).trigger('change'); // 라벨 숨김 동기화
}



  
  $("h1").off("click.headerReset").on("click.headerReset", function () {
    $(".tab").removeClass("active").css("background-color", "");
    $(".tab[data-tab='sheet']").addClass("active").css("background-color", "#4CAF50");
    $(".form-section").removeClass("active");
    $("#sheet").addClass("active");

    // 입력값 초기화
    $('input[type="number"]').val("");
    $("#wardDropdown").val("");
    $("#requestDate").val("").trigger("change"); // 날짜 라벨 동기화
  });

  /* =========================
   * 2) 공지사항 마퀴 (중복 초기화 방지)
   * ========================= */
  if (!window.__noticeInit) {
    window.__noticeInit = true;

    var NOTICE_URL =
      "https://raw.githubusercontent.com/bangat/hallymlinen/main/%EA%B3%B5%EC%A7%80%EC%82%AC%ED%95%AD.txt"; // 공지 텍스트 파일
    var GITHUB_EDIT_URL =
      "https://github.com/bangat/hallymlinen/edit/main/%EA%B3%B5%EC%A7%80%EC%82%AC%ED%95%AD.txt"; // 모바일에서 바로 수정

    function setNotice(text) {
      var clean = (text || "").trim().replace(/\s+/g, " ");
      var track = document.getElementById("noticeTrack");
      if (!track) return;
      track.textContent = clean ? (clean + "   •   " + clean) : "공지 없음";
    }

    function fetchNotice() {
      fetch(NOTICE_URL + "?t=" + Date.now(), { cache: "no-store" })
        .then(function(res){
          if (!res.ok) throw new Error("fail");
          return res.text();
        })
        .then(function(txt){ setNotice(txt); })
        .catch(function(){ setNotice("공지 로드 실패"); });
    }

    $("#noticeRefreshBtn").off("click.notice").on("click.notice", fetchNotice);
    fetchNotice();
    setInterval(fetchNotice, 10 * 60 * 1000);

    // (선택) 관리자면 편집 버튼 노출
    window.enableNoticeEdit = function () {
      if ($("#noticeEditBtn").length) return;
      $(".notice-actions").append(
        $("<button type='button' id='noticeEditBtn'>공지 수정</button>").on("click", function () {
          window.open(GITHUB_EDIT_URL, "_blank");
        })
      );
    };
  }

  /* =========================
   * 3) 탭 전환 (비활성 탭 무시)
   * ========================= */
  // 비활성 탭 지정 (요청대로)
  $("[data-tab='normal'], [data-tab='ortho'], [data-tab='uniform']").addClass("disabled");

  $(".tab")
    .off("click.tabs")
    .on("click.tabs", function () {
      if ($(this).hasClass("disabled")) return; // 비활성 탭 클릭 무시
      var tabId = $(this).attr("data-tab");

      $(".tab").removeClass("active").css("background-color", "");
      $(this).addClass("active").css("background-color", "#4CAF50");

      $(".form-section").removeClass("active");
      $("#" + tabId).addClass("active");
    });

  /* =========================
   * 4) 카메라/미리보기
   * ========================= */
  $("#cameraButton")
    .off("click.camera")
    .on("click.camera", function () {
      $("#inventoryPhoto").click();
    });

  $("#inventoryPhoto")
    .off("change.preview")
    .on("change.preview", function (event) {
      var file = event.target && event.target.files && event.target.files[0];
      if (!file) return;
      // 네 환경에서 잘 되던 FileReader 유지
      var reader = new FileReader();
      reader.onload = function (e) {
        $("#preview").attr("src", e.target.result).show();
      };
      reader.readAsDataURL(file);
    });

  /* =========================
   * 5) 메뉴 토글
   * ========================= */
  $("#menuBar")
    .off("click.menu")
    .on("click.menu", function () {
      $("#dropdownMenu").toggle();
    });

  /* =========================
   * 6) 폼 제출 (유효성 검사 + 전송)
   * ========================= */
  // 시각 강조 도우미
  function highlightInvalid($el) {
    $el.addClass("invalid");
    if ($el[0] && $el[0].scrollIntoView) {
      $el[0].scrollIntoView({ behavior: "smooth", block: "center" });
    }
    try { $el.focus(); } catch(e) {}
    setTimeout(function(){ $el.removeClass("invalid"); }, 1500);
  }

  $("#linenRequestForm")
    .off("submit.submitLinen")
    .on("submit.submitLinen", function (event) {
      event.preventDefault();

      var wardValRaw = $("#wardDropdown").val();
      var wardValue = (wardValRaw ? String(wardValRaw) : "").trim();
      var requestDate = $("#requestDate").val();
      var photoFile = ($("#inventoryPhoto")[0] && $("#inventoryPhoto")[0].files && $("#inventoryPhoto")[0].files[0]) || null;

      // 유효성 검사
      if (!wardValue) {
        alert("병동을 선택해주세요.");
        highlightInvalid($("#wardDropdown"));
        return;
      }
      if (!requestDate) {
        alert("입고 날짜를 선택해주세요.");
        highlightInvalid($("#requestDate"));
        return;
      }

      $("#submitBtn").prop("disabled", true);
      $("#statusMessage").fadeIn();

      var message = "병동명 : " + wardValue + "\n";
      message += "입고날짜 : " + requestDate + "\n\n";

      var sheetItems = "";
      $("#sheet input[type='number']").each(function () {
        var itemName = $(this).closest("tr").find("td:first").text().trim();
        var itemCount = $(this).val();
        if (itemCount > 0) sheetItems += itemName + " " + itemCount + "장\n";
      });
      if (sheetItems) message += "[시트/기타]\n" + sheetItems + "\n";

      var normalItems = "";
      $("#normal input[type='number']").each(function () {
        var itemName = $(this).closest("tr").find("td:first").text().trim();
        var itemCount = $(this).val();
        if (itemCount > 0) normalItems += itemName + " " + itemCount + "장\n";
      });
      if (normalItems) message += "[일반환의]\n" + normalItems + "\n";

      var orthoItems = "";
      $("#ortho input[type='number']").each(function () {
        var itemName = $(this).closest("tr").find("td:first").text().trim();
        var itemCount = $(this).val();
        if (itemCount > 0) orthoItems += itemName + " " + itemCount + "장\n";
      });
      if (orthoItems) message += "[정형환의]\n" + orthoItems + "\n";

      var uniformItems = "";
      $("#uniform input[type='number']").each(function () {
        var itemName = $(this).closest("tr").find("td:first").text().trim();
        var itemCount = $(this).val();
        if (itemCount > 0) uniformItems += itemName + " " + itemCount + "장\n";
      });
      if (uniformItems) message += "[근무복]\n" + uniformItems + "\n";

      var chatId = "5432510881";
      var token  = "6253877113:AAEyEqwqf5m0A5YB5Ag6vpez3ceCfIasKj0";

      if (photoFile) {
        // 사진 + 캡션 전송 (원래 쓰던 방식)
        var url1 = "https://api.telegram.org/bot" + token + "/sendPhoto";
        var fd = new FormData();
        fd.append("chat_id", chatId);
        // 파일명 명시(안전)
        fd.append("photo", photoFile, photoFile.name || "photo.jpg");
        fd.append("caption", message);

        fetch(url1, { method: "POST", body: fd })
          .then(function(r){ return r.json(); })
          .then(function(data){
            console.log("TG sendPhoto:", data);
            if (!data.ok) throw new Error(data.description || "전송 실패");
            playNotificationSound();
            alert("요청이 성공적으로 전송되었습니다.");
            $("#linenRequestForm")[0].reset();
            $("#preview").attr("src", "#").hide();
            $("#requestDate").trigger("change");
          })
          .catch(function(err){
            console.error("TG sendPhoto error:", err);
            alert("전송 오류: " + err.message);
          })
          .finally(function(){
            $("#submitBtn").prop("disabled", false);
            $("#statusMessage").fadeOut();
          });

      } else {
        // 텍스트만 전송 (원래 쓰던 JSON 방식 유지)
        var url2 = "https://api.telegram.org/bot" + token + "/sendMessage";
        var payload = JSON.stringify({
          chat_id: chatId,
          parse_mode: "HTML",
          text: message
        });

        fetch(url2, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload
        })
          .then(function(r){ return r.json(); })
          .then(function(data){
            console.log("TG sendMessage:", data);
            if (!data.ok) throw new Error(data.description || "전송 실패");
            playNotificationSound();
            alert("요청이 성공적으로 전송되었습니다.");
            $("#linenRequestForm")[0].reset();
            $("#requestDate").trigger("change");
          })
          .catch(function(err){
            console.error("TG sendMessage error:", err);
            alert("전송 오류: " + err.message);
          })
          .finally(function(){
            $("#submitBtn").prop("disabled", false);
            $("#statusMessage").fadeOut();
          });
      }
    }); // ←★★ submit 핸들러 닫기 (중요)

  /* =========================
   * 7) 관리자 페이지 링크 처리
   * ========================= */
  $("#adminPageLink")
    .off("click.adminLink")
    .on("click.adminLink", function (e) {
      e.preventDefault();
      var password = prompt("관리자 페이지 암호를 입력하세요.");
      if (password === "9") {
        window.location.href = "admin.html";
        // enableNoticeEdit(); // 원하면 공지 수정 버튼 노출
      } else {
        alert("암호가 일치하지 않습니다.");
      }
    });

  /* =========================
   * 8) 날짜 라벨 겹침 해결 (네이티브 date용)
   * ========================= */
  var dateInput = document.getElementById("requestDate");
  var datePlaceholder = document.querySelector(".date-placeholder");

  function syncDatePlaceholder() {
    if (dateInput && dateInput.value) {
      datePlaceholder.style.display = "none";
    } else {
      datePlaceholder.style.display = "block";
    }
  }
  if (dateInput) {
    dateInput.addEventListener("input", syncDatePlaceholder);
    dateInput.addEventListener("change", syncDatePlaceholder);
  }
  syncDatePlaceholder();

  if ($.fn && $.fn.datepicker) {
    $("#requestDate").datepicker({
      dateFormat: "yy-mm-dd",
      onSelect: function () { syncDatePlaceholder(); },
    });
  }

  /* =========================
   * 9) 알림음 재생 함수
   * ========================= */
  function playNotificationSound() {
    var audio = document.getElementById("notificationSound");
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(function(){});
  }
}); // ←★★ document.ready 닫기
