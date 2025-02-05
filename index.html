<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta property="og:title" content="린넨실">
    <meta property="og:description" content="일일 사용량에 맞게 요청 바랍니다:D">
    <meta property="og:image" content="https://i.ibb.co/TKrjqyL/001-3.png">
    <meta property="og:url" content="https://hallymlinen.netlify.app/">
    <meta property="og:type" content="website">
    <title>린넨실 요청서</title>
    <link rel="stylesheet" href="linen.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon">
    <link rel="icon" href="/favicon.ico" type="image/x-icon">
    <audio id="notificationSound" src="https://drive.google.com/uc?export=download&id=1OwurEapLxRtn2I079OEjdkKxFncB35Ao"></audio>

    <style>
        /* 스타일 설정 */
        #adminAccessBtn {
            display: none;
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 10px 20px;
            font-size: 16px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            z-index: 1000;
        }
    </style>
</head>
<body>

    <div class="menu-bar" id="menuBar"></div>
    <div class="dropdown-menu" id="dropdownMenu">
        <a href="#" id="adminPageLink">관리자페이지</a>
    </div>

    <div class="content">
        <div class="header-container">
            <h1 id="noticeHeader">요청서</h1>
        </div>
    </div>

    <form id="linenRequestForm">
        <div class="form-group">
            <select id="wardDropdown" name="ward" required>
                <option value="" disabled selected>병동을 선택해주세요.</option>
                <option value="낮병동">낮병동</option>
                <option value="심혈관">심혈관</option>
                <option value="내시경실">내시경실</option>
                <option value="중환자실">중환자실</option>
                <option value="인공신장실">인공신장실</option>
                <option value="수술실">수술실</option>
                <option value="면역치료실">면역치료실</option>
                <option value="응급실">응급실</option>
            </select>
        </div>

        <div class="tabs">
            <div class="tab active" data-tab="sheet">시트/기타</div>
            <div class="tab" data-tab="normal">일반 환의</div>
            <div class="tab" data-tab="ortho">정형 환의</div>
            <div class="tab" data-tab="uniform">근 무 복</div>
            <div class="tab" data-tab="inventory">재고/요청</div>
        </div>

        <div id="inventory" class="form-section">
            <div class="camera-section">
                <div class="button-container">
                    <button type="button" id="cameraButton">
                        <i class="fa fa-camera camera-icon"></i> 재고사진
                    </button>
                    <input type="file" id="inventoryPhoto" style="display:none;" accept="image/*">
                </div>
                <button type="submit" id="submitBtn">
                    <i class="fas fa-paper-plane submit-icon"></i> 요청하기
                </button>
                <img id="preview" src="#" alt="Preview" style="max-width:100%; display:none;">
            </div>
        </div>

        <div id="statusMessage">요청을 전송중 입니다..잠시만 기다려주세요..</div>
    </form>

    <div id="popupContainer">
        <div id="popupHeader">공지사항</div>
        <div id="popupContent"></div>
        <button id="closeBtn">닫기</button>
    </div>

    <button id="adminAccessBtn">관리자 접속</button>

    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="js.js"></script>
    <script>
        $(document).ready(function() {
            // 📌 요청서 초기화
            $('#noticeHeader').on('click', function() {
                $('input[type="number"]').val('');
                $('#wardDropdown').val('');
                $('#requestDate').val('');
                $('.tab').removeClass('active');
                $('.form-section').removeClass('active');
                $('[data-tab="sheet"]').addClass('active');
                $('#sheet').addClass('active');
            });

            // 📌 중환자실 요청 시 재고사진 필수 확인
            $('#linenRequestForm').on('submit', function(event) {
                const selectedWard = $('#wardDropdown').val();
                const inventoryPhoto = $('#inventoryPhoto')[0].files.length;

                if (selectedWard === '중환자실' && inventoryPhoto === 0) {
                    event.preventDefault(); // 폼 제출 방지
                    alert('중환자실 요청 시 재고사진을 등록해야 합니다.');
                    $('#cameraButton').click(); // 카메라 버튼 자동 실행
                }
            });

            // 📌 카메라 버튼 클릭 시 파일 선택 창 열기
            $('#cameraButton').on('click', function() {
                $('#inventoryPhoto').click();
            });

            // 📌 관리자 페이지 이동 (2손가락 터치)
            document.addEventListener('touchstart', function(event) {
                if (event.touches.length === 2) {
                    document.getElementById('adminAccessBtn').click();
                }
            });

            // 📌 관리자 접근 버튼 클릭 시 이동
            document.getElementById('adminAccessBtn').addEventListener('click', function() {
                window.location.href = 'admin.html';
            });
        });
    </script>

</body>
</html>