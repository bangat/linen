/*******************************************************
 * 린넨실 요청서 - 클라이언트 스크립트 (js.js)
 * - 공지(공지사항) 처리: index.html의 RTDB 스크립트가 담당
 * - 본 파일은 UI/폼/전송 로직만 포함
 *******************************************************/

$(document).ready(function () {
  /* =========================
   * 0) 테이블 자동 생성
   * ========================= */
  const sheetItems = [
    { name: "대 시 트", key: "대시트_요청수량" },
    { name: "반 시 트", key: "반시트_요청수량" },
    { name: "베 갯 잇", key: "베갯잇_요청수량" },
    { name: "중 환 의", key: "중환의_요청수량" },
    { name: "이 불",   key: "이불_요청수량" },
    { name: "얼음주머니", key: "얼음포_요청수량" },
    { name: "억 제 대", key: "억제대_요청수량" },
    { name: "수 건",   key: "수건_요청수량" },
    { name: "검진복(하의)", key: "하의_요청수량" },
  ];
  const requiredSizes = ["3XL", "2XL", "XL", "L"];
  const sizes = ["4XL", "3XL", "2XL", "XL", "L", "M", "S"];
  const types = ["상의", "하의"];

  function populateTable(sectionId, items) {
    const table = document.querySelector(`#${sectionId} table`);
    if (!table) return;
    items.forEach((item) => {
      const row = document.createElement("tr");
      const itemCell = document.createElement("td");
      itemCell.textContent = item.name;
      const inputCell = document.createElement("td");
      const input = document.createElement("input");
      input.type = "number";
      input.name = item.key;
      input.min = 0;
      inputCell.appendChild(input);
      row.appendChild(itemCell);
      row.appendChild(inputCell);
      table.appendChild(row);
    });
  }

  function generateClothingItems(sizeList, typeList) {
    return sizeList.flatMap((size) =>
      typeList.map((type) => ({
        name: `${size} ${type}`,
        key: `${size}_${type}_요청수량`,
      }))
    );
  }

  // 최초 1회 테이블 구성
  populateTable("sheet", sheetItems);
  populateTable("normal", generateClothingItems(sizes, types));
  populateTable("ortho",  generateClothingItems(sizes.slice(1), types)); // 3XL 이하
  populateTable("uniform",generateClothingItems(requiredSizes, types));

  /* =========================
   * 1) 병동 캐시 + 날짜 기본값
   * ========================= */
  var SAVED_WARD_KEY = 'linen_last_ward';
  var savedWard = null;
  try { savedWard = localStorage.getItem(SAVED_WARD_KEY); } catch(e){}

  if (savedWard && $('#wardDropdown option[value="' + savedWard + '"]').length) {
    $('#wardDropdown').val(savedWard);
  }

  $('#wardDropdown').off('change.saveWard').on('change.saveWard', function () {
    var v = $(this).val() || '';
    try { localStorage.setItem(SAVED_WARD_KEY, v); } catch(e){}
  });

  function getTodayYYYYMMDD() {
    var d = new Date();
    var y = d.getFullYear();
    var m = ('0' + (d.getMonth() + 1)).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    return y + '-' + m + '-' + day;
  }

  if (!$('#requestDate').val()) {
    $('#requestDate').val(getTodayYYYYMMDD()).trigger('change');
  }

  /* =========================
   * 2) 헤더 클릭: 시트 탭으로 초기화
   * ========================= */
  $("h1").off("click.headerReset").on("click.headerReset", function () {
    $(".tab").removeClass("active").css("background-color", "");
    $(".tab[data-tab='sheet']").addClass("active").css("background-color", "#4CAF50");
    $(".form-section").removeClass("active");
    $("#sheet").addClass("active");

    // 수량만 초기화
    $('input[type="number"]').val("");
    // 병동/날짜는 유지(원하면 아래 주석 해제)
    // $("#wardDropdown").val("");
    // $("#requestDate").val("").trigger("change");
  });

  /* =========================
   * 3) 탭 전환 (비활성 탭 무시)
   * ========================= */
  $("[data-tab='normal'], [data-tab='ortho'], [data-tab='uniform']").addClass("disabled");

  $(".tab")
    .off("click.tabs")
    .on("click.tabs", function () {
      if ($(this).hasClass("disabled")) return;
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
   * 6) 폼 제출 (유효성 검사 + 텔레그램 전송)
   * ========================= */
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

      var sheetOut = "";
      $("#sheet input[type='number']").each(function () {
        var itemName = $(this).closest("tr").find("td:first").text().trim();
        var itemCount = Number($(this).val());
        if (itemCount > 0) sheetOut += itemName + " " + itemCount + "장\n";
      });
      if (sheetOut) message += "[시트/기타]\n" + sheetOut + "\n";

      var normalOut = "";
      $("#normal input[type='number']").each(function () {
        var itemName = $(this).closest("tr").find("td:first").text().trim();
        var itemCount = Number($(this).val());
        if (itemCount > 0) normalOut += itemName + " " + itemCount + "장\n";
      });
      if (normalOut) message += "[일반환의]\n" + normalOut + "\n";

      var orthoOut = "";
      $("#ortho input[type='number']").each(function () {
        var itemName = $(this).closest("tr").find("td:first").text().trim();
        var itemCount = Number($(this).val()); // ← 여분 괄호 제거
        if (itemCount > 0) orthoOut += itemName + " " + itemCount + "장\n";
      });
      if (orthoOut) message += "[정형환의]\n" + orthoOut + "\n";

      var uniformOut = "";
      $("#uniform input[type='number']").each(function () {
        var itemName = $(this).closest("tr").find("td:first").text().trim();
        var itemCount = Number($(this).val()); // ← 여분 괄호 제거
        if (itemCount > 0) uniformOut += itemName + " " + itemCount + "장\n";
      });
      if (uniformOut) message += "[근무복]\n" + uniformOut + "\n";

      // ⛔ 공개 저장소/배포 환경에서는 토큰/아이디 노출 주의!
      var chatId = "5432510881";
      var token  = "6253877113:AAEyEqwqf5m0A5YB5Ag6vpez3ceCfIasKj0";

      if (photoFile) {
        var url1 = "https://api.telegram.org/bot" + token + "/sendPhoto";
        var fd = new FormData();
        fd.append("chat_id", chatId);
        fd.append("photo", photoFile, photoFile.name || "photo.jpg");
        fd.append("caption", message);

        fetch(url1, { method: "POST", body: fd })
          .then(function(r){ return r.json(); })
          .then(function(data){
            if (!data.ok) throw new Error(data.description || "전송 실패");
            playNotificationSound();
            alert("요청이 성공적으로 전송되었습니다.");
            $("#linenRequestForm")[0].reset();
            // reset 후 오늘 날짜 재세팅 + 라벨 동기화
            $('#requestDate').val(getTodayYYYYMMDD());
            syncDatePlaceholder();
            $("#preview").attr("src", "#").hide();
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
            if (!data.ok) throw new Error(data.description || "전송 실패");
            playNotificationSound();
            alert("요청이 성공적으로 전송되었습니다.");
            $("#linenRequestForm")[0].reset();
            // reset 후 오늘 날짜 재세팅 + 라벨 동기화
            $('#requestDate').val(getTodayYYYYMMDD());
            syncDatePlaceholder();
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
    });

  /* =========================
   * 7) 관리자 페이지 링크
   * ========================= */
  $("#adminPageLink")
    .off("click.adminLink")
    .on("click.adminLink", function (e) {
      e.preventDefault();
      var password = prompt("관리자 페이지 암호를 입력하세요.");
      if (password === "9") {
        window.location.href = "admin.html";
      } else {
        alert("암호가 일치하지 않습니다.");
      }
    });

  /* =========================
   * 8) 날짜 라벨 겹침 해결
   * ========================= */
  var dateInput = document.getElementById("requestDate");
  var datePlaceholder = document.querySelector(".date-placeholder");

  function syncDatePlaceholder() {
    if (!dateInput || !datePlaceholder) return;
    if (dateInput.value) {
      datePlaceholder.style.display = "none";
    } else {
      datePlaceholder.style.display = "block";
    }
  }
  if (dateInput) {
    dateInput.addEventListener("input", syncDatePlaceholder);
    dateInput.addEventListener("change", syncDatePlaceholder);
    // 라벨 클릭 시 포커스
    if (datePlaceholder) {
      datePlaceholder.addEventListener("click", function(){ dateInput.focus(); });
    }
  }
  // 초기 동기화
  syncDatePlaceholder();

  // (선택) jQuery UI datepicker 호환
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
    var audio = document.getElementById("notificationSound");
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(function(){});
  }
});