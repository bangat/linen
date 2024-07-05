$(document).ready(function() {
    const githubUrl = 'https://raw.githubusercontent.com/bangat/hallymlinen/main/%EA%B3%B5%EC%A7%80%EC%82%AC%ED%95%AD.txt';

    // 공지사항 불러오기
    $.get(githubUrl, function(data) {
        $('#noticeContent').text(data);
    }).fail(function() {
        $('#noticeContent').text('공지사항을 불러오는 데 실패했습니다.');
    });

     // 팝업 닫기 함수
    function closePopup() {
        $('#popupContainer').hide();
    }

    // 팝업 열기 함수
    function showPopup() {
        $('#popupContainer').show();
    }

    // 팝업 열기 버튼 클릭 시
    $('#openPopup').click(function() {
        showPopup();
    });

    // 팝업 닫기 버튼 클릭 시
    $('.closeBtn').click(function(e) {
        e.preventDefault(); // 클릭 이벤트 기본 동작 방지
        closePopup();
    });

    // 린넨실 요청서 제목 클릭 시 초기 상태로 돌아가기
    $("h1").click(function() {
        $(".tab").removeClass("active");
        $(".tab[data-tab='sheet']").addClass("active");
        $(".form-section").removeClass("active");
        $("#sheet").addClass("active");
        $(".tab").css("background-color", ""); // 
        $(".tab[data-tab='sheet']").css("background-color", "#4CAF50"); // 시트/기타 탭 배경색 초록색으로 변경
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

    // 날짜 선택기 초기화
    $("#requestDate").datepicker({
        dateFormat: 'yy-mm-dd'
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

        message += `[시트/기타]\n`;
        $("#sheet input[type='number']").each(function() {
            const itemName = $(this).parent().prev().text().trim();
            const itemCount = $(this).val();
            if (itemCount > 0) {
                message += `${itemName} ${itemCount}개\n`;
            }
        });

        message += `\n[일반환의]\n`;
        $("#normal input[type='number']").each(function() {
            const itemName = $(this).parent().prev().text().trim();
            const itemCount = $(this).val();
            if (itemCount > 0) {
                message += `${itemName} ${itemCount}개\n`;
            }
        });

        message += `\n[정형환의]\n`;
        $("#ortho input[type='number']").each(function() {
            const itemName = $(this).parent().prev().text().trim();
            const itemCount = $(this).val();
            if (itemCount > 0) {
                message += `${itemName} ${itemCount}개\n`;
            }
        });

        message += `\n[근무복]\n`;
        $("#uniform input[type='number']").each(function() {
            const itemName = $(this).parent().prev().text().trim();
            const itemCount = $(this).val();
            if (itemCount > 0) {
                message += `${itemName} ${itemCount}개\n`;
            }
        });

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

    // 공지사항 링크 처리 (Javascript로 변경)
    $('#noticeHeader').click(function() {
        window.location.href = '공지사항.html'; // 공지사항 페이지로 이동
    });

    // jQuery UI Datepicker 초기화 (중복 초기화 제거)
    $("#requestDate").datepicker({
        dateFormat: 'yy-mm-dd'
    });
});
