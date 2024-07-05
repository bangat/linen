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

       // 드롭다운 메뉴에서 병동 선택 시 처리
    $("#wardDropdown").change(function() {
        const selectedWard = $(this).val();
        $("#ward").val(selectedWard);
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

    $("#requestDate").datepicker({
        dateFormat: 'yy-mm-dd'
    });

    $("#cameraButton").click(function() {
        $("#inventoryPhoto").click();
    });

    $("#inventoryPhoto").change(function(event) {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            $("#preview").attr("src", e.target.result);
            $("#preview").show();
        };

        reader.readAsDataURL(file);
    });

    // 삼선 메뉴바 클릭 이벤트
    $("#menuBar").click(function() {
        $("#dropdownMenu").toggle();
    });

    $("#linenRequestForm").submit(function(event) {
        event.preventDefault();

        const wardValue = $("#ward").val().trim();
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
});
