$(document).ready(function() {
    // 린넨실 요청서 제목 클릭 시 초기 상태로 돌아가기
    $("h1").click(function() {
        $(".tab").removeClass("active");
        $(".tab[data-tab='sheet']").addClass("active");
        $(".form-section").removeClass("active");
        $("#sheet").addClass("active");
        $(".tab").css("background-color", ""); // 
        $(".tab[data-tab='sheet']").css("background-color", "#4CAF50"); // 시트/기타 탭 배경색 초록색으로 변경
    });

    const NOTICE_URL = 'https://raw.githubusercontent.com/bangat/hallymlinen/main/%EA%B3%B5%EC%A7%80%EC%82%AC%ED%95%AD.txt'; // 공지 텍스트 파일
  const GITHUB_EDIT_URL = 'https://github.com/bangat/hallymlinen/edit/main/%EA%B3%B5%EC%A7%80%EC%82%AC%ED%95%AD.txt'; // 모바일에서 바로 수정

  function setNotice(text){
    const clean = (text || '').trim().replace(/\s+/g,' ');
    const track = document.getElementById('noticeTrack');
    if (!track) return;
    track.textContent = clean ? (`${clean}   •   ${clean}`) : '공지 없음';
  }

  async function fetchNotice(){
    try{
      const res = await fetch(`${NOTICE_URL}?t=${Date.now()}`, {cache:'no-store'});
      if (!res.ok) throw new Error('fail');
      const txt = await res.text();
      setNotice(txt);
    }catch(e){
      setNotice('공지 로드 실패');
    }
  }

  // 새로고침 버튼
  $('#noticeRefreshBtn').on('click', fetchNotice);

  // 첫 로드 + 주기 갱신(10분)
  fetchNotice();
  setInterval(fetchNotice, 10 * 60 * 1000);

  // (선택) 관리자면 편집 버튼 노출
  window.enableNoticeEdit = function(){
    if ($('#noticeEditBtn').length) return;
    $('.notice-actions').append(
      $('<button type="button" id="noticeEditBtn">공지 수정</button>')
        .on('click', ()=> window.open(GITHUB_EDIT_URL, '_blank'))
    );
  };

  // 👉 관리자 인증 성공 시점에서 enableNoticeEdit() 호출해주면 됨
  // (아래 3)번 참고)

});
    
    // 탭 클릭 시 해당 섹션으로 이동
    $(".tab").click(function() {
        var tabId = $(this).attr("data-tab");
        $(".tab").removeClass("active");
        $(this).addClass("active");
        $(".form-section").removeClass("active");
        $("#" + tabId).addClass("active");
    
        // 모든 탭의 배경색 초기화 후 클릭한 탭의 배경색을 초록색으로 변경
        $(".tab").css("background-color", "");
        $(this).css("background-color", "#4CAF50");
    });
    
    // 카메라 버튼 클릭 시 파일 업로드 버튼 클릭
    $("#cameraButton").click(function() {
        $("#inventoryPhoto").click();
    });
    
    // 파일 업로드 시 미리보기 표시
    $("#inventoryPhoto").change(function(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
    
        reader.onload = function(e) {
            $("#preview").attr("src", e.target.result);
            $("#preview").show();
        };
    
        reader.readAsDataURL(file);
    });
    
    // 메뉴바 클릭 시 드롭다운 메뉴 토글
    $("#menuBar").click(function() {
        $("#dropdownMenu").toggle();
    });
    
    // 요청서 전송
    $("#linenRequestForm").submit(function(event) {

// (맨 위 도우미)
function highlightInvalid($el){
  $el.addClass('invalid');
  $el[0]?.scrollIntoView({behavior:'smooth', block:'center'});
  $el.focus();
  setTimeout(()=> $el.removeClass('invalid'), 1500);
}

// ... 당신의 submit 핸들러 안에서, 유효성 검사 부분을 이렇게 보강:
if (!wardValue) {
  alert('병동을 선택해주세요.');
  highlightInvalid($('#wardDropdown'));
  return;
}
if (!requestDate) {
  alert('입고 날짜를 선택해주세요.');
  highlightInvalid($('#requestDate'));
  return;
}


        event.preventDefault();
        
        const wardValue = $("#wardDropdown").val().trim(); // 드롭다운 메뉴에서 선택된 병동명 가져오기
        const requestDate = $("#requestDate").val();
        const photoFile = $("#inventoryPhoto")[0].files[0];
    
        if (!wardValue || !requestDate) {
            alert('병동명과 입고 날짜는 필수 입력 항목입니다.');
            return;
        }
    
        $("#submitBtn").prop('disabled', true); // 요청 버튼 비활성화
        $("#statusMessage").fadeIn(); // 요청 중 메시지 표시
    
        let message = `병동명 : ${wardValue}\n`;
        message += `입고날짜 : ${requestDate}\n\n`;
    
        let sheetItems = '';
        $("#sheet input[type='number']").each(function() {
            const itemName = $(this).closest('tr').find('td:first').text().trim(); // 품목명 가져오기
            const itemCount = $(this).val();
            if (itemCount > 0) {
                sheetItems += `${itemName} ${itemCount}장\n`;
            }
        });
        if (sheetItems) {
            message += `[시트/기타]\n${sheetItems}\n`;
        }
    
        let normalItems = '';
        $("#normal input[type='number']").each(function() {
            const itemName = $(this).closest('tr').find('td:first').text().trim(); // 품목명 가져오기
            const itemCount = $(this).val();
            if (itemCount > 0) {
                normalItems += `${itemName} ${itemCount}장\n`;
            }
        });
        if (normalItems) {
            message += `[일반환의]\n${normalItems}\n`;
        }
    
        let orthoItems = '';
        $("#ortho input[type='number']").each(function() {
            const itemName = $(this).closest('tr').find('td:first').text().trim(); // 품목명 가져오기
            const itemCount = $(this).val();
            if (itemCount > 0) {
                orthoItems += `${itemName} ${itemCount}장\n`;
            }
        });
        if (orthoItems) {
            message += `[정형환의]\n${orthoItems}\n`;
        }
    
        let uniformItems = '';
        $("#uniform input[type='number']").each(function() {
            const itemName = $(this).closest('tr').find('td:first').text().trim(); // 품목명 가져오기
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
            // 사진 파일이 첨부된 경우
            url = `https://api.telegram.org/bot${token}/sendPhoto`;
            formData = new FormData();
            formData.append('chat_id', chatId);
            formData.append('photo', photoFile);
            formData.append('caption', message);
    
            fetch(url, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.ok) {
                    playNotificationSound(); // 사운드 재생
                    alert('요청이 성공적으로 전송되었습니다.');
                    $("#linenRequestForm")[0].reset();
                    $("#preview").attr("src", "#");
                    $("#preview").hide();
                } else {
                    throw new Error('전송 실패');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('요청을 전송하는 도중 오류가 발생했습니다.');
            })
            .finally(() => {
                $("#submitBtn").prop('disabled', false); // 요청 버튼 활성화
                $("#statusMessage").fadeOut(); // 요청 중 메시지 숨기기
            });
        } else {
            // 사진 파일이 첨부되지 않은 경우
            url = `https://api.telegram.org/bot${token}/sendMessage`;
            formData = JSON.stringify({
                chat_id: chatId,
                parse_mode: 'HTML',
                text: message
            });
    
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.ok) {
                    playNotificationSound(); // 사운드 재생
                    alert('요청이 성공적으로 전송되었습니다.');
                    $("#linenRequestForm")[0].reset();
                } else {
                    throw new Error('전송 실패');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('요청을 전송하는 도중 오류가 발생했습니다.');
            })
            .finally(() => {
                $("#submitBtn").prop('disabled', false); // 요청 버튼 활성화
                $("#statusMessage").fadeOut(); // 요청 중 메시지 숨기기
            });
        }
    });
    
    // 관리자 페이지 링크 처리
    $('#adminPageLink').click(function(e) {
        e.preventDefault();
        var password = prompt("관리자 페이지 암호를 입력하세요.");
        if (password === "9") { // 관리자 페이지 암호 설정
            window.location.href = "admin.html";
        } else {
            alert("암호가 일치하지 않습니다.");
        }
    });
    
    const dateInput = document.getElementById('requestDate');
    const datePlaceholder = document.querySelector('.date-placeholder');
    
    dateInput.addEventListener('input', function() {
        if (dateInput.value) {
            datePlaceholder.style.display = 'none';
        } else {
            datePlaceholder.style.display = 'block';
        }
    });
    
    // 페이지 로드 시 초기 상태 설정
    if (dateInput.value) {
        datePlaceholder.style.display = 'none';
    }
    
    // jQuery UI Datepicker 초기화 (중복 초기화 제거)
    $("#requestDate").datepicker({
        dateFormat: 'yy-mm-dd'
    });

    // 사운드를 재생하는 함수
    function playNotificationSound() {
        notificationSound.currentTime = 0; // 사운드를 처음으로 되감기
        notificationSound.play(); // 사운드 재생
    }
});
