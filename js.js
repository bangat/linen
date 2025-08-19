$(document).ready(function () {
  /* =========================
   * 1) 헤더 클릭: 초기화 & 시트 탭으로
   * ========================= */
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

    const NOTICE_URL =
      "https://raw.githubusercontent.com/bangat/hallymlinen/main/%EA%B3%B5%EC%A7%80%EC%82%AC%ED%95%AD.txt"; // 공지 텍스트 파일
    const GITHUB_EDIT_URL =
      "https://github.com/bangat/hallymlinen/edit/main/%EA%B3%B5%EC%A7%80%EC%82%AC%ED%95%AD.txt"; // 모바일에서 바로 수정

    function setNotice(text) {
      const clean = (text || "").trim().replace(/\s+/g, " ");
      const track = document.getElementById("noticeTrack");
      if (!track) return;
      track.textContent = clean ? `${clean}   •   ${clean}` : "공지 없음";
    }

    async function fetchNotice() {
      try {
        const res = await fetch(`${NOTICE_URL}?t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) throw new Error("fail");
        const txt = await res.text();
        setNotice(txt);
      } catch (e) {
        setNotice("공지 로드 실패");
      }
    }

    $("#noticeRefreshBtn").off("click.notice").on("click.notice", fetchNotice);
    fetchNotice();
    setInterval(fetchNotice, 10 * 60 * 1000);

    // (선택) 관리자면 편집 버튼 노출
    window.enableNoticeEdit = function () {
      if ($("#noticeEditBtn").length) return;
      $(".notice-actions").append(
        $("<button type='button' id='noticeEditBtn'>공지 수정</button>").on("click", () =>
          window.open(GITHUB_EDIT_URL, "_blank")
        )
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
      const tabId = $(this).attr("data-tab");

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
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
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
    $el[0]?.scrollIntoView({ behavior: "smooth", block: "center" });
    $el.focus();
    setTimeout(() => $el.removeClass("invalid"), 1500);
  }

  $("#linenRequestForm")
    .off("submit.submitLinen")
    .on("submit.submitLinen", function (event) {
      event.preventDefault();

      const wardValue = $("#wardDropdown").val()?.trim() || "";
      const requestDate = $("#requestDate").val();
      const photoFile = $("#inventoryPhoto")[0].files[0];

      // 유효성 검사 (순서/스코프 수정)
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

      let message = `병동명 : ${wardValue}\n`;
      message += `입고날짜 : ${requestDate}\n\n`;

      let sheetItems = "";
      $("#sheet input[type='number']").each(function () {
        const itemName = $(this).closest("tr").find("td:first").text().trim();
        const itemCount = $(this).val();
        if (itemCount > 0) {
          sheetItems += `${itemName} ${itemCount}장\n`;
        }
      });
      if (sheetItems) {
        message += `[시트/기타]\n${sheetItems}\n`;
      }

      let normalItems = "";
      $("#normal input[type='number']").each(function () {
        const itemName = $(this).closest("tr").find("td:first").text().trim();
        const itemCount = $(this).val();
        if (itemCount > 0) {
          normalItems += `${itemName} ${itemCount}장\n`;
        }
      });
      if (normalItems) {
        message += `[일반환의]\n${normalItems}\n`;
      }

      let orthoItems = "";
      $("#ortho input[type='number']").each(function () {
        const itemName = $(this).closest("tr").find("td:first").text().trim();
        const itemCount = $(this).val();
        if (itemCount > 0) {
          orthoItems += `${itemName} ${itemCount}장\n`;
        }
      });
      if (orthoItems) {
        message += `[정형환의]\n${orthoItems}\n`;
      }

      let uniformItems = "";
      $("#uniform input[type='number']").each(function () {
        const itemName = $(this).closest("tr").find("td:first").text().trim();
        const itemCount = $(this).val();
        if (itemCount > 0) {
          uniformItems += `${itemName} ${itemCount}장\n`;
        }
      });
      if (uniformItems) {
        message += `[근무복]\n${uniformItems}\n`;
      }

      const chatId = "5432510881"; // 텔레그램 채팅방 ID
      const token = "6253877113:AAEyEqwqf5m0A5YB5Ag6vpez3ceCfIasKj0";
      let url;
      let formData;

      if (photoFile) {
        // 사진 파일 첨부
        url = `https://api.telegram.org/bot${token}/sendPhoto`;
        formData = new FormData();
        formData.append("chat_id", chatId);
        formData.append("photo", photoFile);
        formData.append("caption", message);

        fetch(url, { method: "POST", body: formData })
          .then((r) => r.json())
          .then((data) => {
            if (data.ok) {
              playNotificationSound();
              alert("요청이 성공적으로 전송되었습니다.");
              $("#linenRequestForm")[0].reset();
              $("#preview").attr("src", "#").hide();
              // 날짜 라벨 동기화
              $("#requestDate").trigger("change");
            } else {
              throw new Error("전송 실패");
            }
          })
          .catch((err) => {
            console.error("Error:", err);
            alert("요청을 전송하는 도중 오류가 발생했습니다.");
          })
          .finally(() => {
            $("#submitBtn").prop("disabled", false);
            $("#statusMessage").fadeOut();
          });
      } else {
        // 텍스트만
        url = `https://api.telegram.org/bot${token}/sendMessage`;
        formData = JSON.stringify({
          chat_id: chatId,
          parse_mode: "HTML",
          text: message,
        });

        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: formData,
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.ok) {
              playNotificationSound();
              alert("요청이 성공적으로 전송되었습니다.");
              $("#linenRequestForm")[0].reset();
              // 날짜 라벨 동기화
              $("#requestDate").trigger("change");
            } else {
              throw new Error("전송 실패");
            }
          })
          .catch((err) => {
            console.error("Error:", err);
            alert("요청을 전송하는 도중 오류가 발생했습니다.");
          })
          .finally(() => {
            $("#submitBtn").prop("disabled", false);
            $("#statusMessage").fadeOut();
          });
      }
    });

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
        // 필요 시: enableNoticeEdit();  // 공지 수정 버튼 노출(메인에서 바로 편집 원하면)
      } else {
        alert("암호가 일치하지 않습니다.");
      }
    });

  /* =========================
   * 8) 날짜 라벨 겹침 해결 (네이티브 date용)
   * ========================= */
  const dateInput = document.getElementById("requestDate");
  const datePlaceholder = document.querySelector(".date-placeholder");

  function syncDatePlaceholder() {
    if (dateInput.value) {
      datePlaceholder.style.display = "none";
    } else {
      datePlaceholder.style.display = "block";
    }
  }
  dateInput.addEventListener("input", syncDatePlaceholder);
  dateInput.addEventListener("change", syncDatePlaceholder);
  // 초기 동기화
  syncDatePlaceholder();

  // 선택적으로 jQuery UI datepicker가 있을 때만 초기화(없으면 네이티브 유지)
  if ($.fn && $.fn.datepicker) {
    $("#requestDate").datepicker({
      dateFormat: "yy-mm-dd",
      onSelect: function () {
        syncDatePlaceholder();
      },
    });
  }

  /* =========================
   * 9) 알림음 재생 함수
   * ========================= */
  function playNotificationSound() {
    const audio = document.getElementById("notificationSound");
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }
});
