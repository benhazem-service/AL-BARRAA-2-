<!DOCTYPE html>
<html lang="ar" dir="rtl">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>⚙ إدارة النظام التعليمي</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/feather-icons"></script>
    <!-- Firebase SDKs -->
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-database.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-auth.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.0/firebase-analytics.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Tajawal', sans-serif;
        }

        .rtl {
            direction: rtl;
            text-align: right;
        }

        .hidden {
            display: none;
        }

        .tab-active {
            background-color: #4f46e5;
            color: white;
        }

        .transition-btn {
            transition: all 0.2s ease;
        }

        .transition-btn:hover {
            transform: scale(1.05);
        }

        .grade-cell {
            cursor: pointer;
            padding: 0.5rem;
            border: 1px solid #e5e7eb;
            min-width: 3.5rem;
            text-align: center;
        }

        .grade-cell:hover {
            background: #f8fafc;
        }

        .grade-header {
            background: #fde68a;
        }

        .avg-cell {
            font-weight: 600;
            background: #f1f5f9;
            text-align: center;
            padding: 0.5rem;
            border: 1px solid #e5e7eb;
        }

        .session-tab-btn {
            padding: 0.5rem 1rem;
            border: 1px solid #d1d5db;
            border-bottom: none;
            background-color: #f9fafb;
            cursor: pointer;
        }

        .session-tab-active {
            background-color: #fff;
            border-bottom: 1px solid #fff;
            margin-bottom: -1px;
            font-weight: bold;
            color: #4f46e5;
        }

        /* أنماط النتيجة المدرسية الجديدة */
        .page {
            width: 210mm;
            min-height: 297mm;
            margin: 10mm auto;
            background: #fff;
            border-radius: 10px;
            box-shadow: 0 5px 20px rgba(0, 0, 0, .1);
            padding: 15px;
            position: relative;
            overflow: hidden;
        }

        .editable {
            min-height: 18px;
            outline: none;
            border-bottom: 1px dotted #ccc;
        }

        .editable[placeholder]:empty:before {
            content: attr(placeholder);
            color: #aaa;
        }

        .draggable {
            position: absolute;
            cursor: move;
            user-select: none;
            border: 1px dashed transparent;
            border-radius: 6px;
            max-width: 300px;
        }

        .draggable.active {
            border: 1px dashed #2fb57f;
        }

        .resize-handle {
            width: 14px;
            height: 14px;
            background: #2fb57f;
            position: absolute;
            bottom: -7px;
            right: -7px;
            border-radius: 50%;
            cursor: se-resize;
        }

        @media print {
            .resize-handle {
                display: none;
            }
        }

        /* أنماط قفل الصور */
        .images-locked .draggable {
            cursor: default;
            border-color: transparent;
        }

        .images-locked .resize-handle,
        .images-locked .delete-image-btn {
            display: none !important;
        }

        /* === نظام تسجيل الدخول === */
        #loginOverlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            background: linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%);
            display: flex;
            align-items: center;
            justify-content: center;
        }

        #loginOverlay.hidden {
            display: none;
        }

        .login-card {
            background: rgba(255, 255, 255, 0.08);
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(20px);
            border-radius: 1.5rem;
            padding: 2.5rem;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
        }

        .login-input {
            width: 100%;
            padding: 0.8rem 1rem;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.25);
            border-radius: 0.75rem;
            color: white;
            font-size: 1rem;
            font-family: 'Tajawal', sans-serif;
            direction: ltr;
            text-align: left;
            transition: border 0.2s;
        }

        .login-input:focus {
            outline: none;
            border-color: #a5b4fc;
            background: rgba(255, 255, 255, 0.15);
        }

        .login-input::placeholder {
            color: rgba(255, 255, 255, 0.5);
        }

        .login-btn {
            width: 100%;
            padding: 0.85rem;
            background: linear-gradient(90deg, #6366f1, #8b5cf6);
            color: white;
            border: none;
            border-radius: 0.75rem;
            font-size: 1.05rem;
            font-weight: 700;
            cursor: pointer;
            font-family: 'Tajawal', sans-serif;
            transition: transform 0.15s, box-shadow 0.15s;
        }

        .login-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(99, 102, 241, 0.5);
        }

        .login-error {
            color: #fca5a5;
            font-size: 0.9rem;
            text-align: center;
            min-height: 1.2rem;
        }

        /* === لوحة الإدارة === */
        #adminModal {
            position: fixed;
            inset: 0;
            z-index: 1000;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }

        #adminModal.hidden {
            display: none;
        }

        .admin-modal-content {
            background: white;
            border-radius: 1.2rem;
            width: 100%;
            max-width: 750px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.35);
        }

        /* أنماط حقول تعديل المعدلات يدوياً */
        .session-avg-input:focus {
            outline: 2px solid #6366f1;
            outline-offset: 1px;
        }

        .session-avg-input:hover {
            border-color: #6366f1 !important;
        }

        @media print {
            .session-avg-input {
                border: none !important;
                background: transparent !important;
                font-weight: bold;
            }

            .session-avg-reset,
            #finalAvgReset {
                display: none !important;
            }

            #finalAvgInput {
                border: none !important;
                background: transparent !important;
                font-weight: bold;
            }
        }

        #sheet.hide-images .draggable {
            display: none !important;
        }
    </style>
</head>

<body class="bg-gray-100 min-h-screen rtl">

    <!-- ===== شاشة تسجيل الدخول ===== -->
    <div id="loginOverlay">
        <div class="login-card">
            <div class="text-center mb-7">
                <div class="text-5xl mb-3">📚</div>
                <h2 class="text-2xl font-bold text-white">النظام التعليمي</h2>
                <p class="text-indigo-200 text-sm mt-1">أدخل بيانات الدخول للمتابعة</p>
            </div>
            <div class="flex flex-col gap-4">
                <div>
                    <label class="text-indigo-200 text-sm block mb-1">رقم الهاتف</label>
                    <input id="loginPhone" type="tel" placeholder="0600000000" class="login-input"
                        autocomplete="username">
                </div>
                <div>
                    <label class="text-indigo-200 text-sm block mb-1">كلمة السر</label>
                    <input id="loginPassword" type="password" placeholder="••••••••" class="login-input"
                        autocomplete="current-password">
                </div>
                <p id="loginError" class="login-error"></p>
                <button id="loginBtn" class="login-btn">
                    <span id="loginBtnText">تسجيل الدخول</span>
                </button>
            </div>
            <p class="text-center text-indigo-300 text-xs mt-6 opacity-60">النظام التعليمي © 2026</p>
        </div>
    </div>

    <!-- ===== مودال إدارة الحسابات (للأدمن) ===== -->
    <div id="adminModal" class="hidden">
        <div class="admin-modal-content">
            <div
                class="bg-gradient-to-l from-indigo-600 to-purple-700 p-5 rounded-t-xl flex justify-between items-center">
                <h2 class="text-white text-xl font-bold">⚙️ لوحة إدارة الحسابات</h2>
                <button onclick="document.getElementById('adminModal').classList.add('hidden')"
                    class="text-white hover:text-indigo-200 text-2xl font-bold leading-none">&times;</button>
            </div>
            <div class="p-5">
                <!-- نموذج إضافة / تعديل حساب -->
                <div class="bg-indigo-50 rounded-xl p-4 mb-5">
                    <h3 id="accountFormTitle" class="font-bold text-indigo-700 mb-3">➕ إضافة حساب جديد</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="text-sm text-gray-600 block mb-1">الاسم الكامل</label>
                            <input id="accName" type="text" placeholder="مثال: محمد أحمد"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 text-sm">
                        </div>
                        <div>
                            <label class="text-sm text-gray-600 block mb-1">رقم الهاتف (معرّف الدخول)</label>
                            <input id="accPhone" type="tel" placeholder="0600000000" dir="ltr"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 text-sm">
                        </div>
                        <div>
                            <label class="text-sm text-gray-600 block mb-1">كلمة السر</label>
                            <input id="accPassword" type="text" placeholder="اتركه فارغاً لعدم التغيير"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 text-sm">
                        </div>
                        <div>
                            <label class="text-sm text-gray-600 block mb-1">اسم المؤسسة (في النتيجة)</label>
                            <textarea id="accInstitution" rows="2" placeholder="يمكن كتابة سطرين"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 text-sm"></textarea>
                        </div>
                        <div>
                            <label class="text-sm text-gray-600 block mb-1">المستويات المسموح بها</label>
                            <div id="accLevelsCheckboxes"
                                class="flex flex-wrap gap-2 p-2 border border-gray-300 rounded-lg bg-white min-h-10">
                                <span class="text-gray-400 text-xs">سيتم تحميل المستويات...</span>
                            </div>
                        </div>
                    </div>
                    <input id="accEditingPhone" type="hidden" value="">
                    <div class="flex gap-2 mt-3">
                        <button id="accSaveBtn" onclick="saveAccount()"
                            class="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-bold">💾
                            حفظ</button>
                        <button id="accCancelBtn" onclick="cancelAccountEdit()"
                            class="hidden bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm">إلغاء</button>
                    </div>
                </div>

                <!-- قائمة الحسابات -->
                <h3 class="font-bold text-gray-700 mb-2">📋 قائمة الحسابات</h3>
                <div id="accountsList" class="space-y-2">
                    <p class="text-gray-400 text-sm text-center py-4">جاري التحميل...</p>
                </div>
            </div>
        </div>
    </div>

    <!-- ===== مودال التصدير ===== -->
    <div id="exportModal"
        class="hidden fixed inset-0 z-[1000] bg-black bg-opacity-60 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all">
            <div class="bg-indigo-600 p-4 flex justify-between items-center">
                <h2 class="text-white text-lg font-bold">💾 خيارات التصدير</h2>
                <button onclick="document.getElementById('exportModal').classList.add('hidden')"
                    class="text-white hover:text-indigo-200 text-2xl leading-none">&times;</button>
            </div>
            <div class="p-5 flex flex-col gap-3">
                <button onclick="exportAll()"
                    class="bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-bold py-3 rounded-lg w-full transition-colors">📦
                    تصدير كل البيانات</button>
                <button onclick="exportImages()"
                    class="bg-teal-100 hover:bg-teal-200 text-teal-800 font-bold py-3 rounded-lg w-full transition-colors">🖼️
                    تصدير الصور فقط</button>
            </div>
        </div>
    </div>

    <!-- ===== مودال الاستيراد ===== -->
    <div id="importModal"
        class="hidden fixed inset-0 z-[1000] bg-black bg-opacity-60 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl w-full max-w-sm overflow-hidden shadow-2xl transform transition-all">
            <div class="bg-gray-600 p-4 flex justify-between items-center">
                <h2 class="text-white text-lg font-bold">📂 خيارات الاستيراد</h2>
                <button onclick="document.getElementById('importModal').classList.add('hidden')"
                    class="text-white hover:text-gray-200 text-2xl leading-none">&times;</button>
            </div>
            <div class="p-5 flex flex-col gap-3">
                <button onclick="document.getElementById('importAllInput').click()"
                    class="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-lg w-full transition-colors">📦
                    استيراد كل البيانات (استبدال)</button>
                <button onclick="document.getElementById('importImagesInput').click()"
                    class="bg-teal-100 hover:bg-teal-200 text-teal-800 font-bold py-3 rounded-lg w-full transition-colors">🖼️
                    استيراد الصور فقط (دمج)</button>

                <input type="file" id="importAllInput" accept=".json" class="hidden" onchange="importAll(event)">
                <input type="file" id="importImagesInput" accept=".json" class="hidden" onchange="importImages(event)">
            </div>
        </div>
    </div>

    <div class="container mx-auto p-6 max-w-5xl">

        <!-- Header -->
        <header class="flex justify-between items-center mb-8">
            <h1 class="text-2xl font-bold text-indigo-700">📚 النظام التعليمي</h1>
            <div class="flex gap-2 items-center">
                <!-- محدد السنة الدراسية (للمدير فقط) -->
                <div id="yearSelectorBox" class="flex items-center gap-2">
                    <label class="text-sm font-medium">السنة الدراسية:</label>
                    <button id="prevYearBtn" title="السنة السابقة"
                        class="px-2 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">◀</button>
                    <select id="academicYearSelect"
                        class="px-3 py-2 border-y border-gray-300 bg-white focus:outline-none"></select>
                    <button id="nextYearBtn" title="السنة التالية"
                        class="px-2 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">▶</button>
                </div>
                <button id="exportBtn"
                    class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-btn">💾
                    تصدير</button>

                <button id="importBtn"
                    class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-btn">📂
                    استيراد</button>

                <button id="openSettings"
                    class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center gap-1 transition-btn">
                    <i data-feather="settings"></i> إعدادات
                </button>

                <!-- Cloud Status Indicator (Auto-Sync) -->
                <div class="flex items-center gap-2 mr-2 border-r pr-2 border-gray-300">
                    <span id="cloudStatus"
                        class="text-xs font-medium text-gray-500 hidden transition-colors duration-300"></span>
                </div>

                <!-- معلومات المستخدم + تسجيل الخروج -->
                <div class="flex items-center gap-2 border-r pr-2 border-gray-300">
                    <span id="headerUserName" class="text-sm font-medium text-indigo-700 hidden"></span>
                    <button id="logoutBtn" onclick="logoutUser()"
                        class="hidden bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 transition-btn">
                        <i data-feather="log-out" class="w-4 h-4"></i> خروج
                    </button>
                </div>
            </div>
        </header>

        <!-- Stats -->
        <section id="statsSection" class="bg-white p-6 rounded-xl shadow-md mb-6">
            <h2 class="text-xl font-bold text-indigo-700 mb-4">📊 ملخص النظام</h2>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4" id="statsGrid">
                <!-- بطاقة أداء الواجبات الشهرية -->
                <div class="bg-purple-100 p-4 rounded-lg text-center cursor-pointer" id="monthlyPerformanceCard">
                    <p class="text-indigo-700 font-bold text-2xl">أداء الواجبات الشهرية</p>
                    <p>عرض الأداء الشهري لكل طفل</p>
                </div>
                <!-- بطاقة عدد الأطفال -->
                <div id="totalStudentsCard"
                    class="bg-green-100 p-4 rounded-lg text-center cursor-pointer transition-btn">
                    <p class="text-green-700 font-bold text-2xl" id="totalStudents">0</p>
                    <p>عدد الأطفال</p>
                </div>
                <!-- بطاقة تسجيل الغياب -->
                <div id="absenceCard"
                    class="bg-red-100 p-4 rounded-lg text-center cursor-pointer transition-btn sm:col-span-1">
                    <p class="text-red-700 font-bold text-2xl flex justify-center items-center gap-2">تسجيل الغياب
                        <i data-feather="user-x" class="w-8 h-8"></i>
                    </p>
                    <p>تسجيل وتتبع غيابات الأطفال</p>
                </div>
                <!-- بطاقة ترتيب المراكز حسب المستوى -->
                <div id="rankingCard" class="bg-amber-100 p-4 rounded-lg text-center cursor-pointer transition-btn">
                    <p class="text-amber-700 font-bold text-2xl flex justify-center items-center gap-2">ترتيب المراكز
                        حسب المستوى <i data-feather="award" class="w-8 h-8"></i></p>
                    <p>عرض ترتيب التلاميذ الأوائل لكل مستوى</p>
                </div>
                <!-- بطاقة الإدارة (للأدمن فقط) -->
                <div id="adminCard" onclick="openAdminPanel()"
                    class="hidden bg-gradient-to-br from-indigo-100 to-purple-100 p-4 rounded-lg text-center cursor-pointer transition-btn border-2 border-indigo-200 hover:border-indigo-400">
                    <p class="text-indigo-700 font-bold text-xl flex justify-center items-center gap-2">
                        <i data-feather="users" class="w-7 h-7"></i> إدارة الحسابات
                    </p>
                    <p class="text-indigo-600 text-sm">إنشاء وتعديل حسابات المستخدمين</p>
                </div>
            </div>
        </section>

        <!-- Main Home Section -->
        <section id="homePage" class="bg-white p-8 rounded-xl shadow-md text-center">
            <h2 class="text-3xl font-bold text-indigo-700 mb-2">مرحبا بك في النظام التعليمي</h2>

            <div id="homeGreeting" class="text-center mb-6"></div>

            <img src="https://cdn-icons-png.flaticon.com/512/2942/2942789.png" alt="icon"
                class="w-48 mx-auto opacity-80 mb-6">

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                <div class="bg-indigo-50 p-4 rounded-lg">
                    <h3 class="font-bold text-indigo-700 mb-2">🏫 اختر القسم</h3>
                    <select id="homeDeptSelect" class="w-full mb-3 px-3 py-2 border rounded-lg">
                        <option value="">-- اختر --</option>
                    </select>
                </div>

                <div class="bg-green-50 p-4 rounded-lg">
                    <h3 class="font-bold text-green-700 mb-2">👨‍🎓 اختر التلميذ</h3>
                    <select id="homeStudentSelect" class="w-full px-3 py-2 border rounded-lg">
                        <option value="">-- اختر تلميذ --</option>
                    </select>
                    <p id="homeStudentCount" class="text-sm mt-2 text-gray-600"></p>
                </div>

                <div class="bg-amber-50 p-4 rounded-lg">
                    <h3 class="font-bold text-amber-700 mb-2">📘 معلومات سريعة</h3>
                    <div id="homeStudentInfo" class="mb-3 text-right text-sm text-gray-700"></div>
                </div>
            </div>

            <!-- قسم عرض بيانات التلميذ والدورات -->
            <div id="studentDisplaySection" class="hidden mt-6">
                <div class="flex justify-between items-center mb-3">
                    <div id="tableDeptLabel" class="text-indigo-700 font-semibold text-lg"></div>
                    <button id="clearSelection" class="text-sm text-gray-600 hover:text-indigo-600">إلغاء
                        التحديد</button>
                </div>

                <!-- قسم النتيجة المدرسية الجديد -->
                <div id="newReportCard" class="mt-4">
                    <div class="flex flex-wrap justify-center items-center gap-4 mb-4 print:hidden">
                        <button class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                            onclick="printNewReport()">🖨 طباعة</button>
                        <button class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg"
                            onclick="printAllLevelReports()">🖨 طباعة نتائج القسم كاملاً</button>
                        <button id="toggleLockImagesBtn"
                            class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg">🔒 تثبيت
                            الصور</button>

                        <div class="flex flex-col items-center gap-2">
                            <label
                                class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg cursor-pointer text-center"
                                for="imageInput">📷 إدراج صورة</label>
                        </div>

                        <input type="file" id="imageInput" accept="image/png, image/jpeg, image/gif" class="hidden">

                        <button id="toggleShowImagesBtn" onclick="toggleImagesVisibility()"
                            class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">👁 إخفاء
                            الصور</button>

                        <select id="reportSessionSelect"
                            class="px-3 py-2 border rounded-lg bg-white focus:ring-2 focus:ring-indigo-500"></select>
                    </div>

                    <div class="page" id="sheet">
                        <h2 id="reportCardTitle" style="text-align:center; color:#2fb57f;">نموذج النتائج الدراسية
                        </h2>

                        <div
                            style="display:flex; justify-content: space-between; align-items: flex-start; margin-bottom:12px; border-bottom: 2px solid #2fb57f; padding-bottom: 12px;">
                            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; flex-grow: 1;">
                                <div><strong>المؤسسة:</strong>
                                    <div data-field="institution" placeholder="اسم المدرسة"
                                        style="border-bottom: 1px dotted #ccc; min-height: 18px;"></div>
                                </div>
                                <div><strong>المستوى:</strong>
                                    <div contenteditable class="editable" data-field="level"
                                        placeholder="المستوى الدراسي"></div>
                                </div>
                                <div><strong>السنة الدراسية:</strong>
                                    <div contenteditable class="editable" data-field="academicYear"
                                        placeholder="2025 / 2024"></div>
                                </div>
                                <div><strong>اسم الطفل(ة):</strong>
                                    <div contenteditable class="editable" data-field="studentName"
                                        placeholder="الاسم الكامل"></div>
                                </div>
                            </div>
                            <div style="margin-right: 20px;">
                                <img id="reportCardStudentImage"
                                    src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" alt="صورة التلميذ"
                                    style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; border: 2px solid #ddd;">
                            </div>
                        </div>

                        <h3
                            style="background: #2fb57f; color: #fff; padding: 6px 10px; border-radius: 6px; font-size: 16px; margin-bottom: 10px;">
                            تقييم الأنشطة / المواظبة و السلوك</h3>
                        <table class="main-report-table"
                            style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            <thead>
                                <tr style="background-color: #f3f4f6;">
                                    <th style="width:20%; border: 1px solid #ddd; padding: 8px;">المجال</th>
                                    <th style="width:35%; border: 1px solid #ddd; padding: 8px;">النشاط </th>
                                    <th style="width:15%; border: 1px solid #ddd; padding: 8px;">التقدير</th>
                                    <th style="width:30%; border: 1px solid #ddd; padding: 8px;">الملاحظات</th>
                                </tr>
                            </thead>
                            <tbody id="reportActivitiesBody">
                                <!-- سيتم ملء هذا القسم ديناميكياً -->
                            </tbody>
                        </table>

                        <h3
                            style="background: #4f46e5; color: #fff; padding: 6px 10px; border-radius: 6px; font-size: 16px; margin-top: 15px; margin-bottom: 10px;">
                            التقدير الإجمالي </h3>
                        <p class="print:hidden"
                            style="font-size:12px; color:#6b7280; margin-bottom:6px; text-align:right;">
                            ✏️ يمكنك تعديل معدل أي مرحلة يدوياً بالنقر على الخانة. المعدلات المعدّلة تظهر باللون الأصفر.
                            انقر ↺ للرجوع للحساب التلقائي.
                        </p>
                        <table
                            style="width: 100%; border-collapse: collapse; text-align: center; font-size: 14px; margin-bottom: 15px;">
                            <thead id="finalGradesHeader">
                                <!-- رؤوس الأعمدة للدورات ستضاف هنا -->
                            </thead>
                            <tbody id="finalGradesBody">
                                <!-- خلايا المعدلات ستضاف هنا -->
                            </tbody>
                        </table>

                        <table
                            style="width: 100%; border-collapse: collapse; text-align: center; font-size: 14px; margin-bottom: 20px;">
                            <tr style="background-color: #f3f4f6;">
                                <th colspan="4" style="border: 1px solid #ddd; padding: 8px;">قرار نتائج الدورة</th>
                            </tr>
                            <tr>
                                <td style="border: 1px solid #ddd; padding: 8px;"><label><input type="checkbox"
                                            data-field="award_commendation" class="award-cb"> تنويه</label></td>
                                <td style="border: 1px solid #ddd; padding: 8px;"><label><input type="checkbox"
                                            data-field="award_encouragement" class="award-cb"> تشجيع</label></td>
                                <td style="border: 1px solid #ddd; padding: 8px;"><label><input type="checkbox"
                                            data-field="award_honor" class="award-cb"> لوحة الشرف</label></td>
                                <td style="border: 1px solid #ddd; padding: 8px;"><label><input type="checkbox"
                                            data-field="award_warning" class="award-cb"> تنبيه</label></td>
                            </tr>
                        </table>

                        <table
                            style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 25px; border: 1px solid #ddd;">
                            <tr>
                                <td style="width: 33%; padding: 8px; vertical-align: top;">
                                    <strong>ملاحظات الأستاذ(ة)المربي(ة):</strong>
                                    <div class="mt-2">
                                        <select data-field="teacher_notes_select"
                                            class="w-full border-gray-300 rounded-md p-1 report-note-select"></select>
                                        <textarea data-field="teacher_notes_custom"
                                            class="hidden w-full border-gray-300 rounded-md p-1 mt-2"
                                            placeholder="اكتب ملاحظتك المخصصة هنا..."></textarea>
                                    </div>
                                </td>
                                <td style="width: 33%; padding: 8px; vertical-align: top;"><strong>الغياب:</strong>
                                    <div style="margin-top: 5px;">مبرر: <span data-field="absences_justified"
                                            style="display: inline-block; min-width: 30px; font-weight: bold; color: #16a34a;">0</span>
                                    </div>
                                    <div style="margin-top: 5px;">غير مبرر: <span data-field="absences_unjustified"
                                            style="display: inline-block; min-width: 30px; font-weight: bold; color: #dc2626;">0</span>
                                    </div>
                                </td>
                                <td style="width: 33%; padding: 8px; text-align: center; vertical-align: top;">
                                    <strong>طابع وتوقيع الإدارة</strong>
                                    <div style="height: 60px; margin-top: 5px;"></div>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div class="flex justify-center mt-4 print:hidden">
                        <button
                            class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg text-lg transition-btn"
                            onclick="printNewReport()">🖨 طباعة النتيجة</button>
                    </div>
                </div>
            </div>

        </section>

        <!-- Settings Section -->
        <section id="settingsPage" class="hidden bg-white rounded-xl shadow-md p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-indigo-700 flex items-center gap-2">
                    <i data-feather="settings"></i> إعدادات النظام
                </h2>
                <button id="backHome" class="text-sm text-gray-600 hover:text-indigo-600 flex items-center gap-1">
                    <i data-feather="arrow-right"></i> رجوع للرئيسية
                </button>
            </div>

            <div class="flex gap-3 mb-6 flex-wrap" id="settingsTabsBar">
                <button class="tab-btn tab-active px-4 py-2 rounded-lg font-medium border border-gray-600"
                    data-target="generalSettingsTab" data-admin-only="true">⚙️ إعدادات عامة</button>
                <button class="tab-btn px-4 py-2 rounded-lg font-medium border border-purple-600" data-target="yearsTab"
                    data-admin-only="true">📅 السنوات الدراسية</button>
                <button class="tab-btn px-4 py-2 rounded-lg font-medium border border-indigo-600" data-target="deptsTab"
                    data-admin-only="true">🏫 الأقسام</button>
                <button class="tab-btn px-4 py-2 rounded-lg font-medium border border-green-600"
                    data-target="studentsTab">👨‍🎓 التلاميذ</button>
                <button class="tab-btn px-4 py-2 rounded-lg font-medium border border-amber-600"
                    data-target="activitiesTab">📝 الأنشطة</button>
                <button class="tab-btn px-4 py-2 rounded-lg font-medium border border-rose-600"
                    data-target="sessionsTab">🔄 الدورات</button>
                <button class="tab-btn px-4 py-2 rounded-lg font-medium border border-cyan-600"
                    data-target="observationsTab">📋 الملاحظات</button>
            </div>


            <!-- إعدادات عامة -->
            <div id="generalSettingsTab" class="tab-content">
                <h3 class="text-lg font-bold text-gray-800 mb-3">إعدادات عامة</h3>
                <div class="space-y-4 max-w-lg">
                    <div>
                        <label for="institutionNameInput" class="block text-sm font-medium text-gray-700 mb-1">اسم
                            المؤسسة</label>
                        <textarea id="institutionNameInput"
                            placeholder="اسم المؤسسة الذي سيظهر في التقارير. يمكنك استخدام Enter لكتابة سطر جديد."
                            class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500"
                            rows="2"></textarea>
                    </div>

                    <div class="mt-4 pt-4 border-t border-gray-200">
                        <h4 class="font-bold text-orange-600 mb-2">☁️ إعدادات الربط السحابي (Firebase)</h4>
                        <div class="bg-orange-50 p-3 rounded-lg text-sm mb-2 text-gray-700">
                            إذا لم يتم الحفظ، يرجى نسخ "Realtime Database URL" من لوحة تحكم الفايربيس ولصقه هنا.<br>
                            صيغ محتملة: <code dir="ltr">https://project-id.firebaseio.com</code> أو <code
                                dir="ltr">https://project-id-default-rtdb.firebaseio.com</code>
                        </div>
                        <div class="bg-blue-50 p-3 rounded-lg text-sm mb-2 text-blue-800">
                            💡 <strong>ملاحظة لبروتوكول file://:</strong> عند فتح الملف مباشرة (Double Click)، يرجى
                            التأكد من أن قواعد الحماية (Rules) في Firebase تسمح بالقراءة والكتابة بدون تسجيل دخول، أو قم
                            بتشغيل خادم محلي (Local Server) لتفعيل المزامنة التلقائية.
                        </div>
                        <label for="firebaseDbUrlInput" class="block text-sm font-medium text-gray-700 mb-1">رابط
                            قاعدة
                            البيانات (Database URL)</label>
                        <input type="text" id="firebaseDbUrlInput" placeholder="https://..." dir="ltr"
                            class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 mb-2">
                        <button id="saveFirebaseConfig"
                            class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg w-full">حفظ
                            إعدادات
                            الربط</button>
                    </div>
                </div>
            </div>

            <!-- السنوات الدراسية -->
            <div id="yearsTab" class="tab-content hidden">
                <form id="yearForm" class="flex flex-col sm:flex-row gap-3 mb-6">
                    <input type="text" id="yearName" placeholder="مثال: 2025/2026" required
                        class="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    <button type="submit"
                        class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg flex items-center gap-1 transition-btn">
                        <i data-feather="plus"></i> إضافة سنة
                    </button>
                </form>
                <ul id="yearList" class="space-y-2"></ul>
            </div>

            <!-- الأقسام -->
            <div id="deptsTab" class="tab-content hidden">
                <input type="text" id="deptSearch" placeholder="بحث في الأقسام..."
                    class="w-full mb-3 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500">
                <form id="deptForm" class="flex flex-col sm:flex-row gap-3 mb-6">
                    <input type="text" id="deptName" placeholder="اسم القسم" required
                        class="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                    <button type="submit"
                        class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center gap-1 transition-btn">
                        <i data-feather="plus"></i> إضافة
                    </button>
                </form>
                <ul id="deptList" class="space-y-2"></ul>
            </div>

            <!-- التلاميذ -->
            <div id="studentsTab" class="tab-content hidden">
                <div class="mb-4">
                    <label class="block text-gray-700 mb-2 font-medium">السنة الدراسية:</label>
                    <select id="yearSelectForStudents"
                        class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 bg-white"></select>
                </div>
                <div class="mb-3 flex gap-2">
                    <input type="text" id="studentSearch" placeholder="بحث في التلاميذ..."
                        class="flex-grow px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500">
                </div>
                <div class="mb-4">
                    <label class="block text-gray-700 mb-2 font-medium">القسم:</label>
                    <select id="deptSelectForStudents"
                        class="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"></select>
                </div>

                <button id="addStudentBtn"
                    class="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center justify-center gap-1 transition-btn mb-6">
                    <i data-feather="user-plus"></i> إضافة تلميذ جديد
                </button>
                <ul id="studentList" class="space-y-2"></ul>
            </div>

            <!-- الأنشطة -->
            <div id="activitiesTab" class="tab-content hidden">
                <div>
                    <h3 class="text-lg font-bold text-gray-800 mb-3">بنود التقييم (الأنشطة والسلوك)</h3>
                    <form id="reportActivityForm" class="flex flex-col sm:flex-row gap-2 mb-4">
                        <input type="text" id="reportActivityName" placeholder="اسم البند الجديد (نشاط أو سلوك)"
                            required class="flex-grow px-3 py-2 border rounded-lg">
                        <select id="reportActivityDept" class="px-3 py-2 border rounded-lg bg-white">
                            <option value="all">كل المستويات</option>
                        </select>
                        <button type="submit"
                            class="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg">إضافة</button>
                    </form>
                    <ul id="reportActivityList" class="space-y-2">
                        <!-- قائمة بنود السلوك ستعرض هنا -->
                    </ul>
                </div>
            </div>

            <!-- الدورات -->
            <div id="sessionsTab" class="tab-content hidden">
                <h3 class="text-lg font-bold text-gray-800 mb-3">إدارة الدورات الدراسية</h3>
                <p class="text-sm text-gray-600 mb-4">هذه الدورات ستظهر في نموذج النتائج لحفظ تقييمات كل دورة على
                    حدة.
                </p>
                <form id="sessionForm" class="flex gap-2 mb-4">
                    <input type="text" id="sessionName" placeholder="اسم الدورة الجديدة (مثال: الدورة الأولى)" required
                        class="flex-grow px-3 py-2 border rounded-lg">
                    <button type="submit" class="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg">إضافة
                        دورة</button>
                </form>
                <ul id="sessionList" class="space-y-2">
                    <!-- قائمة الدورات ستعرض هنا -->
                </ul>
            </div>
            <!-- الملاحظات العامة -->
            <div id="observationsTab" class="tab-content hidden">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h3 class="text-lg font-bold text-gray-800 mb-3">ملاحظات الأستاذ(ة):</h3>
                        <p class="text-sm text-gray-600 mb-4">هذه الملاحظات ستظهر كخيارات جاهزة ضمن حقل "ملاحظات
                            الأستاذ(ة)" في بطاقة النتائج.</p>
                        <form id="observationForm" class="flex gap-2 mb-4">
                            <input type="text" id="observationName" placeholder="نص الملاحظة الجديدة" required
                                class="flex-grow px-3 py-2 border rounded-lg">
                            <button type="submit"
                                class="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg">إضافة</button>
                        </form>
                        <ul id="observationList" class="space-y-2">
                            <!-- قائمة الملاحظات ستعرض هنا -->
                        </ul>
                    </div>
                    <div>
                        <h3 class="text-lg font-bold text-gray-800 mb-3">💯 الملاحظات التلقائية حسب النقطة</h3>
                        <p class="text-sm text-gray-600 mb-4">بمجرد إدخال نقطة في النتيجة، ستظهر الملاحظة المرتبطة
                            بها
                            تلقائياً.</p>
                        <form id="scoreObservationForm" class="grid grid-cols-4 gap-2 mb-4 items-center">
                            <input type="number" id="scoreObsMin" placeholder="من" required
                                class="px-3 py-2 border rounded-lg" step="0.01">
                            <input type="number" id="scoreObsMax" placeholder="إلى" required
                                class="px-3 py-2 border rounded-lg" step="0.01">
                            <input type="text" id="scoreObsText" placeholder="نص الملاحظة" required
                                class="col-span-2 px-3 py-2 border rounded-lg">
                            <button type="submit"
                                class="col-span-4 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg mt-2">إضافة
                                ملاحظة بالنقطة</button>
                        </form>
                        <ul id="scoreObservationList" class="space-y-2">
                            <!-- قائمة الملاحظات حسب النقطة -->
                        </ul>
                    </div>
                </div>
            </div>


        </section>
    </div>

    <!-- Modal اختيار نوع البند -->
    <div id="addItemTypeModal"
        class="hidden fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div class="bg-white rounded-xl p-6 w-96 shadow-lg">
            <h3 class="text-lg font-bold mb-4">اختر نوع البند</h3>
            <div class="flex flex-col gap-4">
                <button id="addActivityTypeBtn" class="w-full text-left p-4 rounded-lg bg-amber-100 hover:bg-amber-200">
                    <strong class="text-amber-800">نشاط (تقدير نصي)</strong>
                    <p class="text-sm text-gray-600">مثل: القرآن الكريم، الرياضيات (يتم تقييمه بنص مثل: جيد،
                        حسن...).
                    </p>
                </button>
                <button id="addBehaviorTypeBtn" class="w-full text-left p-4 rounded-lg bg-blue-100 hover:bg-blue-200">
                    <strong class="text-blue-800">سلوك (تقييم رقمي)</strong>
                    <p class="text-sm text-gray-600">مثل: المواظبة، المشاركة (يتم تقييمه برقم من 0 إلى 10).</p>
                </button>
            </div>
        </div>
    </div>

    <!-- Modal Tailwind -->
    <div id="modalConfirm" class="hidden fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div class="bg-white rounded-xl p-6 w-96 shadow-lg">
            <p class="mb-4" id="modalText">هل أنت متأكد؟</p>
            <div class="flex justify-end gap-4">
                <button id="modalCancel" class="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400">إلغاء</button>
                <button id="modalConfirmBtn"
                    class="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white">حذف</button>
            </div>
        </div>
    </div>

    <!-- Modal قائمة جميع التلاميذ -->
    <div id="allStudentsModal"
        class="hidden fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div class="bg-white rounded-xl p-6 w-full max-w-3xl shadow-lg max-h-full flex flex-col">
            <div class="flex justify-between items-center mb-4 border-b pb-3">
                <h3 class="text-xl font-bold text-green-700">قائمة جميع التلاميذ (<span id="allStudentsCount">0</span>)
                </h3>
                <button type="button" id="allStudentsModalClose"
                    class="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
            </div>
            <input type="text" id="allStudentsSearch" placeholder="بحث بالاسم أو القسم..."
                class="w-full px-4 py-2 border rounded-lg mb-4">
            <div class="overflow-y-auto">
                <ul id="allStudentsList" class="space-y-2">
                    <!-- قائمة التلاميذ ستضاف هنا -->
                </ul>
            </div>
        </div>
    </div>

    <!-- Modal ترتيب المراكز -->
    <div id="rankingModal"
        class="hidden fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div class="bg-white rounded-xl p-6 w-full max-w-2xl shadow-lg max-h-full flex flex-col">
            <div class="flex justify-between items-center mb-4 border-b pb-3">
                <h3 class="text-xl font-bold text-amber-700">🏆 ترتيب الأوائل حسب المستوى</h3>
                <div class="flex gap-2">
                    <button onclick="printRankingList()"
                        class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-sm">🖨 طباعة
                        اللائحة</button>
                    <button type="button" onclick="document.getElementById('rankingModal').classList.add('hidden')"
                        class="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
                </div>
            </div>
            <div class="mb-4">
                <select id="rankingDeptSelect"
                    class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500">
                    <option value="">-- اختر القسم/المستوى لعرض الترتيب --</option>
                </select>
            </div>
            <div class="overflow-y-auto" id="rankingResultList">
                <p class="text-center text-gray-500">اختر قسماً لعرض ترتيب التلاميذ...</p>
            </div>
        </div>
    </div>

    <!-- Modal تسجيل الغياب -->
    <div id="absenceModal"
        class="hidden fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div class="bg-white rounded-xl p-6 w-full max-w-3xl shadow-lg max-h-full flex flex-col">
            <div class="flex justify-between items-center mb-4 border-b pb-3">
                <h3 class="text-xl font-bold text-red-700">🚩 تسجيل وتتبع الغياب</h3>
                <button type="button" onclick="document.getElementById('absenceModal').classList.add('hidden')"
                    class="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-4">
                <select id="absDeptSelect" class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500">
                    <option value="">-- اختر القسم --</option>
                </select>
                <select id="absSessionSelect"
                    class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"></select>
            </div>
            <div class="overflow-y-auto flex-grow" id="absStudentsList">
                <p class="text-center text-gray-500">اختر القسم والدورة لبدء تسجيل الغياب...</p>
            </div>
        </div>
    </div>

    <!-- Modal أداء الواجبات الشهرية -->
    <div id="performanceModal"
        class="hidden fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div class="bg-white rounded-xl p-6 w-full max-w-4xl shadow-lg max-h-full flex flex-col">
            <div class="flex justify-between items-center mb-4 border-b pb-3">
                <h3 class="text-xl font-bold text-purple-700">📊 أداء الواجبات الشهرية</h3>
                <button type="button" onclick="document.getElementById('performanceModal').classList.add('hidden')"
                    class="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-4">
                <select id="perfDeptSelect" class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
                    <option value="">-- اختر القسم --</option>
                </select>
                <select id="perfMonthSelect" class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
                    <option value="شتنبر">شتنبر</option>
                    <option value="أكتوبر">أكتوبر</option>
                    <option value="نونبر">نونبر</option>
                    <option value="دجنبر">دجنبر</option>
                    <option value="يناير">يناير</option>
                    <option value="فبراير">فبراير</option>
                    <option value="مارس">مارس</option>
                    <option value="أبريل">أبريل</option>
                    <option value="ماي">ماي</option>
                    <option value="يونيو">يونيو</option>
                </select>
            </div>
            <div class="overflow-y-auto flex-grow" id="perfStudentsList">
                <p class="text-center text-gray-500">اختر القسم والشهر لإدخال النقط...</p>
            </div>
        </div>
    </div>

    <!-- Modal بطاقة التلميذ -->
    <div id="studentModal"
        class="hidden fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div class="bg-white rounded-xl p-6 w-full max-w-2xl shadow-lg max-h-full overflow-y-auto">
            <h3 id="studentModalTitle" class="text-xl font-bold text-green-700 mb-4">بطاقة التلميذ</h3>
            <form id="studentDetailForm" class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <input type="hidden" id="studentIdInput">
                <!-- قسم الصورة -->
                <div class="flex flex-col items-center justify-center">
                    <img id="studentImagePreview" src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                        alt="صورة التلميذ" class="w-32 h-32 rounded-full object-cover border-4 border-gray-200 mb-2">
                    <input type="file" id="studentImageInput" class="hidden" accept="image/*">
                    <div class="flex gap-4">
                        <label for="studentImageInput"
                            class="cursor-pointer text-sm text-indigo-600 hover:text-indigo-800">تغيير
                            الصورة</label>
                        <button type="button" id="deleteImageBtn" class="text-sm text-red-600 hover:text-red-800">حذف
                            الصورة</button>
                    </div>
                </div>
                <!-- قسم الحقول -->
                <div id="studentFieldsContainer" class="space-y-4 md:col-span-2"></div>
                <button type="button" id="addNewFieldBtn"
                    class="md:col-span-2 mt-2 text-sm text-blue-600 hover:text-blue-800">+ إضافة خانة جديدة</button>
                <button type="button" id="printCardBtn"
                    class="hidden md:col-span-3 mt-4 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg w-full">🖨️
                    طباعة البطاقة</button>
                <div class="flex justify-end gap-4 mt-6 md:col-span-3">
                    <button type="button" id="studentModalCancel"
                        class="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400">إلغاء</button>
                    <button type="submit" id="studentModalSave"
                        class="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white">حفظ
                        المعلومات</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        const appStorage = {
            _getPrefix: () => {
                // استخراج رقم الهاتف من الجلسة المخزنة مباشرة لضمان الـ prefix الصحيح دائماً
                try {
                    const session = JSON.parse(localStorage.getItem("sub_appSession") || "null");
                    if (session && session.phone) return "sub_" + session.phone + "_";
                } catch (e) { }
                return "sub_" + (localStorage.getItem("sub_cloudUserId") || "default") + "_";
            },
            getItem: (k) => {
                if (k === 'appSession' || k === 'cloudUserId' || k === 'firebaseDatabaseURL' || k === 'lastSeenGlobalYear') return localStorage.getItem("sub_" + k);
                return localStorage.getItem(appStorage._getPrefix() + k);
            },
            setItem: (k, v) => {
                if (k === 'appSession' || k === 'cloudUserId' || k === 'firebaseDatabaseURL' || k === 'lastSeenGlobalYear') return localStorage.setItem("sub_" + k, v);
                localStorage.setItem(appStorage._getPrefix() + k, v);
            },
            removeItem: (k) => {
                if (k === 'appSession' || k === 'cloudUserId' || k === 'firebaseDatabaseURL' || k === 'lastSeenGlobalYear') return localStorage.removeItem("sub_" + k);
                localStorage.removeItem(appStorage._getPrefix() + k);
            }
        };















        feather.replace();

        const instanceId = Date.now().toString() + Math.random().toString().slice(2, 6);

        // --- وظيفة ضغط الصور لتقليل الحجم ---
        async function compressImage(file, maxWidth = 600, quality = 0.6) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                        canvas.width = width;
                        canvas.height = height;
                        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL('image/jpeg', quality));
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
        }

        // --- Firebase Configuration ---
        // Attempt to get saved URL or use default
        const defaultDbUrl = "https://ustad-bilal-default-rtdb.firebaseio.com";
        let savedDatabaseURL = appStorage.getItem("firebaseDatabaseURL") || defaultDbUrl;

        const firebaseConfig = {
            apiKey: "AIzaSyCy2livge5Mfjl1-fcYAtDY38dsSiXMm8g",
            authDomain: "ustad-bilal.firebaseapp.com",
            databaseURL: savedDatabaseURL,
            projectId: "ustad-bilal",
            storageBucket: "ustad-bilal.firebasestorage.app",
            messagingSenderId: "861185596180",
            appId: "1:861185596180:web:93b7f3311294808d9a0001",
            measurementId: "G-8QWMYCCPKW"
        };

        // Initialize Firebase
        if (!firebase.apps.length) {
            try {
                const app = firebase.initializeApp(firebaseConfig);
                firebase.analytics();
            } catch (e) { console.error("Firebase Init Error", e); }
        } else {
            firebase.app(); // if already initialized, use that one
        }

        // Re-initialize if URL changes
        function updateFirebaseConfig(newUrl) {
            if (!newUrl) return;
            appStorage.setItem("firebaseDatabaseURL", newUrl);
            alert("تم حفظ الرابط. سيتم إعادة تحميل الصفحة لتطبيق التغييرات.");
            location.reload();
        }

        document.getElementById('saveFirebaseConfig').addEventListener('click', () => {
            const url = document.getElementById('firebaseDbUrlInput').value.trim();
            if (url) updateFirebaseConfig(url);
        });

        // Load config into input
        document.getElementById('firebaseDbUrlInput').value = savedDatabaseURL;

        const db = firebase.database();
        const auth = firebase.auth();
        const fs = firebase.firestore();

        let currentUser = null;

        // ============================================================
        // === نظام المصادقة المخصص (رقم هاتف + كلمة سر) ===
        // ============================================================

        const ADMIN_PHONE = '0662065072';
        const ADMIN_PASS_RAW = 'Benhazem@1988';

        // دالة hash بسيطة لتشفير كلمة السر
        function simpleHash(str) {
            let hash = 0;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return 'h' + Math.abs(hash).toString(36);
        }

        // الجلسة الحالية
        let currentSession = null;

        function loadSession() {
            try {
                const s = appStorage.getItem('appSession');
                return s ? JSON.parse(s) : null;
            } catch { return null; }
        }

        function saveSession(session) {
            appStorage.setItem('appSession', JSON.stringify(session));
        }

        function clearSession() {
            const keysToRemove = [
                'appSession', 'cloudUserId', 'academicData', 'academicYears',
                'currentAcademicYear', 'studentFields', 'institutionName',
                'migration_v3_complete', 'lastUpdated', 'selectedHomeDept',
                'selectedHomeStudent', 'imagesLockedState', 'selectedDeptForStudents',
                'lastSeenGlobalYear'
            ];
            keysToRemove.forEach(k => appStorage.removeItem(k));
        }

        // تهيئة نظام المصادقة عند تحميل الصفحة
        async function initAuth() {
            const session = loadSession();
            if (session && session.phone) {
                currentSession = session;
                onLoginSuccess(session);
            } else {
                showLoginScreen();
            }
        }

        function showLoginScreen() {
            document.getElementById('loginOverlay').classList.remove('hidden');
        }

        function hideLoginScreen() {
            document.getElementById('loginOverlay').classList.add('hidden');
        }

        async function loginUser() {
            const phone = document.getElementById('loginPhone').value.trim();
            const password = document.getElementById('loginPassword').value;
            const errEl = document.getElementById('loginError');
            const btnText = document.getElementById('loginBtnText');

            errEl.textContent = '';
            if (!phone || !password) {
                errEl.textContent = 'يرجى إدخال رقم الهاتف وكلمة السر.';
                return;
            }

            btnText.textContent = 'جاري التحقق...';
            document.getElementById('loginBtn').disabled = true;

            try {
                // التحقق من حساب الأدمن المضمّن
                if (phone === ADMIN_PHONE && password === ADMIN_PASS_RAW) {
                    const session = { phone: ADMIN_PHONE, name: 'المدير', isAdmin: true, levels: [], institution: '' };
                    currentSession = session;
                    saveSession(session);
                    onLoginSuccess(session);
                    return;
                }

                // التحقق من حسابات المستخدمين في Firestore
                const doc = await fs.collection('accounts').doc(phone).get();
                if (!doc.exists) {
                    errEl.textContent = '❌ رقم الهاتف غير موجود.';
                    return;
                }
                const data = doc.data();
                const inputHash = simpleHash(password);
                if (data.passwordHash !== inputHash) {
                    errEl.textContent = '❌ كلمة السر غير صحيحة.';
                    return;
                }

                const session = {
                    phone: phone,
                    name: data.name || phone,
                    isAdmin: false,
                    levels: data.levels || [],
                    institution: data.institution || ''
                };
                currentSession = session;
                saveSession(session);
                onLoginSuccess(session);

            } catch (e) {
                console.error('Login error:', e);
                errEl.textContent = '❌ خطأ في الاتصال. تأكد من إعدادات Firebase.';
            } finally {
                btnText.textContent = 'تسجيل الدخول';
                document.getElementById('loginBtn').disabled = false;
            }
        }

        function onLoginSuccess(session) {
            hideLoginScreen();

            // عرض اسم المستخدم وزر الخروج
            const nameEl = document.getElementById('headerUserName');
            const logoutBtn = document.getElementById('logoutBtn');
            nameEl.textContent = '👤 ' + session.name;
            nameEl.classList.remove('hidden');
            logoutBtn.classList.remove('hidden');

            // عرض بطاقة الإدارة للأدمن
            if (session.isAdmin) {
                document.getElementById('adminCard').classList.remove('hidden');
            } else {
                // تحميل بيانات المدير (السنة والأقسام) من Firestore
                loadAdminSharedData();
            }

            // استخدام رقم الهاتف كـ cloudUserId
            cloudUserId = session.phone;
            appStorage.setItem('cloudUserId', cloudUserId);

            // بدء المزامنة السحابية
            startFirestoreSync(cloudUserId);
            signIn();

            feather.replace();
        }

        // تحميل بيانات المدير المشتركة (السنة الحالية والأقسام) للمشتركين
        async function loadAdminSharedData() {
            try {
                const adminDoc = await fs.collection('users').doc(ADMIN_PHONE).get();
                if (adminDoc.exists) {
                    const data = adminDoc.data();
                    // استخدام السنة الدراسية التي حددها المدير
                    if (data.currentAcademicYear) {
                        appStorage.setItem('currentAcademicYear', data.currentAcademicYear);
                        currentAcademicYear = data.currentAcademicYear;
                    }

                    // تحميل قائمة السنوات كاحتياطي إذا لم تكن موجودة في الإعدادات العامة
                    if (data.academicYears && academicYears.length === 0) {
                        appStorage.setItem('academicYears', JSON.stringify(data.academicYears));
                        academicYears = data.academicYears;

                        let acData = JSON.parse(appStorage.getItem("academicData") || "{}");
                        let changedAcData = false;
                        academicYears.forEach(year => {
                            if (!acData[year]) {
                                acData[year] = { departments: [], students: [], subjects: [], grades: {}, monthlyGrades: {}, studentReports: {}, reportImagesByGender: { 'ذكر': [], 'أنثى': [] } };
                                changedAcData = true;
                            }
                        });
                        if (changedAcData) {
                            appStorage.setItem("academicData", JSON.stringify(acData));
                            academicData = acData;
                        }
                    }
                    // استخدام بيانات السنة من بيانات المدير (لأجل الأقسام)
                    if (data.academicData && data.currentAcademicYear) {
                        const adminYearData = data.academicData[data.currentAcademicYear] || {};
                        // تحديث الأقسام محليا للسنة الحالية فقط
                        if (!academicData[currentAcademicYear]) academicData[currentAcademicYear] = {};
                        let adminDepts = adminYearData.departments || [];

                        // فلترة الأقسام حسب المستويات المخصصة للمشترك
                        const userLevels = currentSession && currentSession.levels ? currentSession.levels : [];
                        if (userLevels.length > 0) {
                            adminDepts = adminDepts.filter(d => {
                                const dName = typeof d === 'string' ? d : (d.name || '');
                                return userLevels.includes(dName);
                            });
                        }

                        academicData[currentAcademicYear].departments = adminDepts;
                        departments = adminDepts;

                        // تحميل بيانات المشترك الخاصة للسنة الحالية (التلاميذ، النقط، إلخ)
                        loadDataForCurrentYear();

                        // تحديث واجهة المستخدم
                        refreshUI();
                        renderHomeStudents();
                        console.log('تم تحميل بيانات المدير: ', departments.length, 'قسم');
                    }
                } else {
                    console.log('لا توجد بيانات مدير بعد.');
                }
            } catch (e) {
                console.error('خطأ تحميل بيانات المدير:', e);
            }
        }

        function logoutUser() {
            if (!confirm('هل تريد تسجيل الخروج؟')) return;
            clearSession();
            currentSession = null;
            if (fsUnsubscribe) fsUnsubscribe();
            location.reload();
        }

        // ============================================================
        // === إدارة الحسابات (للأدمن فقط) ===
        // ============================================================

        async function openAdminPanel() {
            if (!currentSession || !currentSession.isAdmin) return;
            document.getElementById('adminModal').classList.remove('hidden');
            renderAccLevelsCheckboxes();
            await loadAccountsList();
            feather.replace();
        }

        function renderAccLevelsCheckboxes(selectedLevels = []) {
            const container = document.getElementById('accLevelsCheckboxes');
            if (!departments || departments.length === 0) {
                container.innerHTML = '<span class="text-gray-400 text-xs">لا توجد مستويات معرّفة في الإعدادات</span>';
                return;
            }
            container.innerHTML = departments.map(dept => {
                const deptName = typeof dept === 'string' ? dept : (dept.name || dept.id);
                const checked = selectedLevels.includes(deptName) ? 'checked' : '';
                return `<label class="flex items-center gap-1 text-sm bg-indigo-50 px-2 py-1 rounded cursor-pointer">
                        <input type="checkbox" class="acc-level-cb" value="${deptName}" ${checked}>
                        ${deptName}
                    </label>`;
            }).join('');
        }

        async function loadAccountsList() {
            const listEl = document.getElementById('accountsList');
            listEl.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">جاري التحميل...</p>';
            try {
                const snap = await fs.collection('accounts').get();
                if (snap.empty) {
                    listEl.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">لا توجد حسابات بعد.</p>';
                    return;
                }
                listEl.innerHTML = snap.docs.map(doc => {
                    const d = doc.data();
                    const levels = (d.levels || []).join('، ') || 'جميع المستويات';
                    return `<div class="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                            <div>
                                <p class="font-bold text-gray-800">${d.name || '—'}</p>
                                <p class="text-xs text-gray-500 dir-ltr">${doc.id}</p>
                                <p class="text-xs text-indigo-600 mt-0.5">المستويات: ${levels}</p>
                            </div>
                            <div class="flex gap-2">
                                <button onclick="editAccount('${doc.id}')"
                                    class="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1 rounded-lg text-xs">✏️ تعديل</button>
                                <button onclick="deleteAccount('${doc.id}')"
                                    class="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg text-xs">🗑️ حذف</button>
                            </div>
                        </div>`;
                }).join('');
            } catch (e) {
                listEl.innerHTML = '<p class="text-red-500 text-sm text-center py-4">خطأ في تحميل البيانات: ' + e.message + '</p>';
            }
        }

        async function editAccount(phone) {
            const doc = await fs.collection('accounts').doc(phone).get();
            if (!doc.exists) return;
            const d = doc.data();
            document.getElementById('accountFormTitle').textContent = '✏️ تعديل الحساب';
            document.getElementById('accName').value = d.name || '';
            document.getElementById('accInstitution').value = d.institution || '';
            document.getElementById('accPhone').value = phone;
            document.getElementById('accPhone').readOnly = true;
            document.getElementById('accPassword').value = '';
            document.getElementById('accEditingPhone').value = phone;
            document.getElementById('accCancelBtn').classList.remove('hidden');
            renderAccLevelsCheckboxes(d.levels || []);
        }

        function cancelAccountEdit() {
            document.getElementById('accountFormTitle').textContent = '➕ إضافة حساب جديد';
            document.getElementById('accName').value = '';
            document.getElementById('accInstitution').value = '';
            document.getElementById('accPhone').value = '';
            document.getElementById('accPhone').readOnly = false;
            document.getElementById('accPassword').value = '';
            document.getElementById('accEditingPhone').value = '';
            document.getElementById('accCancelBtn').classList.add('hidden');
            renderAccLevelsCheckboxes([]);
        }

        async function saveAccount() {
            const name = document.getElementById('accName').value.trim();
            const institution = document.getElementById('accInstitution').value.trim();
            const phone = document.getElementById('accPhone').value.trim();
            const password = document.getElementById('accPassword').value;
            const editing = document.getElementById('accEditingPhone').value;
            const selectedLevels = Array.from(document.querySelectorAll('.acc-level-cb:checked')).map(cb => cb.value);

            if (!name || !phone) { alert('يرجى إدخال الاسم ورقم الهاتف.'); return; }
            if (!editing && !password) { alert('يرجى إدخال كلمة السر للحساب الجديد.'); return; }

            const accData = { name, institution, levels: selectedLevels };
            if (password) accData.passwordHash = simpleHash(password);

            try {
                await fs.collection('accounts').doc(phone).set(accData, { merge: true });
                alert(editing ? '✅ تم تعديل الحساب بنجاح!' : '✅ تم إنشاء الحساب بنجاح!');
                cancelAccountEdit();
                await loadAccountsList();
            } catch (e) {
                alert('❌ خطأ: ' + e.message);
            }
        }

        async function deleteAccount(phone) {
            if (!confirm('هل تريد حذف حساب ' + phone + '؟ لن يتم حذف بياناته.')) return;
            try {
                await fs.collection('accounts').doc(phone).delete();
                await loadAccountsList();
            } catch (e) {
                alert('❌ خطأ: ' + e.message);
            }
        }

        // ربط زر الدخول
        document.getElementById('loginBtn').addEventListener('click', loginUser);
        document.getElementById('loginPassword').addEventListener('keydown', e => {
            if (e.key === 'Enter') loginUser();
        });

        // --- Authentication Logic (Anonymous) ---
        async function signIn() {
            if (window.location.protocol === 'file:') {
                console.log("Firebase Auth is disabled on file://. Accessing Firestore directly using fallback cloudUserId.");
                return;
            }

            try {
                console.log("Attempting anonymous sign-in...");
                await auth.signInAnonymously();
                updateCloudStatus('synced-remote'); // Feedback on success
            } catch (error) {
                console.error("Anonymous Auth Full Error:", error);
                if (error.code === 'auth/operation-not-allowed') alert("خطأ في السحابة: يجب تفعيل 'Anonymous Auth' في إعدادات مشروع Firebase الخاص بك.");
                let msg = error.message;
                if (error.code === 'auth/operation-not-allowed') {
                    msg = "خاصية Anonymous Auth معطلة في Firebase Console.";
                }
                updateCloudStatus('error', msg);
            }
        }

        let fsUnsubscribe = null;

        function startFirestoreSync(docId) {
            if (!docId) return;
            if (fsUnsubscribe) fsUnsubscribe();
            console.log("Starting Firestore sync for docId:", docId);
            fsUnsubscribe = fs.collection('users').doc(docId).onSnapshot(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    // Ignore our own updates
                    if (data.lastUpdatedBy === instanceId) return;

                    const localLastUpdated = appStorage.getItem("lastUpdated");
                    // فقط إذا كانت البيانات المحلية أحدث بشكل صريح، ندفعها للسحابة
                    // إذا كانت السحابة أحدث أو متساوية من جهاز آخر، نطبقها فوراً
                    if (localLastUpdated && data.lastUpdated && new Date(localLastUpdated) > new Date(data.lastUpdated)) {
                        console.log("Local is strictly newer. Pushing to cloud.");
                        saveToFirebase();
                        return;
                    }
                    console.log("Syncing Firestore data from remote device...");
                    syncLocalData(data);
                } else {
                    // If no Firestore data, try migrating from old RTDB backup
                    migrateFromRTDB(docId);
                }
            }, error => {
                console.error("Firestore Sync Error:", error);
                updateCloudStatus('error', error.message);
            });
        }

        let globalUnsubscribe = null;
        function listenToGlobalSettings() {
            if (globalUnsubscribe) globalUnsubscribe();
            console.log("Listening to global settings...");
            globalUnsubscribe = fs.collection('settings').doc('global').onSnapshot(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    let lastSeenGlobalYear = appStorage.getItem("lastSeenGlobalYear");
                    let needsRefresh = false;

                    if (data.academicYears) {
                        appStorage.setItem("academicYears", JSON.stringify(data.academicYears));
                        academicYears = data.academicYears;
                        needsRefresh = true;
                    }

                    if (data.currentAcademicYear && data.currentAcademicYear !== lastSeenGlobalYear) {
                        appStorage.setItem("currentAcademicYear", data.currentAcademicYear);
                        appStorage.setItem("lastSeenGlobalYear", data.currentAcademicYear);
                        currentAcademicYear = data.currentAcademicYear;
                        needsRefresh = true;
                    }

                    if (needsRefresh) {
                        let acData = JSON.parse(appStorage.getItem("academicData") || "{}");
                        let changedAcData = false;
                        academicYears.forEach(year => {
                            if (!acData[year]) {
                                acData[year] = { departments: [], students: [], subjects: [], grades: {}, monthlyGrades: {}, studentReports: {}, reportImagesByGender: { 'ذكر': [], 'أنثى': [] } };
                                changedAcData = true;
                            }
                        });
                        if (changedAcData) {
                            appStorage.setItem("academicData", JSON.stringify(acData));
                            academicData = acData;
                        }

                        try {
                            renderAcademicYears();
                            loadDataForCurrentYear();
                            refreshUI();
                        } catch (e) {
                            console.error("Error refreshing UI after global settings update:", e);
                        }
                    }
                }
            }, error => {
                console.error("Global Settings Sync Error:", error);
            });
        }

        // Listen for Auth State Changes
        auth.onAuthStateChanged(user => {
            if (user) {
                currentUser = user;
                console.log("Logged in anonymously as:", user.uid);
                cloudUserId = user.uid;
                appStorage.setItem("cloudUserId", user.uid);
                startFirestoreSync(cloudUserId);
                listenToGlobalSettings();
            } else {
                currentUser = null;
                console.log("Not logged in. Using fallback cloudUserId:", cloudUserId);
                startFirestoreSync(cloudUserId);
                listenToGlobalSettings();
                signIn(); // Background login if not logged in
            }
        });

        async function migrateFromRTDB(docId) {
            try {
                const snapshot = await db.ref('backup/' + docId).once('value');
                let data = snapshot.val();
                // تم إيقاف سحب backup/latest الافتراضي لكي لا تظهر بيانات المدير للمشتركين الجدد
                if (data) {
                    console.log("Migrating data from RTDB to Firestore...");
                    await saveUserData(data);
                    syncLocalData(data);
                } else {
                    console.log("No previous backup found for this user.");
                    const localAcademicData = appStorage.getItem("academicData");
                    if (!localAcademicData || localAcademicData === "{}" || localAcademicData === "[]") {
                        console.log("Local storage is empty. Starting fresh.");
                        const emptyData = {
                            academicData: {},
                            academicYears: [],
                            currentAcademicYear: null,
                            institutionName: ""
                        };
                        syncLocalData(emptyData);
                    } else {
                        console.log("Local storage has unsaved data. Triggering save to cloud.");
                        saveToFirebase();
                    }
                }
            } catch (e) {
                console.error("Migration Error:", e);
            }
        }

        function syncLocalData(data) {
            if (data.academicData) {
                // استرجاع الصور المحفوظة محلياً لأنها تُحذف عند الرفع للسحابة لتوفير المساحة
                if (academicData) {
                    for (const year in data.academicData) {
                        if (academicData[year]) {
                            if (academicData[year].reportImagesByGender) {
                                data.academicData[year].reportImagesByGender = academicData[year].reportImagesByGender;
                            }
                            if (data.academicData[year].students && academicData[year].students) {
                                data.academicData[year].students.forEach(incomingStudent => {
                                    const localStudent = academicData[year].students.find(s => s.id === incomingStudent.id);
                                    if (localStudent && localStudent.photo) {
                                        incomingStudent.photo = localStudent.photo;
                                    }
                                    if (localStudent && localStudent.info && localStudent.info['الصورة']) {
                                        if (!incomingStudent.info) incomingStudent.info = {};
                                        incomingStudent.info['الصورة'] = localStudent.info['الصورة'];
                                    }
                                });
                            }
                            if (data.academicData[year].studentReports && academicData[year].studentReports) {
                                for (const sid in data.academicData[year].studentReports) {
                                    if (academicData[year].studentReports[sid] && academicData[year].studentReports[sid].photo) {
                                        data.academicData[year].studentReports[sid].photo = academicData[year].studentReports[sid].photo;
                                    }
                                }
                            }
                        }
                    }
                }
                appStorage.setItem("academicData", JSON.stringify(data.academicData));
                academicData = data.academicData;
            }

            if (currentSession && !currentSession.isAdmin) {
                // حساب فرعي: لا نحدث السنوات الدراسية ولا الحقول من هنا بل من بيانات المدير
            } else {
                if (data.academicYears) { appStorage.setItem("academicYears", JSON.stringify(data.academicYears)); academicYears = data.academicYears; }
                if (data.currentAcademicYear) { appStorage.setItem("currentAcademicYear", data.currentAcademicYear); currentAcademicYear = data.currentAcademicYear; }
                if (data.studentFields) { appStorage.setItem("studentFields", JSON.stringify(data.studentFields)); studentFields = data.studentFields; }
            }

            if (data.institutionName) { appStorage.setItem("institutionName", data.institutionName); institutionName = data.institutionName; }
            if (data.lastUpdated) appStorage.setItem("lastUpdated", data.lastUpdated);

            loadDataForCurrentYear();

            if (currentSession && !currentSession.isAdmin) {
                loadAdminSharedData();
            } else {
                refreshUI();
            }
            updateCloudStatus('synced-remote');
        }

        // --- Firestore Data Persistence ---
        async function saveUserData(data) {
            const targetDocId = currentUser ? currentUser.uid : cloudUserId;
            if (!targetDocId) {
                console.warn("Save failed: No persistent cloudUserId or UID available.");
                updateCloudStatus('error');
                return;
            }
            try {
                updateCloudStatus('saving');
                await fs.collection('users').doc(targetDocId).set(data);
                updateCloudStatus('saved');
            } catch (error) {
                console.error("Firestore Save Error:", error);
                updateCloudStatus('error', error.message);
                if (error.code === 'permission-denied') {
                    console.error("Firestore Permission Denied. Check your Security Rules.");
                }
            }
        }

        async function loadUserData(uid) {
            // Already handled by onSnapshot in auth listener
        }

        // Utility: Debounce
        function debounce(func, wait) {
            let timeout;
            return function (...args) {
                const context = this;
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(context, args), wait);
            };
        }

        // Firebase Functions - Auto Save Only
        function saveToFirebase() {
            updateCloudStatus('saving');

            // إزالة الصور (base64) من البيانات قبل الرفع للسحابة لتفادي تجاوز الحد الأقصى للحجم (1MB)
            function stripImagesFromAcademicData(rawData) {
                if (!rawData || typeof rawData !== 'object') return rawData;
                const stripped = {};
                for (const year in rawData) {
                    stripped[year] = { ...rawData[year] };
                    // استبدال الصور بمصفوفة فارغة - تبقى الصور محلياً فقط
                    stripped[year].reportImagesByGender = { 'ذكر': [], 'أنثى': [] };
                    // إزالة صور الطلاب الفردية من studentReports إن وُجدت
                    if (stripped[year].studentReports) {
                        const cleanReports = {};
                        for (const sid in stripped[year].studentReports) {
                            const rep = { ...stripped[year].studentReports[sid] };
                            if (rep.photo) delete rep.photo;
                            cleanReports[sid] = rep;
                        }
                        stripped[year].studentReports = cleanReports;
                    }
                    // إزالة صور الطلاب من قائمة students
                    if (stripped[year].students) {
                        stripped[year].students = stripped[year].students.map(s => {
                            const clean = { ...s };
                            if (clean.photo) delete clean.photo;
                            if (clean.info && clean.info['الصورة']) {
                                clean.info = { ...clean.info };
                                delete clean.info['الصورة'];
                            }
                            return clean;
                        });
                    }
                }
                return stripped;
            }

            const rawAcademicData = JSON.parse(appStorage.getItem("academicData") || "{}");
            const dataToSave = {
                academicData: stripImagesFromAcademicData(rawAcademicData),
                academicYears: JSON.parse(appStorage.getItem("academicYears") || "[]"),
                studentFields: JSON.parse(appStorage.getItem("studentFields") || "[]"),
                currentAcademicYear: appStorage.getItem("currentAcademicYear"),
                institutionName: appStorage.getItem("institutionName"),
                lastUpdated: new Date().toISOString(),
                lastUpdatedBy: instanceId
            };

            appStorage.setItem("lastUpdated", dataToSave.lastUpdated);

            // Save to Firestore (primary storage)
            saveUserData(dataToSave);

            // Save to RTDB for backup
            const targetDocId = currentUser ? currentUser.uid : cloudUserId;
            db.ref('backup/' + targetDocId).set(dataToSave)
                .then(() => {
                    updateCloudStatus('saved');
                })
                .catch((error) => {
                    console.error("Firebase Auto-Save Error:", error);
                    updateCloudStatus('error', error.message);
                });
        }

        // Debounced Auto-Save (Waits 2 seconds after last change to run)
        const autoSaveToFirebase = debounce(() => saveToFirebase(), 2000);

        let lastCloudError = "";

        // Update Status Helper for Cloud Sync
        function updateCloudStatus(status, errorMsg = "") {
            const statusEl = document.getElementById('cloudStatus');
            if (!statusEl) return;
            statusEl.classList.remove('hidden', 'text-gray-500', 'text-yellow-600', 'text-green-600', 'text-red-600', 'text-blue-600');
            if (errorMsg) lastCloudError = errorMsg;

            if (status === 'saving') {
                statusEl.innerHTML = `<i data-feather="loader" class="w-3 h-3 animate-spin inline"></i> جاري الحفظ...`;
                statusEl.classList.add('text-yellow-600');
                statusEl.title = "";
            } else if (status === 'saved') {
                statusEl.innerHTML = `<i data-feather="check" class="w-3 h-3 inline"></i> تم الحفظ`;
                statusEl.classList.add('text-green-600');
                statusEl.title = "";
                setTimeout(() => statusEl.classList.add('hidden'), 3000);
            } else if (status === 'error') {
                statusEl.innerHTML = `<i data-feather="cloud-off" class="w-3 h-3 inline"></i> السحابة غير متصلة`;
                statusEl.classList.add('text-red-600');
                statusEl.style.cursor = "help";
                statusEl.title = "انقر لمزيد من التفاصيل عن الخطأ";
                if (!statusEl.onclick) {
                    statusEl.onclick = () => {
                        if (lastCloudError) alert("⚠️ تفاصيل الخطأ:\n" + lastCloudError);
                        else alert("⚠️ فشل الاتصال بالسحابة. تأكد من إعدادات Firebase وتفعيل Anonymous Auth.");
                    };
                }
            } else if (status === 'synced-remote') {
                statusEl.innerHTML = `<i data-feather="refresh-cw" class="w-3 h-3 inline"></i> تمت المزامنة`;
                statusEl.classList.add('text-blue-600');
                statusEl.title = "";
                setTimeout(() => statusEl.classList.add('hidden'), 3000);
            }
            feather.replace();
        }

        // Attach Events
        // (Manual cloud save button removed - auto-save handles all syncing)

        // --- نظام السنوات الدراسية ---
        let academicYears = JSON.parse(appStorage.getItem("academicYears") || "[]");
        let currentAcademicYear = appStorage.getItem("currentAcademicYear");
        let academicData = JSON.parse(appStorage.getItem("academicData") || "{}");

        let studentFields = JSON.parse(appStorage.getItem("studentFields"));

        // ترحيل البيانات القديمة إلى النظام الجديد (يُنفذ مرة واحدة فقط)
        function migrateOldData() {
            if (appStorage.getItem("migration_v3_complete") === "true") return;

            let migrationPerformed = false;
            const oldDepts = appStorage.getItem("departments");
            if (oldDepts && !Object.keys(academicData).length) { // Check if academicData is empty
                const defaultYear = "2023/2024";
                if (!academicYears.includes(defaultYear)) {
                    academicYears = [defaultYear];
                    academicData[defaultYear] = {
                        departments: JSON.parse(oldDepts || "[]"),
                        students: JSON.parse(appStorage.getItem("students") || "[]"),
                        subjects: JSON.parse(appStorage.getItem("subjects") || "[]"),
                        grades: JSON.parse(appStorage.getItem("grades") || "{}"),
                        monthlyGrades: JSON.parse(appStorage.getItem("monthlyGrades") || "{}"),
                    };
                    ['departments', 'students', 'subjects', 'grades', 'monthlyGrades'].forEach(k => appStorage.removeItem(k));
                    migrationPerformed = true;
                }
            }

            Object.values(academicData).forEach(yearData => {
                (yearData.students || []).forEach(student => { // Migrate old student.name to student.info
                    if (typeof student.name === 'string') {
                        student.info = { "الاسم الكامل (بالعربية)": student.name };
                        delete student.name;
                        migrationPerformed = true;
                    }
                    if (student.info && student.info.hasOwnProperty('الاسم الكامل')) { // Migrate old field name
                        student.info['الاسم الكامل (بالعربية)'] = student.info['الاسم الكامل'];
                        delete student.info['الاسم الكامل'];
                        migrationPerformed = true;
                    }
                });
            });

            if (!studentFields) {
                studentFields = ["الاسم الكامل (بالعربية)", "Nom et Prénom (en Français)", "الجنس", "تاريخ الازدياد", "مكان الازدياد", "هاتف ولي الأمر"];
                appStorage.setItem("studentFields", JSON.stringify(studentFields));
                migrationPerformed = true;
            }

            if (migrationPerformed) {
                appStorage.setItem("academicData", JSON.stringify(academicData));
                appStorage.setItem("academicYears", JSON.stringify(academicYears));
                alert("تم تحديث بنية البيانات بنجاح.");
            }
            appStorage.setItem("migration_v3_complete", "true");
        }
        migrateOldData();

        // تعيين السنة الدراسية الحالية — يعتمد على اختيار المدير المحفوظ في localStorage
        if (!currentAcademicYear || !academicYears.includes(currentAcademicYear)) {
            // إذا لم يكن هناك اختيار محفوظ، اختر السنة الأولى من القائمة أو اتركها فارغة
            currentAcademicYear = academicYears.length > 0 ? academicYears[0] : null;
            if (currentAcademicYear) appStorage.setItem("currentAcademicYear", currentAcademicYear);
        }


        // معرف مستمر خاص بالجهاز للمزامنة عند استخدام بروتوكول file://
        let cloudUserId = appStorage.getItem("cloudUserId");
        if (!cloudUserId) {
            cloudUserId = 'user_' + Date.now().toString() + '_' + Math.random().toString().slice(2, 10);
            appStorage.setItem("cloudUserId", cloudUserId);
        }

        // البيانات الحالية بناءً على السنة المختارة
        let departments = [], students = [], subjects = [], grades = {}, monthlyGrades = {}, studentReports = {}, reportActivities = [], reportBehaviors = [], generalObservations = [], institutionName = "", reportSessions = [], absences = {}, scoreObservations = []; // studentFields is now global
        let customFinalAverageLabels = []; //  <-- إضافة متغير جديد لحفظ النصوص المخصصة
        let globalFinalAverageLabel = 'المعدل العام السنوي'; // <-- متغير جديد لحفظ الاختيار العام
        if (currentAcademicYear && academicData[currentAcademicYear]) {
            const data = academicData[currentAcademicYear];
            departments = data.departments || [];
            students = data.students || [];
            subjects = data.subjects || [];
            grades = data.grades || {};
            institutionName = appStorage.getItem("institutionName") || "";
            monthlyGrades = data.monthlyGrades || {};
            studentReports = data.studentReports || {};
            generalObservations = data.generalObservations || ["يتحسن", "مجهود طيب", "عمل حسن", "يحتاج إلى تركيز", "يشارك", "لا يشارك"];
            reportActivities = data.reportActivities || ["القرآن الكريم", "القيم والعادات", "اللغة العربية", "الرياضيات", "الأنشطة العلمية"];
            reportBehaviors = data.reportBehaviors || ["المواظبة على الحضور", "السلوك داخل القسم"];
            reportSessions = data.reportSessions || ["الدورة الأولى", "الدورة الثانية"];
            reportImagesByGender = data.reportImagesByGender || { 'ذكر': [], 'أنثى': [] };
            scoreObservations = data.scoreObservations || [{ min: 8, max: 10, text: "ممتاز" }, { min: 7, max: 7.99, text: "جيد جدا" }, { min: 6, max: 6.99, text: "حسن" }, { min: 5, max: 5.99, text: "مقبول" }, { min: 0, max: 4.99, text: "يحتاج لمجهود" }];
            customFinalAverageLabels = data.customFinalAverageLabels || []; // <-- تحميل النصوص المحفوظة
            absences = data.absences || {};
            globalFinalAverageLabel = data.globalFinalAverageLabel || 'المعدل العام السنوي'; // <-- تحميل الاختيار المحفوظ
        }
        const allReportItems = [...reportActivities, ...reportBehaviors];
        // saveAll
        const saveAll = () => {
            // تحديث بيانات السنة الحالية فقط
            if (currentAcademicYear) {
                academicData[currentAcademicYear] = { departments, students, subjects, grades, monthlyGrades, studentReports, reportActivities, reportBehaviors, generalObservations, reportSessions, absences, reportImagesByGender, customFinalAverageLabels, globalFinalAverageLabel, scoreObservations };
            }
            try {
                appStorage.setItem("academicData", JSON.stringify(academicData));
            } catch (e) {
                alert("خطأ: مساحة التخزين ممتلئة! يرجى تقليل حجم الصور أو حذف البيانات القديمة.");
            }
            appStorage.setItem("academicYears", JSON.stringify(academicYears));
            appStorage.setItem("currentAcademicYear", currentAcademicYear);
            appStorage.setItem("institutionName", institutionName);
            appStorage.setItem("studentFields", JSON.stringify(studentFields));

            // تشغيل المزامنة التلقائية عند أي تغيير في البيانات
            autoSaveToFirebase();
        }

        const loadDataForCurrentYear = () => {
            if (currentAcademicYear && academicData[currentAcademicYear]) {
                const data = academicData[currentAcademicYear];
                if (currentSession && !currentSession.isAdmin) {
                    // للمشترك الفرعي: نترك الأقسام كما حمّلها loadAdminSharedData
                } else {
                    departments = data.departments || [];
                }
                students = data.students || [];
                subjects = data.subjects || [];
                grades = data.grades || {};
                institutionName = appStorage.getItem("institutionName") || "";
                monthlyGrades = data.monthlyGrades || {};
                studentReports = data.studentReports || {};
                generalObservations = data.generalObservations || ["يتحسن", "مجهود طيب", "عمل حسن", "يحتاج إلى تركيز", "يشارك", "لا يشارك"];
                reportActivities = data.reportActivities || ["القرآن الكريم", "القيم والعادات", "اللغة العربية", "الرياضيات", "الأنشطة العلمية"];
                reportBehaviors = data.reportBehaviors || ["المواظبة على الحضور", "السلوك داخل القسم"];
                reportSessions = data.reportSessions || ["الدورة الأولى", "الدورة الثانية"];
                reportImagesByGender = data.reportImagesByGender || { 'ذكر': [], 'أنثى': [] };
                scoreObservations = data.scoreObservations || [{ min: 8, max: 10, text: "ممتاز" }, { min: 7, max: 7.99, text: "جيد جدا" }, { min: 6, max: 6.99, text: "حسن" }, { min: 5, max: 5.99, text: "مقبول" }, { min: 0, max: 4.99, text: "يحتاج لمجهود" }];
                customFinalAverageLabels = data.customFinalAverageLabels || [];
                absences = data.absences || {};
                globalFinalAverageLabel = data.globalFinalAverageLabel || 'المعدل العام السنوي';
            }
            allReportItems.splice(0, allReportItems.length, ...reportActivities, ...reportBehaviors);
        }

        const refreshUI = () => {
            renderStats();
            renderDepartments();
            renderStudents();
            renderReportActivities();
            renderGeneralObservations();
            renderReportSessions();
            renderScoreObservations();
            renderYearList();
            renderGeneralSettings();
            renderAcademicYears();
            renderRankingDeptOptions();

            // Clear student selection and view
            homeDeptSelect.value = "";
            homeStudentSelect.innerHTML = `<option value="">-- اختر تلميذ --</option>`;
            homeStudentInfo.textContent = "";
            studentDisplaySection.classList.add("hidden");
            homeStudentCount.textContent = "";
            tableDeptLabel.textContent = "";
        }

        // إحصائيات
        function renderStats() {
            const totalDeptsEl = document.getElementById("totalDepts");
            if (totalDeptsEl) totalDeptsEl.textContent = departments.length;
            document.getElementById("totalStudents").textContent = students.length;
        }

        // تنقّل
        const homePage = document.getElementById("homePage");
        const settingsPage = document.getElementById("settingsPage");
        document.getElementById("openSettings").onclick = () => {
            homePage.classList.add("hidden");
            settingsPage.classList.remove("hidden");

            // إخفاء/إظهار التبويبات بناءً على صلاحيات المستخدم
            const isAdmin = currentSession && currentSession.isAdmin;
            const allTabBtns = document.querySelectorAll('#settingsTabsBar .tab-btn');
            let firstVisible = null;
            allTabBtns.forEach(btn => {
                const adminOnly = btn.dataset.adminOnly === 'true';
                if (adminOnly && !isAdmin) {
                    btn.classList.add('hidden');
                } else {
                    btn.classList.remove('hidden');
                    if (!firstVisible) firstVisible = btn;
                }
            });
            // تفعيل أول تبويب مرئي
            if (firstVisible) {
                allTabBtns.forEach(b => b.classList.remove('tab-active'));
                firstVisible.classList.add('tab-active');
                document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
                const targetTab = document.getElementById(firstVisible.dataset.target);
                if (targetTab) targetTab.classList.remove('hidden');
                if (firstVisible.dataset.target === 'studentsTab') renderStudents();
            }
        };
        document.getElementById("backHome").onclick = () => {
            settingsPage.classList.add("hidden");
            homePage.classList.remove("hidden");
            try { homeDeptSelect.value = ""; homeStudentSelect.value = ""; } catch (e) { }
            document.getElementById("studentReportSection").classList.add("hidden");
            document.getElementById("homeStudentInfo").textContent = "";
            document.getElementById("studentFullTableSection").classList.add("hidden");
            document.getElementById("tableDeptLabel").textContent = "";
            renderHomeStudents();
        };

        // التبويبات
        document.querySelectorAll(".tab-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("tab-active"));
                btn.classList.add("tab-active");
                const targetId = btn.dataset.target;
                document.querySelectorAll(".tab-content").forEach(c => c.classList.add("hidden"));
                document.getElementById(targetId).classList.remove("hidden");

                // استدعاء دوال التحديث عند فتح التبويب لضمان عرض أحدث البيانات
                switch (targetId) {
                    case 'yearsTab': renderYearList(); break;
                    case 'deptsTab': renderDepartments(); break;
                    case 'studentsTab': renderStudents(); break;
                    case 'activitiesTab': renderReportActivities(); break;
                    case 'sessionsTab': renderReportSessions(); break;
                    case 'observationsTab': renderGeneralObservations(); break;
                    case 'observationsTab': renderScoreObservations(); break;
                    case 'generalSettingsTab': renderGeneralSettings(); break;

                }
            });
        });

        // مودال التأكيد
        let currentDeleteCallback = null;
        const modal = document.getElementById("modalConfirm");
        const modalText = document.getElementById("modalText");
        document.getElementById("modalCancel").onclick = () => { modal.classList.add("hidden"); currentDeleteCallback = null; };
        document.getElementById("modalConfirmBtn").onclick = () => { if (currentDeleteCallback) currentDeleteCallback(); modal.classList.add("hidden"); };

        // عناصر رئيسية
        const homeDeptSelect = document.getElementById("homeDeptSelect");
        const homeStudentSelect = document.getElementById("homeStudentSelect");
        const homeStudentInfo = document.getElementById("homeStudentInfo");
        const homeGreeting = document.getElementById("homeGreeting");
        const studentDisplaySection = document.getElementById("studentDisplaySection");
        const homeStudentCount = document.getElementById("homeStudentCount");
        const clearSelection = document.getElementById("clearSelection");
        const academicYearSelect = document.getElementById("academicYearSelect");
        const tableDeptLabel = document.getElementById("tableDeptLabel");

        // عناصر الإعدادات/التلاميذ
        const deptForm = document.getElementById("deptForm");
        const deptList = document.getElementById("deptList");
        const deptSelectForStudents = document.getElementById("deptSelectForStudents");

        const deptSearch = document.getElementById("deptSearch");

        const studentList = document.getElementById("studentList");
        const studentSearch = document.getElementById("studentSearch");

        // --- إدارة السنوات الدراسية (واجهة المستخدم) ---
        const reportSessionSelect = document.getElementById("reportSessionSelect");
        const yearForm = document.getElementById("yearForm");
        const yearList = document.getElementById("yearList");
        const yearNameInput = document.getElementById("yearName");

        const prevYearBtn = document.getElementById("prevYearBtn");
        const nextYearBtn = document.getElementById("nextYearBtn");

        function renderAcademicYears() {
            academicYearSelect.innerHTML = "";
            const yearSelectForStudents = document.getElementById("yearSelectForStudents");
            if (yearSelectForStudents) yearSelectForStudents.innerHTML = "";
            academicYears.forEach(year => {
                academicYearSelect.appendChild(new Option(year, year));
                if (yearSelectForStudents) {
                    yearSelectForStudents.appendChild(new Option(year, year));
                }
            });
            academicYearSelect.value = currentAcademicYear;
            if (yearSelectForStudents) yearSelectForStudents.value = currentAcademicYear;
            const currentIndex = academicYears.indexOf(currentAcademicYear);
            prevYearBtn.disabled = currentIndex <= 0;
            nextYearBtn.disabled = currentIndex >= academicYears.length - 1;
            renderYearList();
        }

        yearForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const yearName = yearNameInput.value.trim();
            if (yearName && /^\d{4}\/\d{4}$/.test(yearName) && !academicYears.includes(yearName)) {
                academicYears.push(yearName);
                academicData[yearName] = { departments: [], students: [], subjects: [], grades: {}, monthlyGrades: {} };
                saveAll();
                renderAcademicYears();
                yearNameInput.value = "";
            } else {
                alert("الرجاء إدخال سنة دراسية بالصيغة الصحيحة (مثال: 2025/2026) وغير مكررة.");
            }
        });

        function renderYearList() {
            yearList.innerHTML = "";
            if (academicYears.length === 0) {
                yearList.innerHTML = `<p class="text-gray-500 text-center">لا توجد سنوات دراسية</p>`;
                return;
            }
            academicYears.forEach(year => {
                const li = document.createElement("li");
                li.className = "flex justify-between items-center bg-gray-50 p-3 rounded-lg";
                const isCurrent = year === currentAcademicYear;
                li.innerHTML = `
            <span class="font-medium ${isCurrent ? 'text-purple-700' : ''}">${year} ${isCurrent ? '<span class="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full mr-1">✅ الحالية</span>' : ''}</span>
            <div class="flex gap-2">
                ${!isCurrent ? `<button class="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm transition-btn" onclick="setCurrentYear('${year}')">🎯 تعيين كسنة حالية</button>` : ''}
                <button class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-btn" onclick="deleteYear('${year}')">حذف</button>
            </div>
        `;
                yearList.appendChild(li);
            });
        }

        function setCurrentYear(year) {
            if (!academicYears.includes(year)) return;
            currentAcademicYear = year;
            appStorage.setItem("currentAcademicYear", currentAcademicYear);

            // مزامنة مع Firestore لحفظ اختيار المدير
            saveAll();

            // تحديث محدد السنة في رأس الصفحة
            academicYearSelect.value = currentAcademicYear;
            const yearSelectForStudents = document.getElementById("yearSelectForStudents");
            if (yearSelectForStudents) yearSelectForStudents.value = currentAcademicYear;
            const currentIndex = academicYears.indexOf(currentAcademicYear);
            prevYearBtn.disabled = currentIndex <= 0;
            nextYearBtn.disabled = currentIndex >= academicYears.length - 1;

            loadDataForCurrentYear();
            refreshUI();

            // إعادة رسم قائمة السنوات لتحديث علامة "الحالية"
            renderYearList();
        }

        function deleteYear(year) {
            if (academicYears.length <= 1) {
                alert("لا يمكن حذف آخر سنة دراسية.");
                return;
            }
            modalText.textContent = `هل تريد حذف السنة الدراسية "${year}"؟ سيتم حذف جميع بياناتها (الأقسام، التلاميذ، الدرجات...).`;
            currentDeleteCallback = () => {
                academicYears = academicYears.filter(y => y !== year);
                delete academicData[year];
                if (currentAcademicYear === year) {
                    currentAcademicYear = academicYears[0];
                }
                saveAll();
                loadDataForCurrentYear();
                refreshUI();
            };
            modal.classList.remove("hidden");
        }

        academicYearSelect.addEventListener("change", function () {
            appStorage.setItem("currentAcademicYear", this.value);
            currentAcademicYear = this.value;
            loadDataForCurrentYear();
            refreshUI();
        });

        document.getElementById('yearSelectForStudents').addEventListener('change', function () {
            appStorage.setItem("currentAcademicYear", this.value);
            currentAcademicYear = this.value;
            academicYearSelect.value = this.value;
            loadDataForCurrentYear();
            refreshUI();
        });

        prevYearBtn.addEventListener("click", function () {
            const currentIndex = academicYears.indexOf(currentAcademicYear);
            if (currentIndex > 0) {
                const newYear = academicYears[currentIndex - 1];
                currentAcademicYear = newYear;
                appStorage.setItem("currentAcademicYear", newYear);
                loadDataForCurrentYear();
                refreshUI();
            }
        });

        nextYearBtn.addEventListener("click", function () {
            const currentIndex = academicYears.indexOf(currentAcademicYear);
            if (currentIndex < academicYears.length - 1) {
                const newYear = academicYears[currentIndex + 1];
                currentAcademicYear = newYear;
                appStorage.setItem("currentAcademicYear", newYear);
                loadDataForCurrentYear();
                refreshUI();
            }
        });

        // عرض التلاميذ في الصفحة الرئيسية حسب القسم
        let selectedHomeStudentId = null;

        function renderHomeStudents() {
            // استرجاع القسم المختار من التخزين
            const savedDept = appStorage.getItem("selectedHomeDept");
            if (savedDept && homeDeptSelect.querySelector(`option[value="${savedDept}"]`)) {
                homeDeptSelect.value = savedDept;
            }
            const deptId = homeDeptSelect.value;
            homeStudentSelect.innerHTML = `<option value="">-- اختر تلميذ --</option>`;
            selectedHomeStudentId = null;
            homeStudentInfo.textContent = "";
            studentDisplaySection.classList.add("hidden");
            tableDeptLabel.textContent = "";

            if (deptId) {
                const d = departments.find(x => x.id == deptId);
                if (d) {
                    homeGreeting.innerHTML = `<div class="text-2xl font-bold text-indigo-700">مرحبا بك</div>
                               <div class="mt-1 text-lg text-indigo-600">القسم: <strong>${d.name}</strong></div>`;
                } else homeGreeting.innerHTML = "";
            } else homeGreeting.innerHTML = "";

            if (!deptId) {
                homeStudentCount.textContent = "";
                return;
            }
            const filtered = students.filter(s => s.deptId == deptId && !s.isDroppedOut);
            homeStudentCount.textContent = `عدد التلاميذ في القسم: ${filtered.length}`;
            filtered.forEach(s => {
                homeStudentSelect.appendChild(new Option(s.info['الاسم الكامل (بالعربية)'], s.id));
            });

            // استرجاع التلميذ المختار من التخزين واجعله هو المختار حتى تغييره يدويا
            const savedStudent = appStorage.getItem("selectedHomeStudent");
            if (savedStudent && homeStudentSelect.querySelector(`option[value="${savedStudent}"]`)) {
                homeStudentSelect.value = savedStudent;
                selectHomeStudent(savedStudent);
            }
        }

        homeDeptSelect.addEventListener("change", function () {
            appStorage.setItem("selectedHomeDept", homeDeptSelect.value);
            renderHomeStudents();
        });
        // عند تحميل الصفحة، إذا كان هناك تلميذ محدد، اعرض بياناته مباشرة
        homeStudentSelect.addEventListener("change", function () {
            appStorage.setItem("selectedHomeStudent", homeStudentSelect.value);
            const val = homeStudentSelect.value;
            if (!val) {
                selectedHomeStudentId = null;
                homeStudentInfo.textContent = "";
                studentDisplaySection.classList.add("hidden");
                tableDeptLabel.textContent = "";
                return;
            }
            selectHomeStudent(val);
        });

        window.addEventListener('load', () => {
            if (appStorage.getItem("selectedHomeStudent")) renderHomeStudents();
        });

        clearSelection.addEventListener("click", () => {
            homeStudentSelect.value = "";
            appStorage.removeItem("selectedHomeStudent");
            selectedHomeStudentId = null;
            homeStudentInfo.textContent = "";
            studentDisplaySection.classList.add("hidden");
            tableDeptLabel.textContent = "";
        });

        // عرض بيانات التلميذ والدورات
        function selectHomeStudent(id) {
            selectedHomeStudentId = id;
            const s = students.find(x => String(x.id) === String(id));
            if (!s) return;
            const deptName = departments.find(d => d.id == s.deptId)?.name || '-';
            homeStudentInfo.textContent = `التلميذ: ${s.info['الاسم الكامل (بالعربية)'] || ''} — القسم: ${deptName}`;
            tableDeptLabel.textContent = `النتيجة المدرسية للتلميذ: ${s.info['الاسم الكامل (بالعربية)'] || ''}`;

            renderNewReportCard(id);
            studentDisplaySection.classList.remove("hidden");
        }
        reportSessionSelect.addEventListener("change", () => {
            if (selectedHomeStudentId) {
                renderNewReportCard(selectedHomeStudentId);
                updateFinalGradesTable(selectedHomeStudentId); // إضافة هذا السطر لتحديث جدول المعدلات عند تغيير الدورة
            }
        });

        function renderNewReportCard(studentId) {
            const student = students.find(s => String(s.id) === String(studentId));
            if (!student) return;

            // حفظ الدورة المختارة حالياً قبل إعادة بناء القائمة
            const previouslySelectedSession = reportSessionSelect.value;

            // تعبئة قائمة الدورات
            reportSessionSelect.innerHTML = reportSessions.map(s => `<option value="${s}">${s}</option>`).join('');
            if (previouslySelectedSession) reportSessionSelect.value = previouslySelectedSession; // إعادة تحديد الدورة السابقة
            const selectedSession = reportSessionSelect.value;

            const studentReportData = studentReports[studentId] || {};
            const reportData = studentReportData[selectedSession] || {};
            const dept = departments.find(d => d.id === student.deptId);

            const studentDeptId = student.deptId;
            const studentActivities = reportActivities.filter(act => {
                if (!act) return false;
                if (typeof act === 'string') return true;
                if (Array.isArray(act.deptIds)) {
                    return act.deptIds.includes('all') || act.deptIds.map(String).includes(String(studentDeptId));
                }
                const dId = act.deptId || 'all';
                return dId === 'all' || String(dId) === String(studentDeptId);
            }).map(act => act && typeof act === 'object' ? act.name : act);

            const studentBehaviors = reportBehaviors.filter(beh => {
                if (!beh) return false;
                if (typeof beh === 'string') return true;
                if (Array.isArray(beh.deptIds)) {
                    return beh.deptIds.includes('all') || beh.deptIds.map(String).includes(String(studentDeptId));
                }
                const dId = beh.deptId || 'all';
                return dId === 'all' || String(dId) === String(studentDeptId);
            }).map(beh => beh && typeof beh === 'object' ? beh.name : beh);

            // تحديث عنوان النتيجة باسم الدورة المختارة فقط
            document.getElementById('reportCardTitle').textContent = `النتائج الدراسية - ${selectedSession}`;

            // تعبئة الحقول
            const institutionField = document.querySelector('#sheet [data-field="institution"]');
            const institutionValue = (currentSession && currentSession.institution) ? currentSession.institution : (institutionName || '');
            institutionField.innerHTML = institutionValue.replace(/\n/g, '<br>'); // تحويل الأسطر الجديدة إلى <br>

            document.querySelector('#sheet [data-field="level"]').textContent = dept?.name || '';
            document.querySelector('#sheet [data-field="academicYear"]').textContent = currentAcademicYear || '';
            document.querySelector('#sheet [data-field="studentName"]').textContent = student.info['الاسم الكامل (بالعربية)'] || ''; // استخدام بيانات التلميذ مباشرة

            // عرض صورة التلميذ
            const studentImage = student.info?.['صورة'] || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
            document.getElementById('reportCardStudentImage').src = studentImage;

            // حساب وعرض الغياب
            const studentSessionAbsences = (absences[studentId] && absences[studentId][selectedSession]) ? absences[studentId][selectedSession] : [];
            const justifiedAbsences = studentSessionAbsences.filter(a => a.type === 'justified').length;
            const unjustifiedAbsences = studentSessionAbsences.filter(a => a.type === 'unjustified').length;
            document.querySelector('#sheet [data-field="absences_justified"]').textContent = justifiedAbsences;
            document.querySelector('#sheet [data-field="absences_unjustified"]').textContent = unjustifiedAbsences;

            // تعبئة قائمة ملاحظات الأستاذ
            const teacherNoteSelect = document.querySelector('[data-field="teacher_notes_select"]');
            const teacherNoteCustom = document.querySelector('[data-field="teacher_notes_custom"]');
            const teacherNoteOptions = `<option value="">-- اختر ملاحظة --</option>` + generalObservations.map(obs => `<option value="${obs}">${obs}</option>`).join('') + `<option value="custom">ملاحظة مخصصة...</option>`;
            teacherNoteSelect.innerHTML = teacherNoteOptions;

            // إظهار/إخفاء حقل الملاحظة المخصصة
            teacherNoteSelect.onchange = function () {
                if (this.value === 'custom') {
                    teacherNoteCustom.classList.remove('hidden');
                    teacherNoteCustom.value = ''; // مسح القيمة القديمة
                } else {
                    teacherNoteCustom.classList.add('hidden');
                }
                saveReportCard(studentId);
            };
            teacherNoteCustom.onblur = () => {
                saveReportCard(studentId);
            };


            // بناء جداول الأنشطة ديناميكياً
            const activitiesBody = document.getElementById('reportActivitiesBody');
            activitiesBody.innerHTML = '';
            const observationOptions = `<option value="">-- اختر ملاحظة --</option>` + generalObservations.map(obs => `<option value="${obs}">${obs}</option>`).join('') + `<option value="custom">ملاحظة مخصصة...</option>`;

            // عرض الأنشطة التربوية
            if (studentActivities.length > 0) {
                const firstActivity = studentActivities[0];
                const tr = document.createElement('tr');
                tr.innerHTML = `
            <td rowspan="${studentActivities.length}" style="border: 1px solid #ddd; padding: 8px; text-align: center; vertical-align: middle; font-weight: bold;">الأنشطة التربوية</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${firstActivity}</td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #fef9c3;"><input type="number" class="w-20 text-center border-gray-300 rounded-md p-1 activity-score" data-row="${firstActivity}" data-col="assessment" placeholder="نقطة" min="0" max="10" step="0.01"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;" class="observation-cell" data-row="${firstActivity}"></td>
        `;
                activitiesBody.appendChild(tr);

                for (let i = 1; i < studentActivities.length; i++) {
                    const activity = studentActivities[i];
                    const nextTr = document.createElement('tr');
                    nextTr.innerHTML = `
                <td style="border: 1px solid #ddd; padding: 8px;">${activity}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #fef9c3;"><input type="number" class="w-20 text-center border-gray-300 rounded-md p-1 activity-score" data-row="${activity}" data-col="assessment" placeholder="نقطة" min="0" max="10" step="0.01"></td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;" class="observation-cell" data-row="${activity}"></td>
            `;
                    activitiesBody.appendChild(nextTr);
                }
            }

            // عرض المواظبة والسلوك
            if (studentBehaviors.length > 0) {
                const behaviorItemsHTML = studentBehaviors.map(b => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px dotted #ccc;">
                <span>${b}</span>
                <input type="number" class="w-20 text-center border-gray-300 rounded-md p-1 behavior-score" data-row="${b}" data-col="score" placeholder="نقطة" min="0" max="10" step="0.01">
            </div>
        `).join('');

                const behaviorTr = document.createElement('tr');
                behaviorTr.innerHTML = `
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; vertical-align: middle; font-weight: bold;">المواظبة والسلوك</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${behaviorItemsHTML}</td>
            <td id="behaviorTotalAssessment" style="border: 1px solid #ddd; padding: 8px; text-align: center; vertical-align: middle; font-weight: bold; background-color: #fef9c3;"></td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center;" class="observation-cell" data-row="behavior_summary"></td>
        `;
                activitiesBody.appendChild(behaviorTr);
            }

            // تعبئة الجداول
            const reportTablesData = reportData.tables || {};
            document.querySelectorAll('#sheet .editable[data-row], #sheet .behavior-score, #sheet .activity-score, #sheet .editable[data-field], #sheet .award-cb').forEach(cell => {
                const rowKey = cell.dataset.row;
                const colKey = cell.dataset.col;
                const fieldKey = cell.dataset.field;

                if (rowKey) { // بيانات جدول الأنشطة
                    const savedValue = reportTablesData[rowKey]?.[colKey] || '';
                    fillCell(cell, savedValue);
                    updateObservationCell(rowKey, savedValue);
                } else if (fieldKey) { // بيانات الحقول الإضافية
                    // استثناء الحقول التي لا يجب تحميلها من البيانات المحفوظة
                    const isNonLoadableField = ['studentName', 'level', 'academicYear', 'institution'].includes(fieldKey);
                    if (isNonLoadableField) return;

                    const isSessionSpecificField = ['teacher_notes_select', 'teacher_notes_custom', 'award_commendation', 'award_encouragement', 'award_honor', 'award_warning'].includes(fieldKey);
                    const sourceObject = isSessionSpecificField ? reportData : studentReportData;
                    const savedValue = sourceObject[fieldKey] || '';
                    fillCell(cell, savedValue);
                }
            });

            // منطق خاص لتحميل ملاحظات الأستاذ
            const savedNoteSelect = reportData['teacher_notes_select'] || '';
            const savedNoteCustom = reportData['teacher_notes_custom'] || '';
            teacherNoteSelect.value = savedNoteSelect;
            if (savedNoteSelect === 'custom') {
                teacherNoteCustom.classList.remove('hidden');
                teacherNoteCustom.value = savedNoteCustom;
            } else {
                teacherNoteCustom.classList.add('hidden');
            }


            calculateSessionAverage(true, studentActivities.length); // حساب التقدير عند العرض

            updateFinalGradesTable(studentId);

            // مسح الصور القديمة ورسم الجديدة
            const studentGender = student.info?.['الجنس'] || 'ذكر'; // افتراضي إلى ذكر إذا لم يحدد
            document.querySelectorAll('#sheet .draggable').forEach(el => el.remove());
            const imagesToRender = reportImagesByGender[studentGender] || [];
            imagesToRender.forEach(imgData => {
                createDraggableImage(imgData.src, imgData);
            });

            // حفظ التغييرات عند التعديل
            document.querySelectorAll('#sheet .editable, #sheet .award-cb, #sheet .report-note-select').forEach(el => {
                const eventType = el.matches('.award-cb') ? 'change' : 'blur';
                el.addEventListener(eventType, () => {
                    saveReportCard(studentId);
                });
            });

            document.querySelectorAll('#sheet .behavior-score, #sheet .activity-score').forEach(input => {
                input.oninput = (e) => {
                    let value = parseFloat(e.target.value);
                    // التحقق من أن القيمة بين 0 و 10
                    if (e.target.value !== '' && (isNaN(value) || value > 10 || value < 0)) {
                        alert("قيمة خاطئة");
                        e.target.value = ''; // مسح القيمة الخاطئة
                        return; // منع الحفظ والتحديث
                    }
                    updateObservationCell(e.target.dataset.row, e.target.value);
                    calculateSessionAverage(true, studentActivities.length);
                    saveReportCard(studentId);
                    updateFinalGradesTable(studentId); // تحديث فوري للمعدلات
                };
            });
            document.querySelectorAll('#sheet .award-cb').forEach(cb => {
                cb.onchange = () => saveReportCard(studentId);
            });

            // إضافة مستمع حدث التغيير للقائمة المنسدلة للمعدل النهائي
            const finalAverageSelect = document.getElementById('finalAverageLabelSelect');
            if (finalAverageSelect) {
                finalAverageSelect.addEventListener('change', (e) => {
                    const studentId = selectedHomeStudentId;
                    if (e.target.value === 'custom') {
                        const customText = prompt('أدخل النص المخصص لخانة المعدل:');
                        if (customText !== null) {
                            const newLabel = customText.trim();
                            // إضافة النص الجديد إلى القائمة العامة إذا لم يكن موجوداً
                            if (!customFinalAverageLabels.includes(newLabel)) {
                                customFinalAverageLabels.push(newLabel);
                            }
                            // حفظ القيمة الجديدة كاختيار عام
                            globalFinalAverageLabel = newLabel;
                            saveReportCard(studentId); // حفظ التغييرات
                            renderNewReportCard(studentId); // إعادة رسم الواجهة لتحديث القائمة
                        }
                    } else if (e.target.value === 'delete-custom') {
                        const labelToDelete = prompt('أدخل النص المخصص الذي تريد حذفه بالضبط:');
                        if (labelToDelete && customFinalAverageLabels.includes(labelToDelete)) {
                            customFinalAverageLabels = customFinalAverageLabels.filter(l => l !== labelToDelete);
                            // إذا كان النص المحذوف هو المستخدم حالياً، ارجع للقيمة الافتراضية
                            if (globalFinalAverageLabel === labelToDelete) globalFinalAverageLabel = 'المعدل العام السنوي';
                            saveAll();
                            renderNewReportCard(studentId);
                        } else if (labelToDelete) {
                            alert('النص الذي أدخلته غير موجود في قائمة النصوص المخصصة.');
                        }
                    } else {
                        saveReportCard(studentId); // حفظ الاختيار العادي
                    }
                });
            }
        }

        function updateObservationCell(rowKey, score) {
            const scoreValue = parseFloat(score);
            const cell = document.querySelector(`.observation-cell[data-row="${rowKey}"]`);
            if (!cell) return;

            let observationText = '';
            if (!isNaN(scoreValue)) {
                const foundObs = scoreObservations.find(obs => scoreValue >= obs.min && scoreValue <= obs.max);
                if (foundObs) observationText = foundObs.text;
            }
            cell.textContent = observationText;
        }
        function updateFinalGradesTable(studentId) {
            // عرض جدول المعدلات النهائية
            const finalGradesHeader = document.getElementById('finalGradesHeader');
            const finalGradesBody = document.getElementById('finalGradesBody');
            let headerHTML = '<tr>';
            let bodyHTML = '<tr>';

            // دمج الخيارات الافتراضية مع الخيارات المخصصة المحفوظة
            const defaultOptions = ['معدل المرحلة الأولى', 'معدل المرحلة الثانية', 'المعدل العام السنوي'];
            const allOptions = [...new Set([...defaultOptions, ...customFinalAverageLabels])];

            const optionsHTML = allOptions.map(opt =>
                `<option value="${opt}" ${globalFinalAverageLabel === opt ? 'selected' : ''}>${opt}</option>`
            ).join('');

            const finalAverageDropdownHTML = `
        <select id="finalAverageLabelSelect" class="w-full bg-transparent text-center font-bold focus:outline-none p-1">${optionsHTML}<option value="custom">نص مخصص...</option><option value="delete-custom" class="text-red-500">حذف نص مخصص...</option></select>
    `;

            const studentReportData = studentReports[studentId] || {};
            let sessionAvgs = [];

            reportSessions.forEach(session => {
                headerHTML += `<th style="border: 1px solid #ddd; padding: 8px;">معدل ${session}</th>`;
                // استخدام المعدل اليدوي إن وجد، وإلا المحسوب تلقائياً
                const autoAvg = parseFloat(studentReportData[session]?.behaviorAverage) || 0;
                const manualAvg = studentReportData[session]?.manualAverage;
                const displayAvg = (manualAvg !== undefined && manualAvg !== '') ? parseFloat(manualAvg) : autoAvg;
                const hasManual = (manualAvg !== undefined && manualAvg !== '');

                sessionAvgs.push({ session, autoAvg, displayAvg });

                bodyHTML += `<td style="border: 1px solid #ddd; padding: 4px; text-align:center;">
                        <div style="display:flex; align-items:center; justify-content:center; gap:4px;">
                            <input type="number"
                                class="session-avg-input"
                                data-session="${session}"
                                data-student="${studentId}"
                                value="${displayAvg > 0 ? displayAvg.toFixed(2) : ''}"
                                placeholder="—"
                                min="0" max="10" step="0.01"
                                style="width:70px; text-align:center; border:1px solid ${hasManual ? '#f59e0b' : '#d1d5db'}; border-radius:6px; padding:4px 2px; font-weight:bold; color:${hasManual ? '#b45309' : '#1d4ed8'}; background:${hasManual ? '#fef3c7' : '#fff'};">
                            ${hasManual ? `<button class="session-avg-reset" data-session="${session}" data-student="${studentId}" title="إعادة الحساب التلقائي" style="background:none;border:none;cursor:pointer;font-size:14px;color:#9ca3af;">↺</button>` : ''}
                        </div>
                    </td>`;
            });

            // حساب المعدل العام السنوي
            const validAvgs = sessionAvgs.filter(s => s.displayAvg > 0);
            const totalSum = validAvgs.reduce((sum, s) => sum + s.displayAvg, 0);
            const manualFinalAvg = studentReportData._manualFinalAverage;
            const autoFinalAvg = validAvgs.length > 0 ? (totalSum / validAvgs.length).toFixed(2) : '-';
            const displayFinalAvg = (manualFinalAvg !== undefined && manualFinalAvg !== '') ? manualFinalAvg : autoFinalAvg;
            const hasFinalManual = (manualFinalAvg !== undefined && manualFinalAvg !== '');

            headerHTML += `<th style="border: 1px solid #ddd; padding: 0; background-color: #e0e7ff;">${finalAverageDropdownHTML}</th></tr>`;
            bodyHTML += `<td style="border: 1px solid #ddd; padding: 4px; background-color: #e0e7ff; text-align:center;">
                    <div style="display:flex; align-items:center; justify-content:center; gap:4px;">
                        <input type="number"
                            id="finalAvgInput"
                            data-student="${studentId}"
                            value="${displayFinalAvg !== '-' ? displayFinalAvg : ''}"
                            placeholder="—"
                            min="0" max="10" step="0.01"
                            style="width:70px; text-align:center; border:1px solid ${hasFinalManual ? '#f59e0b' : '#c7d2fe'}; border-radius:6px; padding:4px 2px; font-weight:bold; color:${hasFinalManual ? '#b45309' : '#1e3a8a'}; background:${hasFinalManual ? '#fef3c7' : '#ede9fe'};">
                        ${hasFinalManual ? `<button id="finalAvgReset" data-student="${studentId}" title="إعادة الحساب التلقائي" style="background:none;border:none;cursor:pointer;font-size:14px;color:#9ca3af;">↺</button>` : ''}
                    </div>
                </td></tr>`;

            finalGradesHeader.innerHTML = headerHTML;
            finalGradesBody.innerHTML = bodyHTML;

            // ===== مستمعو أحداث الإدخال =====
            // معدلات المراحل
            document.querySelectorAll('.session-avg-input').forEach(input => {
                input.addEventListener('change', function () {
                    const sid = this.dataset.student;
                    const sess = this.dataset.session;
                    if (!studentReports[sid]) studentReports[sid] = {};
                    if (!studentReports[sid][sess]) studentReports[sid][sess] = {};
                    const val = this.value.trim();
                    if (val === '') {
                        // مسح التعديل اليدوي → الرجوع للحساب التلقائي
                        delete studentReports[sid][sess].manualAverage;
                    } else {
                        const num = parseFloat(val);
                        if (isNaN(num) || num < 0 || num > 10) {
                            alert('قيمة غير صحيحة. يجب أن تكون بين 0 و 10.');
                            this.value = '';
                            return;
                        }
                        studentReports[sid][sess].manualAverage = num.toFixed(2);
                    }
                    saveAll();
                    updateFinalGradesTable(sid);
                });
            });

            // أزرار إعادة الحساب للمراحل
            document.querySelectorAll('.session-avg-reset').forEach(btn => {
                btn.addEventListener('click', function () {
                    const sid = this.dataset.student;
                    const sess = this.dataset.session;
                    if (studentReports[sid]?.[sess]) {
                        delete studentReports[sid][sess].manualAverage;
                    }
                    saveAll();
                    updateFinalGradesTable(sid);
                });
            });

            // المعدل العام السنوي
            const finalAvgInput = document.getElementById('finalAvgInput');
            if (finalAvgInput) {
                finalAvgInput.addEventListener('change', function () {
                    const sid = this.dataset.student;
                    if (!studentReports[sid]) studentReports[sid] = {};
                    const val = this.value.trim();
                    if (val === '') {
                        delete studentReports[sid]._manualFinalAverage;
                    } else {
                        const num = parseFloat(val);
                        if (isNaN(num) || num < 0 || num > 10) {
                            alert('قيمة غير صحيحة. يجب أن تكون بين 0 و 10.');
                            this.value = '';
                            return;
                        }
                        studentReports[sid]._manualFinalAverage = num.toFixed(2);
                    }
                    saveAll();
                    updateFinalGradesTable(sid);
                });
            }

            // زر إعادة الحساب للمعدل العام
            const finalAvgReset = document.getElementById('finalAvgReset');
            if (finalAvgReset) {
                finalAvgReset.addEventListener('click', function () {
                    const sid = this.dataset.student;
                    if (studentReports[sid]) {
                        delete studentReports[sid]._manualFinalAverage;
                    }
                    saveAll();
                    updateFinalGradesTable(sid);
                });
            }
        }

        function fillCell(cell, value) {
            if (cell.tagName === 'SELECT') {
                if (cell.querySelector(`option[value="${value}"]`)) {
                    cell.value = value;
                } else if (value) {
                    cell.value = 'custom';
                }
            } else if (cell.type === 'checkbox') {
                cell.checked = !!value;
            } else if (cell.tagName === 'INPUT') {
                cell.value = value;
            } else {
                cell.textContent = value;
            }
        }

        function saveReportCard(studentId, customNoteUpdate = null) {
            if (!studentReports[studentId]) studentReports[studentId] = {}; // تهيئة بيانات التلميذ إذا لم تكن موجودة
            const studentReportData = studentReports[studentId];
            const selectedSession = reportSessionSelect.value;
            if (!studentReportData[selectedSession]) studentReportData[selectedSession] = {}; // تهيئة بيانات الدورة

            // حفظ القيمة من القائمة المنسدلة للمعدل
            const finalAverageSelect = document.getElementById('finalAverageLabelSelect');
            if (finalAverageSelect && finalAverageSelect.value !== 'custom' && finalAverageSelect.value !== 'delete-custom') {
                globalFinalAverageLabel = finalAverageSelect.value;
            }

            const reportData = studentReportData[selectedSession];

            // حفظ الحقول الرئيسية
            document.querySelectorAll('#sheet .editable[data-field], #sheet .award-cb[data-field]').forEach(el => {
                const field = el.dataset.field;
                // تحديد ما إذا كان الحقل خاصاً بالدورة أم عاماً للتلميذ
                const isSessionSpecificField = ['teacher_notes_select', 'teacher_notes_custom', 'award_commendation', 'award_encouragement', 'award_honor', 'award_warning'].includes(field);
                const isNonSavableField = ['studentName', 'level', 'academicYear', 'institution'].includes(field);
                const targetObject = isSessionSpecificField ? reportData : studentReportData;

                if (isNonSavableField) return; // تخطي حفظ هذه الحقول
                else if (el.type === 'checkbox') {
                    targetObject[field] = el.checked;
                } else {
                    targetObject[field] = el.textContent;
                }
            });

            // حفظ ملاحظات الأستاذ
            const teacherNoteSelect = document.querySelector('[data-field="teacher_notes_select"]');
            const teacherNoteCustom = document.querySelector('[data-field="teacher_notes_custom"]');
            reportData['teacher_notes_select'] = teacherNoteSelect.value;
            reportData['teacher_notes_custom'] = teacherNoteCustom.value;


            // حفظ بيانات الجداول (التقديرات والملاحظات)
            if (!reportData.tables) reportData.tables = {};
            document.querySelectorAll('#sheet .editable[data-row], #sheet .behavior-score, #sheet .activity-score').forEach(cell => {
                const rowKey = cell.dataset.row;
                const colKey = cell.dataset.col;
                if (!reportData.tables[rowKey]) reportData.tables[rowKey] = {};

                if (cell.tagName === 'SELECT') {
                    if (cell.value === 'custom') {
                        if (customNoteUpdate && customNoteUpdate.row === rowKey && customNoteUpdate.col === colKey) {
                            reportData.tables[rowKey][colKey] = customNoteUpdate.value;
                        }
                    } else {
                        reportData.tables[rowKey][colKey] = cell.value;
                    }
                } else if (cell.tagName === 'INPUT') {
                    reportData.tables[rowKey][colKey] = cell.value;
                } else {
                    reportData.tables[rowKey][colKey] = cell.textContent;
                }
            });
            // حفظ الملاحظات التلقائية
            document.querySelectorAll('.observation-cell').forEach(cell => {
                const rowKey = cell.dataset.row;
                if (!reportData.tables[rowKey]) reportData.tables[rowKey] = {};
                reportData.tables[rowKey]['notes'] = cell.textContent;
            });

            // حفظ التقدير العام للسلوك
            const student = students.find(s => String(s.id) === String(studentId));
            const studentDeptId = student ? student.deptId : null;
            const studentActivities = reportActivities.filter(act => {
                if (!act) return false;
                if (typeof act === 'string') return true;
                if (Array.isArray(act.deptIds)) {
                    return act.deptIds.includes('all') || act.deptIds.map(String).includes(String(studentDeptId));
                }
                const dId = act.deptId || 'all';
                return dId === 'all' || String(dId) === String(studentDeptId);
            });
            const { totalScore, average } = calculateSessionAverage(false, studentActivities.length); // استدعاء الدالة للحصول على القيم
            reportData.behaviorTotalAssessment = totalScore > 0 ? totalScore.toFixed(2) : ''; // حفظ المجموع
            reportData.behaviorAverage = average > 0 ? average.toFixed(2) : ''; // حفظ المعدل

            // حفظ الصور
            const studentGender = student?.info?.['الجنس'] || 'ذكر'; // افتراضي إلى ذكر

            // مسح وحفظ الصور بناءً على جنس التلميذ الحالي
            reportImagesByGender[studentGender] = [];
            document.querySelectorAll('#sheet .draggable').forEach(imgWrapper => {
                reportImagesByGender[studentGender].push({
                    src: imgWrapper.querySelector('img').src,
                    top: imgWrapper.style.top,
                    left: imgWrapper.style.left,
                    width: imgWrapper.style.width,
                    height: imgWrapper.style.height,
                });
            });

            saveAll();
        }

        function calculateSessionAverage(updateDOM = true, numberOfActivities = 0) {
            // جمع نقاط الأنشطة التربوية
            const activityScores = document.querySelectorAll('.activity-score');
            const totalActivityScore = Array.from(activityScores).reduce((sum, input) => sum + (parseFloat(input.value) || 0), 0);

            // جمع نقاط المواظبة والسلوك
            const behaviorScores = document.querySelectorAll('.behavior-score');
            const totalBehaviorScore = Array.from(behaviorScores).reduce((sum, input) => sum + (parseFloat(input.value) || 0), 0);

            // المجموع الكلي لجميع النقاط
            const grandTotalScore = totalActivityScore + totalBehaviorScore;

            // حساب المعدل حسب المعادلة الجديدة
            const denominator = numberOfActivities + 1;
            const average = denominator > 0 ? (grandTotalScore / denominator) : 0;

            if (updateDOM) {
                // عرض مجموع نقاط المواظبة والسلوك في خانته، مع وضع حد أقصى عند 10 للعرض فقط
                const displayScore = Math.min(totalBehaviorScore, 10);
                document.getElementById('behaviorTotalAssessment').textContent = displayScore.toFixed(2);

                // تحديث خلية الملاحظات الخاصة بالمواظبة والسلوك بناءً على تقديرها الإجمالي
                updateObservationCell('behavior_summary', displayScore);
            }

            return { totalScore: grandTotalScore, average };
        }

        function printNewReport() {
            const studentId = selectedHomeStudentId;
            if (!studentId) return;
            saveReportCard(studentId); // حفظ آخر التغييرات قبل الطباعة

            const sheet = document.getElementById('sheet').cloneNode(true);

            // إزالة عناصر التحكم في الصور وأزرار إعادة الحساب من النسخة المعدة للطباعة
            sheet.querySelectorAll('.resize-handle, .delete-image-btn, .session-avg-reset, #finalAvgReset').forEach(el => {
                el.remove();
            });

            // معالجة القائمة المنسدلة لملاحظات الأستاذ (يجب أن تتم قبل استبدال باقي الحقول)
            const originalTeacherNoteSelect = document.querySelector('#sheet [data-field="teacher_notes_select"]');
            const clonedTeacherNoteContainer = sheet.querySelector('[data-field="teacher_notes_select"]')?.parentElement;

            if (originalTeacherNoteSelect && clonedTeacherNoteContainer) {
                const text = document.createElement('span');
                if (originalTeacherNoteSelect.value === 'custom') {
                    const originalCustomTextarea = document.querySelector('#sheet [data-field="teacher_notes_custom"]');
                    text.textContent = originalCustomTextarea ? originalCustomTextarea.value : '';
                } else {
                    text.textContent = originalTeacherNoteSelect.value;
                }
                clonedTeacherNoteContainer.parentElement.innerHTML = `<strong>ملاحظات الأستاذ(ة):</strong><br>${text.textContent}`;
            }

            // الآن، بعد معالجة الحالات الخاصة، قم بتحويل بقية حقول الإدخال
            sheet.querySelectorAll('input[type="number"], input[type="text"], textarea').forEach(input => {
                const text = document.createElement('span');
                text.textContent = input.value;
                input.parentNode.replaceChild(text, input);
            });

            // معالجة القائمة المنسدلة للمعدل العام السنوي
            const finalAverageSelect = sheet.querySelector('#finalAverageLabelSelect');
            if (finalAverageSelect) {
                const text = document.createElement('span');
                text.textContent = finalAverageSelect.options[finalAverageSelect.selectedIndex].text;
                finalAverageSelect.parentNode.replaceChild(text, finalAverageSelect);
            }

            sheet.querySelectorAll('.observation-cell').forEach(cell => { cell.innerHTML = cell.textContent; });

            const content = sheet.innerHTML;
            const win = window.open('', '', 'width=900,height=700');
            win.document.write(`
        <html dir="rtl"><head>
            <title>النتيجة المدرسية</title>
            <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
            <style>
                @page {
                    size: A4;
                    margin: 0; /* No margin from the printer */
                }
                body { 
                    font-family: 'Tajawal', sans-serif; 
                    margin: 0; 
                    -webkit-print-color-adjust: exact; 
                    print-color-adjust: exact;
                }
                .page { 
                    width: 210mm;  /* A4 width */
                    height: 297mm; /* A4 height */
                    margin: 0; 
                    padding: 10mm; /* 10mm margins */
                    box-sizing: border-box;
                    background: #fff; 
                    position: relative; 
                    display: flex; /* Use flexbox for layout */
                    flex-direction: column; /* Arrange children vertically */
                }
                .page > * { flex-shrink: 0; } /* Prevent elements from shrinking */
                .page > .main-report-table { flex-grow: 1; } /* Allow main table to grow */

                h2 { font-size: 18px !important; margin-bottom: 8px !important; }
                h3 { font-size: 14px !important; padding: 5px 10px !important; margin-top: 10px !important; margin-bottom: 8px !important; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 8px !important; }
                th, td { border: 1px solid #ddd; padding: 5px !important; text-align: right; font-size: 12px !important; vertical-align: middle; }
                div, p, span, strong, label { font-size: 12px !important; }
                #reportCardStudentImage { width: 90px !important; height: 90px !important; }
                .main-report-table th, .main-report-table td { text-align: center; }
                .main-report-table td[rowspan] { font-size: 14px !important; } /* Enlarge the "الأنشطة التربوية" text */
                .draggable { position: absolute; user-select: none; }
                .resize-handle, .editable[placeholder]:empty:before { display: none; }
            </style>
        </head><body>
            <div class="page">${content}</div>
            <script>
window.onload = function() { window.print(); window.close(); }<\/script>
        </body></html>
    `);
            win.document.close();
        }

        // --- منطق الصور (إدراج، تحريك، تكبير) ---
        const imageInputEl = document.getElementById("imageInput");
        imageInputEl.addEventListener("change", async e => {
            const file = e.target.files[0];
            if (!file) return;
            const compressedBase64 = await compressImage(file, 600, 0.6);
            createDraggableImage(compressedBase64);
            saveReportCard(selectedHomeStudentId);
            e.target.value = '';
        });

        function createDraggableImage(src, initialPos = {}) {
            const page = document.getElementById("sheet");
            const imgWrapper = document.createElement("div");
            imgWrapper.className = "draggable";
            const image = document.createElement("img");
            image.src = src;
            image.style.width = "100%";
            image.style.height = "100%";
            image.style.display = "block";
            image.style.borderRadius = "6px";
            imgWrapper.appendChild(image);

            const handle = document.createElement("div");
            handle.className = "resize-handle";
            imgWrapper.appendChild(handle);

            // إضافة زر الحذف
            const deleteBtn = document.createElement("button");
            deleteBtn.innerHTML = `&times;`;
            deleteBtn.title = "حذف الصورة (نقرة مزدوجة للحذف السريع)";
            deleteBtn.className = "delete-image-btn absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-lg leading-none z-10 hidden";
            imgWrapper.addEventListener('mouseenter', () => deleteBtn.classList.remove('hidden'));
            imgWrapper.addEventListener('mouseleave', () => {
                if (!imgWrapper.classList.contains('active')) {
                    deleteBtn.classList.add('hidden');
                }
            });
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm("هل تريد حذف هذه الصورة؟")) { imgWrapper.remove(); saveReportCard(selectedHomeStudentId); }
            };
            imgWrapper.appendChild(deleteBtn);

            imgWrapper.style.top = initialPos.top || "80px";
            imgWrapper.style.left = initialPos.left || "80px";
            imgWrapper.style.width = initialPos.width || "100px";
            imgWrapper.style.height = initialPos.height || "auto";
            page.appendChild(imgWrapper);

            let isDragging = false, isResizing = false;
            let offsetX, offsetY, startX, startY, startWidth, startHeight;

            imgWrapper.addEventListener("mousedown", e => {
                // منع السحب عند النقر المزدوج
                if (page.classList.contains('images-locked')) return; // منع السحب إذا كانت الصور مقفلة
                if (e.detail > 1) {
                    e.preventDefault();
                    return;
                }
                if (e.target === handle) return;
                isDragging = true;
                imgWrapper.classList.add("active");
                deleteBtn.classList.remove('hidden');
                offsetX = e.clientX - imgWrapper.getBoundingClientRect().left;
                offsetY = e.clientY - imgWrapper.getBoundingClientRect().top;
            });

            // إضافة وظيفة الحذف عند النقر المزدوج
            imgWrapper.addEventListener("dblclick", (e) => {
                e.stopPropagation();
                if (confirm("هل أنت متأكد من حذف هذه الصورة؟")) {
                    imgWrapper.remove();
                    saveReportCard(selectedHomeStudentId);
                }
            });

            handle.addEventListener("mousedown", e => {
                e.stopPropagation();
                if (page.classList.contains('images-locked')) return; // منع تغيير الحجم إذا كانت الصور مقفلة
                isResizing = true;
                startX = e.clientX;
                startY = e.clientY;
                startWidth = parseInt(window.getComputedStyle(imgWrapper).width);
                startHeight = parseInt(window.getComputedStyle(imgWrapper).height);
            });

            document.addEventListener("mousemove", e => {
                if (isDragging) {
                    const rect = page.getBoundingClientRect();
                    let leftPx = e.clientX - rect.left - offsetX;
                    let topPx = e.clientY - rect.top - offsetY;

                    imgWrapper.style.left = (leftPx / rect.width * 100) + "%";
                    imgWrapper.style.top = (topPx / rect.height * 100) + "%";
                } else if (isResizing) {
                    const rect = page.getBoundingClientRect();
                    const dx = e.clientX - startX;
                    const dy = e.clientY - startY;

                    let newWidthPx = startWidth + dx;
                    let newHeightPx = startHeight + dy;

                    imgWrapper.style.width = (newWidthPx / rect.width * 100) + "%";
                    imgWrapper.style.height = (newHeightPx / rect.height * 100) + "%";
                }
            });

            document.addEventListener("mouseup", () => {
                if (isDragging || isResizing) {
                    saveReportCard(selectedHomeStudentId);
                }
                isDragging = false;
                isResizing = false;
                imgWrapper.classList.remove("active");
                // لا تخفي زر الحذف إذا كان الفأر لا يزال فوق الصورة
                if (!imgWrapper.matches(':hover')) {
                    deleteBtn.classList.add('hidden');
                }
            });
        }

        // زر تثبيت/تحرير الصور
        const toggleLockImagesBtn = document.getElementById('toggleLockImagesBtn');
        const sheetContainer = document.getElementById('sheet');

        // دالة لتطبيق حالة قفل الصور المحفوظة
        function applyImageLockState() {
            const isLocked = appStorage.getItem('imagesLockedState') === 'true';
            if (isLocked) {
                sheetContainer.classList.add('images-locked');
            } else {
                sheetContainer.classList.remove('images-locked');
            }
            toggleLockImagesBtn.innerHTML = isLocked ? '✏️ تحرير الصور' : '🔒 تثبيت الصور';
            toggleLockImagesBtn.classList.toggle('bg-yellow-500', !isLocked);
            toggleLockImagesBtn.classList.toggle('bg-blue-500', isLocked);
        }

        // تطبيق الحالة عند تحميل الصفحة
        applyImageLockState();

        toggleLockImagesBtn.addEventListener('click', () => {
            sheetContainer.classList.toggle('images-locked');
            const isLocked = sheetContainer.classList.contains('images-locked');
            // حفظ الحالة الجديدة في الذاكرة المحلية
            appStorage.setItem('imagesLockedState', isLocked);
            // تحديث شكل الزر
            applyImageLockState();
        });
        // وظائف معاينة الصور وإخفائها
        let imagesVisible = true;
        function toggleImagesVisibility() {
            imagesVisible = !imagesVisible;
            const sheet = document.getElementById('sheet');
            const btn = document.getElementById('toggleShowImagesBtn');
            if (imagesVisible) {
                sheet.classList.remove('hide-images');
                if (btn) {
                    btn.innerHTML = '👁 إخفاء الصور';
                    btn.classList.replace('bg-gray-400', 'bg-gray-500');
                    btn.classList.replace('hover:bg-gray-500', 'hover:bg-gray-600');
                }
            } else {
                sheet.classList.add('hide-images');
                if (btn) {
                    btn.innerHTML = '👁 إظهار الصور';
                    btn.classList.replace('bg-gray-500', 'bg-gray-400');
                    btn.classList.replace('hover:bg-gray-600', 'hover:bg-gray-500');
                }
            }
        }


        // ----- الأقسام -----
        function renderDepartments() {
            deptList.innerHTML = "";
            deptSelectForStudents.innerHTML = "";
            homeDeptSelect.innerHTML = `<option value="">-- اختر --</option>`;
            let filtered = departments.filter(d => (d.name || '').includes(deptSearch.value || ""));
            if (filtered.length === 0) deptList.innerHTML = `<p class="text-gray-500 text-center">لا توجد أقسام</p>`;
            filtered.forEach(d => {
                const li = document.createElement("li");
                li.className = "flex justify-between items-center bg-gray-50 p-3 rounded-lg";
                li.innerHTML = `<span class="font-medium">${d.name}</span>
      <div class="flex gap-2">
        <button class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-btn" onclick="editDept(${d.id})">تعديل</button>
        <button class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-btn" onclick="deleteDept(${d.id})">حذف</button>
      </div>`;
                deptList.appendChild(li);
                deptSelectForStudents.appendChild(new Option(d.name, d.id));
                homeDeptSelect.appendChild(new Option(d.name, d.id));
            });

            const reportActivityDept = document.getElementById("reportActivityDept");
            if (reportActivityDept) {
                reportActivityDept.innerHTML = `<option value="all">كل المستويات</option>`;
                departments.forEach(d => {
                    reportActivityDept.appendChild(new Option(d.name, d.id));
                });
            }

            // استرجاع القسم المختار من التخزين واجعله هو المختار
            const savedDeptStudents = appStorage.getItem("selectedDeptForStudents");
            if (savedDeptStudents) deptSelectForStudents.value = savedDeptStudents;

            renderHomeStudents();
        }

        deptForm.addEventListener("submit", e => {
            e.preventDefault();
            const name = document.getElementById("deptName").value.trim();
            if (!name) return;
            departments.push({ id: String(Date.now()), name });
            saveAll(); e.target.reset(); renderDepartments(); renderStudents();
        });

        function editDept(id) {
            const d = departments.find(x => String(x.id) == String(id));
            const newName = prompt("أدخل الاسم الجديد:", d.name || '');
            if (newName) { d.name = newName.trim(); saveAll(); renderDepartments(); renderStudents(); }
        }
        function deleteDept(id) {
            const d = departments.find(x => String(x.id) == String(id));
            modalText.textContent = `هل تريد حذف القسم "${d.name}"؟ سيتم حذف تلاميذه ومواده.`;
            currentDeleteCallback = () => {
                departments = departments.filter(x => String(x.id) != String(id));
                students = students.filter(s => String(s.deptId) != String(id));
                subjects = subjects.filter(s => String(s.deptId) != String(id));
                Object.keys(grades).forEach(stId => {
                    const st = students.find(ss => String(ss.id) == String(stId));
                    if (!st) delete grades[stId];
                });
                saveAll(); renderDepartments(); renderStudents();
            };
            modal.classList.remove("hidden");
        }
        deptSearch.addEventListener("input", renderDepartments);

        // ----- التلاميذ -----
        function renderStudents() {
            const deptId = deptSelectForStudents.value;
            let filtered = students.filter(s => (deptId ? s.deptId == deptId : true) && (s.info['الاسم الكامل (بالعربية)'] || '').includes(studentSearch.value || ""));
            studentList.innerHTML = "";
            if (filtered.length === 0) studentList.innerHTML = `<p class="text-gray-500 text-center">لا يوجد تلاميذ</p>`;
            filtered.forEach(s => {
                const li = document.createElement("li");
                li.className = "flex justify-between items-center bg-gray-50 p-3 rounded-lg";
                const isDropped = s.isDroppedOut ? "checked" : "";
                li.innerHTML = `<div class="flex items-center gap-3">
        <span>👤 ${s.info['الاسم الكامل (بالعربية)'] || 'اسم غير محدد'}</span>
        <label class="flex items-center gap-1 text-sm text-red-600 font-bold cursor-pointer bg-red-50 px-2 py-1 rounded border border-red-200" title="تحديد التلميذ كمنقطع عن الدراسة لإخفائه من النتائج">
            <input type="checkbox" onchange="toggleDropout(${s.id}, this.checked)" ${isDropped}> منقطع
        </label>
      </div>
      <div class="flex gap-2">
        <button class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-btn" onclick="editStudent(${s.id})">تعديل</button>
        <button class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-btn" onclick="deleteStudent(${s.id})">حذف</button>
      </div>`;
                studentList.appendChild(li);
            });

            document.getElementById("totalStudents").textContent = students.length;
            renderHomeStudents();
            if (selectedHomeStudentId) selectHomeStudent(selectedHomeStudentId);
        }

        function editStudent(id) {
            openStudentModal(id);
        }
        function deleteStudent(id) {
            const s = students.find(x => String(x.id) == String(id));
            modalText.textContent = `هل تريد حذف "${s.info['الاسم الكامل (بالعربية)'] || ''}"؟`;
            currentDeleteCallback = () => {
                students = students.filter(x => String(x.id) != String(id));
                delete grades[id];
                saveAll(); renderStudents();
            };
            modal.classList.remove("hidden");
        }

        function toggleDropout(id, checked) {
            const s = students.find(x => String(x.id) == String(id));
            if (s) {
                s.isDroppedOut = checked;
                saveAll();
                renderHomeStudents();
            }
        }
        deptSelectForStudents.addEventListener("change", function () {
            appStorage.setItem("selectedDeptForStudents", deptSelectForStudents.value);
            renderStudents();
        });
        studentSearch.addEventListener("input", renderStudents);

        // --- منطق قائمة جميع التلاميذ ---
        const allStudentsModal = document.getElementById('allStudentsModal');
        const allStudentsList = document.getElementById('allStudentsList');
        const allStudentsSearch = document.getElementById('allStudentsSearch');

        document.getElementById('totalStudentsCard').onclick = () => {
            renderAllStudentsList();
            allStudentsModal.classList.remove('hidden');
        };
        document.getElementById('allStudentsModalClose').onclick = () => {
            allStudentsModal.classList.add('hidden');
        };
        allStudentsSearch.addEventListener('input', renderAllStudentsList);

        function renderAllStudentsList() {
            const searchTerm = allStudentsSearch.value.toLowerCase();
            allStudentsList.innerHTML = '';

            const deptsMap = new Map(departments.map(d => [d.id, d.name]));

            const filteredStudents = students.filter(s => {
                const studentName = (s.info['الاسم الكامل (بالعربية)'] || '').toLowerCase();
                const deptName = (deptsMap.get(s.deptId) || '').toLowerCase();
                return studentName.includes(searchTerm) || deptName.includes(searchTerm);
            });

            document.getElementById('allStudentsCount').textContent = filteredStudents.length;

            if (filteredStudents.length === 0) {
                allStudentsList.innerHTML = `<p class="text-center text-gray-500 p-4">لا يوجد تلاميذ يطابقون البحث.</p>`;
                return;
            }

            // تجميع التلاميذ حسب القسم
            const groupedStudents = {};
            filteredStudents.forEach(student => {
                const deptId = student.deptId || 'unknown';
                if (!groupedStudents[deptId]) {
                    groupedStudents[deptId] = [];
                }
                groupedStudents[deptId].push(student);
            });

            function renderGroup(title, deptStudents, isUnknown = false) {
                const headerLi = document.createElement('li');
                const headerBg = isUnknown ? 'bg-gray-200' : 'bg-indigo-100';
                const headerText = isUnknown ? 'text-gray-800' : 'text-indigo-800';
                headerLi.className = `p-2 ${headerBg} ${headerText} font-bold rounded-lg mt-3 mb-1 text-sm`;
                headerLi.textContent = `📚 ${title} (${deptStudents.length})`;
                allStudentsList.appendChild(headerLi);

                const borderCol = isUnknown ? 'border-gray-300' : 'border-indigo-300';
                deptStudents.forEach(student => {
                    const li = document.createElement('li');
                    li.className = `p-3 bg-gray-50 hover:bg-green-50 rounded-lg cursor-pointer flex justify-between items-center mr-2 border-r-4 ${borderCol}`;
                    li.innerHTML = `<span><strong>${student.info['الاسم الكامل (بالعربية)']}</strong></span>`;
                    li.onclick = () => openStudentModal(student.id);
                    allStudentsList.appendChild(li);
                });
            }

            // الأقسام الموجودة حاليا (للحفاظ على الترتيب)
            departments.forEach(dept => {
                if (groupedStudents[dept.id]) {
                    renderGroup(dept.name, groupedStudents[dept.id], false);
                    delete groupedStudents[dept.id];
                }
            });

            // الأقسام المحذوفة أو غير المحددة
            for (const deptId in groupedStudents) {
                renderGroup(deptsMap.get(deptId) || 'قسم غير محدد', groupedStudents[deptId], true);
            }
        }

        // --- منطق بطاقة التلميذ ---
        const studentModal = document.getElementById('studentModal');
        const studentModalTitle = document.getElementById('studentModalTitle');
        const studentFieldsContainer = document.getElementById('studentFieldsContainer');
        const studentIdInput = document.getElementById('studentIdInput');
        const studentDetailForm = document.getElementById('studentDetailForm');
        const studentImagePreview = document.getElementById('studentImagePreview');
        const studentImageInput = document.getElementById('studentImageInput');
        const deleteImageBtn = document.getElementById('deleteImageBtn');
        const printCardBtn = document.getElementById('printCardBtn');
        const addNewFieldBtn = document.getElementById('addNewFieldBtn');

        function createFieldInput(key, value = '', isCustom = false) {
            const fieldWrapper = document.createElement('div');
            fieldWrapper.className = 'flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 field-wrapper';
            fieldWrapper.dataset.key = key;

            // أيقونة السحب والافلات
            if (key !== "الاسم الكامل (بالعربية)" && key !== "Nom et Prénom (en Français)") {
                fieldWrapper.draggable = true;
                const handle = document.createElement('span');
                handle.innerHTML = `<i data-feather="move" class="w-5 h-5 text-gray-400 cursor-move"></i>`;
                handle.className = 'drag-handle';
                fieldWrapper.appendChild(handle);
            } else {
                // مساحة فارغة للمحاذاة
                fieldWrapper.appendChild(document.createElement('span')).className = 'w-5 h-5';
            }

            const keyLabel = document.createElement('label');
            keyLabel.textContent = key + ':';
            keyLabel.className = 'w-1/3 text-sm font-medium text-gray-700';

            fieldWrapper.appendChild(keyLabel);

            if (key === "الجنس") {
                const genderContainer = document.createElement('div');
                genderContainer.className = 'field-value flex-grow flex items-center gap-2';
                genderContainer.dataset.key = key;
                genderContainer.dataset.value = value || ""; // لتخزين القيمة

                const maleBtn = document.createElement('button');
                maleBtn.type = 'button';
                maleBtn.textContent = 'ذكر';
                maleBtn.dataset.gender = 'ذكر';
                maleBtn.className = 'px-4 py-2 border rounded-lg cursor-pointer transition-colors text-sm';

                const femaleBtn = document.createElement('button');
                femaleBtn.type = 'button';
                femaleBtn.textContent = 'أنثى';
                femaleBtn.dataset.gender = 'أنثى';
                femaleBtn.className = 'px-4 py-2 border rounded-lg cursor-pointer transition-colors text-sm';

                const updateSelection = (selectedValue) => {
                    genderContainer.dataset.value = selectedValue;
                    maleBtn.className = `px-4 py-2 border rounded-lg cursor-pointer transition-colors text-sm ${selectedValue === 'ذكر' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white'}`;
                    femaleBtn.className = `px-4 py-2 border rounded-lg cursor-pointer transition-colors text-sm ${selectedValue === 'أنثى' ? 'bg-pink-400 text-white border-pink-400' : 'bg-white'}`;
                };

                maleBtn.onclick = () => updateSelection('ذكر');
                femaleBtn.onclick = () => updateSelection('أنثى');

                genderContainer.appendChild(maleBtn);
                genderContainer.appendChild(femaleBtn);
                fieldWrapper.appendChild(genderContainer);

                updateSelection(value); // تطبيق القيمة الأولية
            } else {
                const valueInput = document.createElement('input');
                valueInput.type = 'text';
                valueInput.value = value;
                valueInput.className = 'field-value flex-grow px-3 py-2 border rounded-lg';
                valueInput.placeholder = "القيمة";
                valueInput.dataset.key = key;
                if (key === "الاسم الكامل (بالعربية)") {
                    valueInput.required = true;
                    valueInput.addEventListener('blur', function () {
                        if (!studentIdInput.value) { // فقط عند إضافة تلميذ جديد وليس عند التعديل
                            lookupPastStudent(this.value.trim());
                        }
                    });
                }
                fieldWrapper.appendChild(valueInput);
            }

            // السماح بتعديل وحذف جميع الخانات ما عدا "الاسم الكامل"
            if (key !== "الاسم الكامل (بالعربية)" && key !== "Nom et Prénom (en Français)" && key !== "الجنس") {
                const editBtn = document.createElement('button');
                editBtn.innerHTML = `<i data-feather="edit-2" class="w-4 h-4"></i>`;
                editBtn.className = 'text-blue-500 hover:text-blue-700';
                editBtn.title = 'تعديل اسم الخانة';
                editBtn.onclick = (e) => { e.preventDefault(); editCustomField(key); };
                const deleteBtn = document.createElement('button');
                deleteBtn.innerHTML = `<i data-feather="trash-2" class="w-4 h-4"></i>`;
                deleteBtn.className = 'text-red-500 hover:text-red-700';
                deleteBtn.title = 'حذف الخانة';
                deleteBtn.onclick = (e) => { e.preventDefault(); deleteCustomField(key); };
                fieldWrapper.appendChild(editBtn);
                fieldWrapper.appendChild(deleteBtn);
            } else {
                fieldWrapper.appendChild(document.createElement('span')).className = 'w-12'; // مساحة فارغة للمحاذاة
            }

            return fieldWrapper;
        }

        function lookupPastStudent(name) {
            if (!name) return;

            // البحث في السنوات الدراسية السابقة مرتبة تنازلياً (الأحدث أولاً)
            const pastYears = academicYears
                .filter(y => y !== currentAcademicYear)
                .sort((a, b) => b.localeCompare(a));

            for (const year of pastYears) {
                const yearData = academicData[year];
                if (yearData && yearData.students) {
                    const foundStudent = yearData.students.find(s => {
                        const sName = s.info && s.info['الاسم الكامل (بالعربية)'];
                        return sName && sName.trim() === name;
                    });

                    if (foundStudent) {
                        // تم العثور على التلميذ في سنة سابقة!
                        const confirmImport = confirm(`تم العثور على التلميذ(ة) "${name}" مسجلاً في السنة الدراسية السابقة ${year}.\nهل تريد جلب معلوماته وصورته تلقائياً؟`);
                        if (confirmImport) {
                            const studentInfo = foundStudent.info || {};

                            // جلب الصورة
                            if (studentInfo['صورة']) {
                                studentImagePreview.src = studentInfo['صورة'];
                            } else {
                                studentImagePreview.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
                            }

                            // ملء الحقول الأخرى في المودال
                            studentFieldsContainer.querySelectorAll('.field-wrapper').forEach(wrapper => {
                                const fieldKey = wrapper.dataset.key;
                                const fieldElement = wrapper.querySelector('.field-value');

                                if (fieldKey && fieldKey !== 'الاسم الكامل (بالعربية)') {
                                    const val = studentInfo[fieldKey] || '';
                                    if (fieldKey === 'الجنس') {
                                        fieldElement.dataset.value = val;
                                        const maleBtn = fieldElement.querySelector('[data-gender="ذكر"]');
                                        const femaleBtn = fieldElement.querySelector('[data-gender="أنثى"]');
                                        if (maleBtn && femaleBtn) {
                                            maleBtn.className = `px-4 py-2 border rounded-lg cursor-pointer transition-colors text-sm ${val === 'ذكر' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white'}`;
                                            femaleBtn.className = `px-4 py-2 border rounded-lg cursor-pointer transition-colors text-sm ${val === 'أنثى' ? 'bg-pink-400 text-white border-pink-400' : 'bg-white'}`;
                                        }
                                    } else if (fieldElement) {
                                        fieldElement.value = val;
                                    }
                                }
                            });

                            alert(`موافق: تم جلب معلومات التلميذ(ة) وصورته بنجاح من السنة الدراسية ${year}. ✅`);
                        }
                        break; // التوقف بعد العثور على أول تطابق (الأحدث)
                    }
                }
            }
        }

        function openStudentModal(studentId = null) {
            studentFieldsContainer.innerHTML = '';
            studentIdInput.value = studentId || '';
            studentImageInput.value = ''; // Reset file input
            studentImagePreview.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'; // Reset to default
            printCardBtn.classList.add('hidden');

            if (studentId) { // وضع التعديل
                studentModalTitle.innerHTML = `تعديل بطاقة التلميذ <span class="text-sm font-normal text-gray-500">(${currentAcademicYear})</span>`;
                const student = students.find(s => String(s.id) === String(studentId));
                const studentInfo = student.info || {};
                if (studentInfo['صورة']) studentImagePreview.src = studentInfo['صورة'];
            } else { // وضع الإضافة
                studentModalTitle.innerHTML = `إضافة تلميذ جديد <span class="text-sm font-normal text-gray-500">(${currentAcademicYear})</span>`;
            }

            const studentInfo = studentId ? (students.find(s => String(s.id) === String(studentId))?.info || {}) : {};
            if (!studentFields) {
                studentFields = ["الاسم الكامل (بالعربية)", "Nom et Prénom (en Français)", "الجنس", "تاريخ الازدياد", "مكان الازدياد", "هاتف ولي الأمر"];
            }
            studentFields.forEach(field => {
                studentFieldsContainer.appendChild(createFieldInput(field, studentInfo[field] || ''));
            });

            if (studentId) {
                printCardBtn.classList.remove('hidden');
            }
            studentModal.classList.remove('hidden');
            setupDragAndDrop();
            feather.replace();
        }

        document.getElementById('addStudentBtn').onclick = () => openStudentModal();
        document.getElementById('studentModalCancel').onclick = () => studentModal.classList.add('hidden');

        addNewFieldBtn.onclick = () => {
            const newFieldName = prompt("أدخل اسم الخانة الجديدة (ستتم إضافتها لجميع التلاميذ):");
            if (newFieldName && newFieldName.trim() !== "") {
                const trimmedName = newFieldName.trim();
                if (studentFields.includes(trimmedName)) {
                    return alert("هذه الخانة موجودة بالفعل.");
                }
                studentFields.push(trimmedName);
                saveAll();
                openStudentModal(studentIdInput.value); // إعادة فتح المودال لإظهار الحقل الجديد
            }
        };

        deleteImageBtn.onclick = function (e) {
            e.preventDefault();
            if (confirm("هل أنت متأكد من حذف صورة التلميذ؟")) {
                const studentId = studentIdInput.value;
                if (studentId) {
                    const student = students.find(s => String(s.id) === String(studentId));
                    if (student && student.info) {
                        delete student.info['صورة'];
                        saveAll(); // حفظ التغيير فوراً
                    }
                }
                studentImagePreview.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
            }
        };

        studentImageInput.addEventListener('change', async function () {
            if (this.files && this.files[0]) {
                const compressedBase64 = await compressImage(this.files[0], 300, 0.7);
                studentImagePreview.src = compressedBase64;
            }
        });

        studentDetailForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const studentId = studentIdInput.value;

            let deptId = deptSelectForStudents.value;
            if (studentId) {
                const existingStudent = students.find(s => String(s.id) === String(studentId));
                if (existingStudent) {
                    deptId = existingStudent.deptId;
                }
            }

            if (!deptId) return alert('الرجاء اختيار قسم أولاً.');

            const newInfo = {};
            studentFieldsContainer.querySelectorAll('.field-wrapper').forEach(wrapper => {
                const key = wrapper.dataset.key;
                const fieldElement = wrapper.querySelector('.field-value');
                if (key === 'الجنس') {
                    // قراءة القيمة من حاوية الجنس المخصصة
                    newInfo[key] = fieldElement.dataset.value || '';
                } else if (key && fieldElement) {
                    newInfo[key] = fieldElement.value.trim();
                }
            });

            if (!newInfo['الاسم الكامل (بالعربية)']) return alert('الرجاء إدخال الاسم الكامل (بالعربية) للتلميذ.');

            // حفظ الصورة إذا تم تغييرها أو استيرادها
            if (studentImagePreview.src.startsWith('data:image') || (!studentImagePreview.src.includes('flaticon.com') && studentImagePreview.src !== '')) {
                newInfo['صورة'] = studentImagePreview.src;
            } else if (studentImagePreview.src.includes('flaticon.com')) {
                // إذا كانت الصورة هي الافتراضية، احذفها من البيانات
                delete newInfo['صورة'];
            } else {
                // احتفظ بالصورة القديمة إذا لم تتغير ولم تحذف
                const student = studentId ? students.find(s => String(s.id) === String(studentId)) : null;
                if (student && student.info['صورة']) newInfo['صورة'] = student.info['صورة'];
            }

            if (studentId) { // تحديث
                const student = students.find(s => String(s.id) === String(studentId));
                student.info = newInfo;
                student.deptId = deptId; // سيحتفظ التلميذ بقسمه الأصلي
            } else { // إضافة
                students.push({ id: String(Date.now()), deptId, info: newInfo });
            }
            saveAll();
            renderStudents();
            studentModal.classList.add('hidden');
        });

        function editCustomField(oldFieldName) {
            const newFieldName = prompt(`تعديل اسم الخانة "${oldFieldName}":`, oldFieldName);
            if (newFieldName && newFieldName.trim() !== "" && newFieldName.trim() !== oldFieldName) {
                const trimmedName = newFieldName.trim();
                if (studentFields.includes(trimmedName)) {
                    return alert("هذا الاسم موجود بالفعل.");
                }

                const fieldIndex = studentFields.indexOf(oldFieldName);
                if (fieldIndex > -1) studentFields[fieldIndex] = trimmedName; // تحديث اسم الحقل في القائمة الرئيسية

                // تحديث البيانات لدى جميع التلاميذ في السنة الحالية
                students.forEach(student => {
                    if (student.info && student.info.hasOwnProperty(oldFieldName)) {
                        student.info[trimmedName] = student.info[oldFieldName];
                        delete student.info[oldFieldName];
                    }
                });

                saveAll();
                openStudentModal(studentIdInput.value); // إعادة فتح المودال لعرض التغييرات
            }
        }

        function deleteCustomField(fieldName) {
            if (confirm(`هل أنت متأكد من حذف الخانة "${fieldName}"؟ سيتم حذفها من جميع التلاميذ.`)) {
                studentFields = studentFields.filter(f => f !== fieldName);

                // إزالة من بيانات التلاميذ
                students.forEach(student => {
                    if (student.info) delete student.info[fieldName];
                });
                saveAll();
                openStudentModal(studentIdInput.value); // إعادة فتح المودال لعرض التغييرات
            }
        }

        function setupDragAndDrop() {
            const container = studentFieldsContainer;
            let draggedItem = null;

            container.querySelectorAll('.field-wrapper[draggable="true"]').forEach(item => {
                item.addEventListener('dragstart', () => {
                    draggedItem = item;
                    setTimeout(() => item.style.opacity = '0.5', 0);
                });

                item.addEventListener('dragend', () => {
                    setTimeout(() => {
                        draggedItem.style.opacity = '1';
                        draggedItem = null;
                    }, 0);
                });
            });

            container.addEventListener('dragover', e => {
                e.preventDefault();
                const afterElement = getDragAfterElement(container, e.clientY);
                const currentDraggable = document.querySelector('.dragging');
                if (afterElement == null) {
                    container.appendChild(draggedItem);
                } else {
                    container.insertBefore(draggedItem, afterElement);
                }
            });

            container.addEventListener('drop', () => {
                const newOrder = [];
                container.querySelectorAll('.field-wrapper').forEach(item => {
                    if (item.dataset.key) { // التأكد من وجود المفتاح
                        newOrder.push(item.dataset.key);
                    }
                });

                // تحديث قائمة الحقول الرئيسية بالترتيب الجديد
                studentFields = newOrder;

                saveAll();
            });

            function getDragAfterElement(container, y) {
                const draggableElements = [...container.querySelectorAll('.field-wrapper:not(.dragging)')];
                return draggableElements.reduce((closest, child) => {
                    const box = child.getBoundingClientRect();
                    const offset = y - box.top - box.height / 2;
                    if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
                    else return closest;
                }, { offset: Number.NEGATIVE_INFINITY }).element;
            }
        }

        printCardBtn.onclick = function () {
            const studentId = studentIdInput.value;
            if (!studentId) return;

            const student = students.find(s => String(s.id) === String(studentId));
            if (!student) return;

            const studentInfo = student.info || {};

            let fieldsHTML = '';
            if (!studentFields) {
                studentFields = ["الاسم الكامل (بالعربية)", "Nom et Prénom (en Français)", "الجنس", "تاريخ الازدياد", "مكان الازدياد", "هاتف ولي الأمر"];
            }
            studentFields.forEach(field => {
                if (field !== 'صورة') { // لا نطبع رابط الصورة كنص
                    fieldsHTML += `<p style="margin: 8px 0; border-bottom: 1px solid #eee; padding-bottom: 8px;"><strong>${field}:</strong> ${studentInfo[field] || '-'}</p>`;
                }
            });

            const cardContent = `
        <div style="border: 2px solid #4f46e5; border-radius: 15px; padding: 25px; width: 500px; margin: 40px auto; font-family: 'Tajawal', sans-serif; background: #fff;">
            <h2 style="color: #4f46e5; text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; margin-top:0;">بطاقة التلميذ / Fiche d'élève</h2>
            <div style="text-align: center; margin: 20px 0;">
                <img src="${studentInfo['صورة'] || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}" alt="صورة التلميذ" style="width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 4px solid #ddd; display: inline-block;">
            </div>
            <div style="padding: 10px 0;">
                ${fieldsHTML}
            </div>
        </div>
    `;

            const win = window.open('', '', 'width=700,height=800');
            win.document.write(`
        <html dir="rtl"><head>
            <title>بطاقة التلميذ - ${studentInfo['الاسم الكامل (بالعربية)'] || ''}</title>
            <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
            <style>
                @media print {
                    body {
                        background: #fff !important;
                        margin: 0;
                        padding: 0;
                    }
                    div {
                        width: 100% !important;
                        margin: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                    }
                }
            </style>
        </head><body style="background: #f1f5f9;">
            ${cardContent}
            <script>
window.onload = function() { window.print(); window.close(); }<\/script>
        </body></html>
    `);
            win.document.close();
        }

        // ----- إدارة أنشطة النتائج -----
        const reportActivityForm = document.getElementById('reportActivityForm');
        const reportActivityList = document.getElementById('reportActivityList');
        const reportActivityNameInput = document.getElementById('reportActivityName');

        function renderReportActivities() {
            renderList(reportActivityList, allReportItems, 'item');
            feather.replace();
        }


        function renderList(ulElement, items, type) {
            ulElement.innerHTML = '';
            if (items.length === 0) {
                ulElement.innerHTML = `<p class="text-gray-500 text-center">لا توجد بنود</p>`;
                return;
            }
            items.forEach((item, index) => {
                if (!item) return;
                const li = document.createElement('li');
                if (type === 'observation') {
                    li.className = "flex justify-between items-center bg-gray-50 p-3 rounded-lg";
                    li.innerHTML = `
                <span class="font-medium">${item}</span>
                <div class="flex gap-2">
                    <button class="text-blue-500 hover:text-blue-700" onclick="editObservation(${index})"><i data-feather="edit-2" class="w-4 h-4"></i></button>
                    <button class="text-red-500 hover:text-red-700" onclick="deleteReportItem('observation', ${index})"><i data-feather="trash-2" class="w-4 h-4"></i></button>
                </div>
            `;
                } else { // type === 'item'
                    li.className = "flex justify-between items-center bg-gray-50 p-3 rounded-lg flex-wrap sm:flex-nowrap";
                    const name = item && typeof item === 'object' ? item.name : item;

                    let currentDeptIds = [];
                    if (item && typeof item === 'object') {
                        if (Array.isArray(item.deptIds)) {
                            currentDeptIds = item.deptIds.map(String);
                        } else if (item.deptId) {
                            currentDeptIds = [String(item.deptId)];
                        } else {
                            currentDeptIds = ['all'];
                        }
                    } else {
                        currentDeptIds = ['all'];
                    }

                    const isAllChecked = currentDeptIds.includes('all');

                    const isBehavior = reportBehaviors.some(beh => beh && (typeof beh === 'object' ? beh.name : beh) === name);
                    const itemType = isBehavior ? 'سلوك (نقطة)' : 'نشاط (تقدير)';
                    const typeColor = isBehavior ? 'text-blue-600' : 'text-amber-600';

                    let checkboxesHTML = `
                            <div class="flex flex-wrap gap-2 items-center mt-2">
                                <span class="text-xs text-gray-500 font-bold ml-1">المستويات:</span>
                                <label class="inline-flex items-center gap-1 bg-white px-2 py-1 rounded border text-xs cursor-pointer hover:bg-gray-100">
                                    <input type="checkbox" class="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5" 
                                           ${isAllChecked ? 'checked' : ''} 
                                           onchange="toggleLevelForItem('item', ${index}, 'all', this.checked)">
                                    <span>كل المستويات</span>
                                </label>
                        `;

                    departments.forEach(d => {
                        const isChecked = !isAllChecked && currentDeptIds.includes(String(d.id));
                        checkboxesHTML += `
                                <label class="inline-flex items-center gap-1 bg-white px-2 py-1 rounded border text-xs cursor-pointer hover:bg-gray-100">
                                    <input type="checkbox" class="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5" 
                                           ${isChecked ? 'checked' : ''} 
                                           onchange="toggleLevelForItem('item', ${index}, '${d.id}', this.checked)">
                                    <span>${d.name}</span>
                                </label>
                            `;
                    });
                    checkboxesHTML += `</div>`;

                    li.innerHTML = `
                            <div class="flex-grow">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="font-medium text-gray-800">${name}</span> 
                                    <span class="text-xs font-bold ${typeColor}">[${itemType}]</span>
                                </div>
                                ${checkboxesHTML}
                            </div>
                            <div class="flex gap-2 self-start mt-1">
                                <button class="text-blue-500 hover:text-blue-700 p-1" onclick="editReportItem('item', ${index})"><i data-feather="edit-2" class="w-4 h-4"></i></button>
                                <button class="text-red-500 hover:text-red-700 p-1" onclick="deleteReportItem('item', ${index})"><i data-feather="trash-2" class="w-4 h-4"></i></button>
                            </div>
                        `;
                }
                ulElement.appendChild(li);
            });
        }

        const addItemTypeModal = document.getElementById('addItemTypeModal');
        const addActivityTypeBtn = document.getElementById('addActivityTypeBtn');
        const addBehaviorTypeBtn = document.getElementById('addBehaviorTypeBtn');

        reportActivityForm.addEventListener('submit', e => {
            e.preventDefault();
            addItemTypeModal.classList.remove('hidden');
        });

        addActivityTypeBtn.onclick = () => {
            const name = reportActivityNameInput.value.trim();
            const deptSelect = document.getElementById("reportActivityDept");
            const deptId = deptSelect ? deptSelect.value : 'all';

            if (name) {
                const isDuplicate = reportActivities.some(act =>
                    act && (typeof act === 'object' ? act.name : act) === name
                );
                if (!isDuplicate) {
                    reportActivities.push({ name, deptIds: [deptId] });
                    saveAll();
                    allReportItems.splice(0, allReportItems.length, ...reportActivities, ...reportBehaviors);
                    renderReportActivities();
                    if (selectedHomeStudentId) renderNewReportCard(selectedHomeStudentId);
                    reportActivityNameInput.value = '';
                } else {
                    alert("هذا البند موجود بالفعل.");
                }
            }
            addItemTypeModal.classList.add('hidden');
        };

        addBehaviorTypeBtn.onclick = () => {
            const name = reportActivityNameInput.value.trim();
            const deptSelect = document.getElementById("reportActivityDept");
            const deptId = deptSelect ? deptSelect.value : 'all';

            if (name) {
                const isDuplicate = reportBehaviors.some(beh =>
                    beh && (typeof beh === 'object' ? beh.name : beh) === name
                );
                if (!isDuplicate) {
                    reportBehaviors.push({ name, deptIds: [deptId] });
                    saveAll();
                    allReportItems.splice(0, allReportItems.length, ...reportActivities, ...reportBehaviors);
                    renderReportActivities();
                    if (selectedHomeStudentId) renderNewReportCard(selectedHomeStudentId);
                    reportActivityNameInput.value = '';
                } else {
                    alert("هذا البند موجود بالفعل.");
                }
            }
            addItemTypeModal.classList.add('hidden');
        };

        window.toggleLevelForItem = function (type, index, levelId, checked) {
            const isActivity = index < reportActivities.length;
            const list = isActivity ? reportActivities : reportBehaviors;
            const listIndex = isActivity ? index : index - reportActivities.length;
            const item = list[listIndex];

            let itemObj = typeof item === 'object' && item !== null ? { ...item } : { name: item };

            let currentDeptIds = [];
            if (Array.isArray(itemObj.deptIds)) {
                currentDeptIds = [...itemObj.deptIds].map(String);
            } else if (itemObj.deptId) {
                currentDeptIds = [String(itemObj.deptId)];
            } else {
                currentDeptIds = ['all'];
            }

            if (levelId === 'all') {
                if (checked) {
                    currentDeptIds = ['all'];
                } else {
                    currentDeptIds = [];
                }
            } else {
                currentDeptIds = currentDeptIds.filter(id => id !== 'all');
                if (checked) {
                    if (!currentDeptIds.includes(String(levelId))) {
                        currentDeptIds.push(String(levelId));
                    }
                } else {
                    currentDeptIds = currentDeptIds.filter(id => String(id) !== String(levelId));
                }
                if (currentDeptIds.length === 0) {
                    currentDeptIds = ['all'];
                }
            }

            itemObj.deptIds = currentDeptIds;
            if ('deptId' in itemObj) delete itemObj.deptId;

            list[listIndex] = itemObj;
            saveAll();
            allReportItems.splice(0, allReportItems.length, ...reportActivities, ...reportBehaviors);
            renderReportActivities();
            if (selectedHomeStudentId) renderNewReportCard(selectedHomeStudentId);
        };

        function editReportItem(type, index) {
            if (type === 'item') {
                const isActivity = index < reportActivities.length;
                const list = isActivity ? reportActivities : reportBehaviors;
                const listIndex = isActivity ? index : index - reportActivities.length;
                const oldItem = list[listIndex];

                const oldName = oldItem && typeof oldItem === 'object' ? oldItem.name : oldItem;

                const newName = prompt('تعديل اسم البند:', oldName);
                if (newName !== null && newName.trim() !== '') {
                    const trimmedName = newName.trim();

                    if (typeof oldItem === 'object' && oldItem !== null) {
                        oldItem.name = trimmedName;
                    } else {
                        list[listIndex] = { name: trimmedName, deptIds: ['all'] };
                    }
                    saveAll();
                    allReportItems.splice(0, allReportItems.length, ...reportActivities, ...reportBehaviors);
                    renderReportActivities();
                    if (selectedHomeStudentId) renderNewReportCard(selectedHomeStudentId);
                }
            }
        }

        function deleteReportItem(type, index) {
            if (confirm('هل أنت متأكد من حذف هذا البند؟')) {
                if (type === 'observation') {
                    generalObservations.splice(index, 1);
                } else { // 'item'
                    const isActivity = index < reportActivities.length;
                    const list = isActivity ? reportActivities : reportBehaviors;
                    const listIndex = isActivity ? index : index - reportActivities.length;
                    list.splice(listIndex, 1);
                }

                saveAll();
                allReportItems.splice(0, allReportItems.length, ...reportActivities, ...reportBehaviors);
                if (type === 'observation') {
                    renderGeneralObservations();
                } else {
                    renderReportActivities();
                    if (selectedHomeStudentId) renderNewReportCard(selectedHomeStudentId);
                }
            }
        }

        // ----- إدارة الملاحظات العامة -----
        const observationForm = document.getElementById('observationForm');
        const observationList = document.getElementById('observationList');
        const observationNameInput = document.getElementById('observationName');

        function renderGeneralObservations() {
            renderList(observationList, generalObservations, 'observation');
            renderScoreObservations();
            feather.replace();
        }

        observationForm.addEventListener('submit', e => {
            e.preventDefault();
            const name = observationNameInput.value.trim();
            if (name && !generalObservations.includes(name)) {
                generalObservations.push(name);
                saveAll();
                renderReportActivities(); // تحديث قائمة الأنشطة أيضا
                renderGeneralObservations();
                renderScoreObservations();
                observationNameInput.value = '';
            }
        });

        // ----- الإعدادات العامة -----
        const institutionNameInput = document.getElementById('institutionNameInput');

        function renderGeneralSettings() {
            institutionNameInput.value = institutionName;
        }

        institutionNameInput.addEventListener('blur', () => {
            institutionName = institutionNameInput.value.trim();
            saveAll();
        });

        function editObservation(index) {
            const oldName = generalObservations[index];
            const newName = prompt('تعديل الملاحظة:', oldName);
            if (newName && newName.trim() !== '' && !generalObservations.includes(newName.trim())) {
                generalObservations[index] = newName.trim();
                saveAll();
                renderGeneralObservations();
            }
        }

        // ----- إدارة الملاحظات حسب النقطة -----
        const scoreObservationForm = document.getElementById('scoreObservationForm');
        const scoreObservationList = document.getElementById('scoreObservationList');

        function renderScoreObservations() {
            scoreObservationList.innerHTML = '';
            if (scoreObservations.length === 0) {
                scoreObservationList.innerHTML = `<p class="text-gray-500 text-center">لا توجد ملاحظات حسب النقطة.</p>`;
                return;
            }
            // Sort by min score
            const sortedObservations = [...scoreObservations].sort((a, b) => a.min - b.min);

            sortedObservations.forEach((obs, index) => {
                const li = document.createElement('li');
                li.className = "flex justify-between items-center bg-teal-50 p-3 rounded-lg";
                li.innerHTML = `
            <div>
                <span class="font-mono bg-white px-2 py-1 rounded"><strong>${obs.min}</strong> - <strong>${obs.max}</strong></span>
                <i data-feather="arrow-right" class="inline-block w-4 h-4 mx-2 text-gray-500"></i>
                <span class="font-medium text-teal-800">${obs.text}</span>
            </div>
            <div class="flex gap-2">
                <button class="text-red-500 hover:text-red-700" onclick="deleteScoreObservation(${index})"><i data-feather="trash-2" class="w-4 h-4"></i></button>
            </div>
        `;
                scoreObservationList.appendChild(li);
            });
            feather.replace();
        }

        scoreObservationForm.addEventListener('submit', e => {
            e.preventDefault();
            const min = parseFloat(document.getElementById('scoreObsMin').value);
            const max = parseFloat(document.getElementById('scoreObsMax').value);
            const text = document.getElementById('scoreObsText').value.trim();

            if (isNaN(min) || isNaN(max) || !text) {
                alert("الرجاء ملء جميع الخانات بشكل صحيح.");
                return;
            }
            if (min >= max) {
                alert("يجب أن تكون النقطة الدنيا أصغر من النقطة القصوى.");
                return;
            }

            scoreObservations.push({ min, max, text });
            saveAll();
            renderScoreObservations();
            scoreObservationForm.reset();
        });

        function deleteScoreObservation(index) {
            // We need to find the original index because we render a sorted list
            const sorted = [...scoreObservations].sort((a, b) => a.min - b.min);
            const itemToDelete = sorted[index];
            scoreObservations = scoreObservations.filter(obs => obs.min !== itemToDelete.min || obs.max !== itemToDelete.max || obs.text !== itemToDelete.text);
            saveAll();
            renderScoreObservations();
        }
        // ----- إدارة الدورات -----
        const sessionForm = document.getElementById('sessionForm');
        const sessionList = document.getElementById('sessionList');
        const sessionNameInput = document.getElementById('sessionName');

        function renderReportSessions() {
            sessionList.innerHTML = '';
            if (reportSessions.length === 0) {
                sessionList.innerHTML = `<p class="text-gray-500 text-center">لا توجد دورات معرفة.</p>`;
                return;
            }
            reportSessions.forEach(session => {
                const li = document.createElement('li');
                li.className = "flex justify-between items-center bg-gray-50 p-3 rounded-lg";
                li.innerHTML = `
            <span class="font-medium">${session}</span>
            <div class="flex gap-2">
                <button class="text-blue-500 hover:text-blue-700" onclick="editSession('${session}')"><i data-feather="edit-2" class="w-4 h-4"></i></button>
                <button class="text-red-500 hover:text-red-700" onclick="deleteSession('${session}')"><i data-feather="trash-2" class="w-4 h-4"></i></button>
            </div>
        `;
                sessionList.appendChild(li);
            });
            feather.replace();
        }

        sessionForm.addEventListener('submit', e => {
            e.preventDefault();
            const name = sessionNameInput.value.trim();
            if (name && !reportSessions.includes(name)) {
                reportSessions.push(name);
                saveAll();
                renderReportActivities();
                renderReportSessions();
                sessionNameInput.value = '';
            }
        });

        function editSession(oldName) {
            const newName = prompt('تعديل اسم الدورة:', oldName);
            if (newName && newName.trim() !== '' && newName.trim() !== oldName) {
                const trimmedName = newName.trim();
                if (reportSessions.includes(trimmedName)) {
                    alert("هذه الدورة موجودة بالفعل.");
                    return;
                }

                const index = reportSessions.indexOf(oldName);
                if (index > -1) {
                    reportSessions[index] = trimmedName;

                    // تحديث بيانات التلاميذ المرتبطة بالاسم القديم للدورة
                    Object.keys(studentReports).forEach(studentId => {
                        if (studentReports[studentId] && studentReports[studentId][oldName]) {
                            studentReports[studentId][trimmedName] = studentReports[studentId][oldName];
                            delete studentReports[studentId][oldName];
                        }
                    });

                    saveAll();
                    renderReportSessions();
                    // إذا كانت الدورة المعدلة هي الدورة المعروضة حالياً، قم بتحديث العرض
                    if (selectedHomeStudentId && reportSessionSelect.value === oldName) {
                        renderNewReportCard(selectedHomeStudentId);
                    }
                }
            }
        }

        function deleteSession(sessionName) {
            if (confirm(`هل أنت متأكد من حذف الدورة "${sessionName}"؟ سيتم حذف جميع تقييماتها.`)) {
                reportSessions = reportSessions.filter(s => s !== sessionName);
                // يمكنك إضافة منطق لحذف بيانات الدورة من كل تلميذ هنا إذا أردت
                saveAll(); // حفظ التغييرات
                renderReportSessions();
            }
        }

        // ----- تحميل أولي -----
        renderAcademicYears(); renderDepartments(); renderStudents(); renderReportActivities(); renderGeneralObservations(); renderScoreObservations(); renderStats(); renderGeneralSettings();

        // أشهر السنة الدراسية من شتنبر حتى يوليوز
        const months = [
            "شتنبر", "أكتوبر", "نونبر", "دجنبر", "يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو", "يوليوز"
        ];

        // --- منطق الغياب المدمج ---
        document.getElementById("absenceCard").onclick = function () {
            const deptSelect = document.getElementById('absDeptSelect');
            const sessionSelect = document.getElementById('absSessionSelect');
            deptSelect.innerHTML = '<option value="">-- اختر القسم --</option>';
            departments.forEach(d => deptSelect.appendChild(new Option(d.name, d.id)));
            sessionSelect.innerHTML = reportSessions.map(s => `<option value="${s}">${s}</option>`).join('');
            document.getElementById('absenceModal').classList.remove('hidden');
            // عرض قائمة الغياب فور فتح المودال إذا كان هناك قسم محدد مسبقاً
            if (deptSelect.value && sessionSelect.value) renderAbsenceList();

        };

        // --- منطق ترتيب المراكز ---
        function renderRankingDeptOptions() {
            const rankingSelect = document.getElementById('rankingDeptSelect');
            rankingSelect.innerHTML = '<option value="">-- اختر القسم/المستوى لعرض الترتيب --</option>';
            departments.forEach(d => {
                rankingSelect.appendChild(new Option(d.name, d.id));
            });
        }

        document.getElementById("rankingCard").onclick = function () {
            renderRankingDeptOptions();
            document.getElementById('rankingModal').classList.remove('hidden');
        };

        document.getElementById('rankingDeptSelect').onchange = function () {
            // تأكد من أن الدورة المختارة في الصفحة الرئيسية هي المستخدمة للترتيب
            const deptId = this.value;
            const session = reportSessionSelect.value;
            const resultList = document.getElementById('rankingResultList');

            if (!deptId) {
                resultList.innerHTML = '<p class="text-center text-gray-500">اختر قسماً لعرض ترتيب التلاميذ...</p>';
                return;
            }

            const deptStudents = students.filter(s => s.deptId == deptId && !s.isDroppedOut);
            const rankedList = deptStudents.map(s => {
                const avg = parseFloat(studentReports[s.id]?.[session]?.behaviorAverage) || 0;
                return { name: s.info['الاسم الكامل (بالعربية)'], avg: avg };
            }).sort((a, b) => b.avg - a.avg);

            if (rankedList.length === 0) {
                resultList.innerHTML = '<p class="text-center text-gray-500">لا يوجد تلاميذ في هذا القسم.</p>';
                return;
            }

            let html = '<table class="w-full text-right border-collapse"><thead><tr class="bg-amber-50"> <th class="p-2 border">المركز</th> <th class="p-2 border">الاسم الكامل</th> <th class="p-2 border">المعدل</th> </tr></thead><tbody>';
            rankedList.forEach((s, index) => {
                const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1);
                html += `<tr class="${index === 0 ? 'bg-yellow-50 font-bold' : ''}">
                        <td class="p-2 border text-center">${medal}</td>
                        <td class="p-2 border">${s.name}</td>
                        <td class="p-2 border text-center">${s.avg > 0 ? s.avg.toFixed(2) : '-'}</td>
                    </tr>`;
            });
            html += '</tbody></table>';
            resultList.innerHTML = html;
        };

        document.getElementById('absDeptSelect').onchange = renderAbsenceList;
        document.getElementById('absSessionSelect').onchange = renderAbsenceList;

        function renderAbsenceList() {
            const deptId = document.getElementById('absDeptSelect').value;
            const session = document.getElementById('absSessionSelect').value;
            const list = document.getElementById('absStudentsList');
            list.innerHTML = ''; // مسح القائمة قبل إعادة بنائها

            if (!deptId || !session) {
                list.innerHTML = '<p class="text-center text-gray-500">اختر القسم والدورة لبدء تسجيل الغياب...</p>';
                return;
            }

            const deptStudents = students.filter(s => s.deptId == deptId && !s.isDroppedOut);
            if (deptStudents.length === 0) {
                list.innerHTML = '<p class="text-center text-gray-500">لا يوجد تلاميذ في هذا القسم.</p>';
                return;
            }

            let html = '<table class="w-full text-right border-collapse"><thead><tr class="bg-gray-100"><th class="p-2 border">التلميذ</th><th class="p-2 border text-center">مبرر</th><th class="p-2 border text-center">غير مبرر</th></tr></thead><tbody>';

            deptStudents.forEach(s => {
                const sAbs = (absences[s.id] && absences[s.id][session]) ? absences[s.id][session] : [];
                const just = sAbs.filter(a => a.type === 'justified').length;
                const unjust = sAbs.filter(a => a.type === 'unjustified').length;

                html += `<tr>
                        <td class="p-2 border font-medium">${s.info['الاسم الكامل (بالعربية)']}</td>
                        <td class="p-2 border text-center">
                            <input type="number" min="0" value="${just}" onchange="updateAbsenceCount('${s.id}', '${session}', 'justified', this.value)" class="w-16 text-center border rounded">
                        </td>
                        <td class="p-2 border text-center">
                            <input type="number" min="0" value="${unjust}" onchange="updateAbsenceCount('${s.id}', '${session}', 'unjustified', this.value)" class="w-16 text-center border rounded">
                        </td>
                    </tr>`;
            });
            html += '</tbody></table>';
            list.innerHTML = html;
            feather.replace(); // لتفعيل أيقونة التقويم المضافة حديثاً
        }

        window.updateAbsenceCount = function (studentId, session, type, count) {
            if (!absences[studentId]) absences[studentId] = {};
            // Ensure the session object exists
            if (!absences[studentId][session]) absences[studentId][session] = [];

            const otherType = type === 'justified' ? 'unjustified' : 'justified';
            // Filter out existing absences of the current type
            const filteredAbs = absences[studentId][session].filter(a => a.type !== type);

            const newAbsencesForType = [];
            for (let i = 0; i < parseInt(count || 0); i++) { // Ensure count is a number and handle empty string
                newAbsencesForType.push({ type: type, date: new Date().toISOString() });
            }

            absences[studentId][session] = [...filteredAbs, ...newAbsencesForType];
            saveAll();
            // If the currently viewed student is the one whose absence was updated, refresh their report card
            if (selectedHomeStudentId == studentId) {
                renderNewReportCard(studentId);
            }
        };

        // --- منطق أداء الواجبات المدمج ---
        document.getElementById("monthlyPerformanceCard").onclick = function () {
            const deptSelect = document.getElementById('perfDeptSelect');
            const monthSelect = document.getElementById('perfMonthSelect');
            deptSelect.innerHTML = '<option value="">-- اختر القسم --</option>';
            departments.forEach(d => deptSelect.appendChild(new Option(d.name, d.id)));
            monthSelect.innerHTML = months.map(m => `<option value="${m}">${m}</option>`).join('');
            document.getElementById('performanceModal').classList.remove('hidden');
            // عرض قائمة الأداء فور فتح المودال إذا كان هناك قسم وشهر محدد مسبقاً
            if (deptSelect.value && monthSelect.value) renderPerformanceList();
        };

        document.getElementById('perfDeptSelect').onchange = renderPerformanceList;
        document.getElementById('perfMonthSelect').onchange = renderPerformanceList;

        function renderPerformanceList() {
            const deptId = document.getElementById('perfDeptSelect').value;
            const month = document.getElementById('perfMonthSelect').value;
            const list = document.getElementById('perfStudentsList');
            list.innerHTML = ''; // مسح القائمة قبل إعادة بنائها

            if (!deptId || !month) {
                list.innerHTML = '<p class="text-center text-gray-500">اختر القسم والشهر لإدخال النقط...</p>';
                return;
            }

            const deptStudents = students.filter(s => s.deptId == deptId && !s.isDroppedOut);
            if (deptStudents.length === 0) {
                list.innerHTML = '<p class="text-center text-gray-500">لا يوجد تلاميذ في هذا القسم.</p>';
                return;
            }

            let html = '<table class="w-full text-right border-collapse"><thead><tr class="bg-gray-100"><th class="p-2 border">التلميذ</th><th class="p-2 border text-center">المبلغ الشهري / الأداء</th><th class="p-2 border text-center">إجراءات</th></tr></thead><tbody>';

            deptStudents.forEach(s => {
                const val = (monthlyGrades[s.id] && monthlyGrades[s.id][month]) ? monthlyGrades[s.id][month] : '';
                html += `<tr>
                        <td class="p-2 border font-medium">${s.info['الاسم الكامل (بالعربية)']}</td>
                        <td class="p-2 border text-center w-1/2">
                            <input type="text" value="${val}" onblur="updatePerfGrade('${s.id}', '${month}', this.value)" class="w-full px-2 py-1 border rounded" placeholder="مثال: 8.5 أو جيد">
                        </td>
                        <td class="p-2 border text-center">
                            <button onclick="printPaymentReceipt('${s.id}', '${month}', '${val}')" class="${val ? 'bg-teal-600' : 'bg-gray-400'} text-white px-3 py-1 rounded text-xs" ${!val ? 'disabled' : ''}>🖨 وصل</button>
                        </td>
                    </tr>`;
            });
            html += '</tbody></table>';
            list.innerHTML = html;
        }

        window.updatePerfGrade = function (studentId, month, val) {
            if (!monthlyGrades[studentId]) monthlyGrades[studentId] = {};
            monthlyGrades[studentId][month] = val;
            saveAll();
            renderPerformanceList(); // لتحديث حالة زر الوصل
        };

        // --- وظيفة طباعة وصل الدفع ---
        window.printPaymentReceipt = function (studentId, month, amount) {
            const student = students.find(s => s.id == studentId);
            const dept = departments.find(d => d.id == student.deptId);
            const today = new Date().toLocaleDateString('ar-MA');

            const win = window.open('', '', 'width=600,height=400');
            win.document.write(`
                    <html dir="rtl"><head>
                        <title>وصل أداء</title>
                        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
                        <style>
                            @page { size: A5 landscape; margin: 5mm; }
                            body { font-family: 'Tajawal', sans-serif; padding: 15px; border: 2px solid #teal; border-radius: 10px; width: 138mm; margin: auto; box-sizing: border-box; }
                            .header { text-align: center; border-bottom: 2px solid #teal; margin-bottom: 20px; }
                            .info { margin-bottom: 8px; font-size: 14px; }
                            .amount { font-size: 18px; font-weight: bold; color: teal; text-align: center; margin: 15px 0; border: 2px dashed teal; padding: 8px; background: #f0fdfa; }
                            .footer { margin-top: 30px; display: flex; justify-content: space-between; }
                        </style>
                    </head><body>
                        <div class="header">
                            <h2>${(currentSession && currentSession.institution) ? currentSession.institution.replace(/\n/g, '<br>') : (institutionName || 'المؤسسة التعليمية')}</h2>
                            <p>وصل استلام مبلغ شهري</p>
                        </div>
                        <div class="info"><strong>التلميذ(ة):</strong> ${student.info['الاسم الكامل (بالعربية)']}</div>
                        <div class="info"><strong>القسم:</strong> ${dept?.name || '-'}</div>
                        <div class="info"><strong>شهر:</strong> ${month}</div>
                        <div class="info"><strong>السنة الدراسية:</strong> ${currentAcademicYear}</div>
                        <div class="amount">المبلغ المؤدى: ${amount}</div>
                        <div class="info"><strong>تاريخ الأداء:</strong> ${today}</div>
                        <div class="footer">
                            <span>توقيع الإدارة: ...........</span>
                            <span>توقيع ولي الأمر: ...........</span>
                        </div>
                        <script>
window.onload = function() { window.print(); window.close(); }<\/script>
                    </body></html>
                `);
            win.document.close();
        };

        // --- وظيفة طباعة لائحة الترتيب ---
        window.printRankingList = function () {
            const rankingHtml = document.getElementById('rankingResultList').innerHTML;
            const deptName = document.getElementById('rankingDeptSelect').options[document.getElementById('rankingDeptSelect').selectedIndex].text;
            const session = reportSessionSelect.value;

            if (!rankingHtml || rankingHtml.includes('اختر قسماً')) return alert("يرجى اختيار قسم أولاً");

            const win = window.open('', '', 'width=800,height=600');
            win.document.write(`
                    <html dir="rtl"><head>
                        <title>لائحة الترتيب</title>
                        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
                        <style>
                            @page { size: A4; margin: 15mm; }
                            body { font-family: 'Tajawal', sans-serif; padding: 0; margin: 0; }
                            h2 { text-align: center; color: #b45309; border-bottom: 2px solid #b45309; padding-bottom: 10px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; table-layout: fixed; }
                            th, td { border: 1px solid #ddd; padding: 12px; text-align: center; }
                            th { background-color: #fef3c7; }
                        </style>
                    </head><body>
                        <div style="text-align:center">${(currentSession && currentSession.institution) ? currentSession.institution.replace(/\n/g, '<br>') : (institutionName || '')}</div>
                        <h2>🏆 لائحة المتفوقين: ${deptName}</h2>
                        <p style="text-align:center">الدورة: ${session} | السنة الدراسية: ${currentAcademicYear}</p>
                        ${rankingHtml}
                        <script>
window.onload = function() { window.print(); window.close(); }<\/script>
                    </body></html>
                `);
            win.document.close();
        };

        // --- طباعة جميع تقارير المستوى ---
        async function printAllLevelReports() {
            const deptId = homeDeptSelect.value;
            const session = reportSessionSelect.value;
            if (!deptId) return alert("الرجاء اختيار قسم أولاً");

            const levelStudents = students.filter(s => s.deptId == deptId);
            if (levelStudents.length === 0) return alert("القسم المختار لا يحتوي على تلاميذ");

            if (!confirm(`هل تريد طباعة تقارير ${levelStudents.length} تلميذ(ة) في هذا القسم؟`)) return;

            const win = window.open('', '', 'width=900,height=700');
            win.document.write(`
                    <html dir="rtl"><head>
                        <title>طباعة تقارير القسم</title>
                        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
                        <style>
                            @page { 
                                size: A4; 
                                margin: 0; 
                            }
                            body { 
                                font-family: 'Tajawal', sans-serif; 
                                margin: 0; 
                                padding: 0;
                                -webkit-print-color-adjust: exact; 
                                print-color-adjust: exact;
                            }
                            .page-break { 
                                page-break-after: always; 
                                break-after: page; 
                                page-break-inside: avoid;
                                break-inside: avoid;
                                border-bottom: 2px dashed #ccc; 
                                margin-bottom: 20px; 
                            }
                            @media print { 
                                .page-break { 
                                    border: none; 
                                    margin-bottom: 0; 
                                } 
                            }
                            .page { 
                                width: 210mm;  /* A4 width */
                                height: 297mm; /* A4 height */
                                margin: 0 auto; 
                                padding: 10mm; /* 10mm margins */
                                box-sizing: border-box;
                                background: #fff; 
                                position: relative; 
                                display: flex; /* Use flexbox for layout */
                                flex-direction: column; /* Arrange children vertically */
                            }
                            .page > * { flex-shrink: 0; } /* Prevent elements from shrinking */
                            .page > .main-report-table { flex-grow: 1; } /* Allow main table to grow */

                            h2 { font-size: 18px !important; margin-bottom: 8px !important; }
                            h3 { font-size: 14px !important; padding: 5px 10px !important; margin-top: 10px !important; margin-bottom: 8px !important; }
                            table { width: 100%; border-collapse: collapse; margin-bottom: 8px !important; }
                            th, td { border: 1px solid #ddd; padding: 5px !important; text-align: right; font-size: 12px !important; vertical-align: middle; }
                            div, p, span, strong, label { font-size: 12px !important; }
                            #reportCardStudentImage { width: 90px !important; height: 90px !important; }
                            .main-report-table th, .main-report-table td { text-align: center; }
                            .main-report-table td[rowspan] { font-size: 14px !important; } /* Enlarge the "الأنشطة التربوية" text */
                            .draggable { position: absolute; user-select: none; }
                            .resize-handle, .delete-image-btn, .editable[placeholder]:empty:before { display: none !important; }
                        </style>
                    </head><body>
                    <div id="print-container"></div>
                    </body></html>
                `);

            const container = win.document.getElementById('print-container');

            for (let student of levelStudents) {
                // استدعاء دالة الرسم لتحديث الواجهة المخفية مؤقتاً لكل تلميذ
                selectHomeStudent(student.id);

                const sheetClone = document.getElementById('sheet').cloneNode(true);

                // إزالة عناصر التحكم في الصور
                sheetClone.querySelectorAll('.resize-handle, .delete-image-btn').forEach(el => el.remove());

                // معالجة القائمة المنسدلة لملاحظات الأستاذ
                const originalTeacherNoteSelect = document.querySelector('#sheet [data-field="teacher_notes_select"]');
                const clonedTeacherNoteContainer = sheetClone.querySelector('[data-field="teacher_notes_select"]')?.parentElement;

                if (originalTeacherNoteSelect && clonedTeacherNoteContainer) {
                    const text = win.document.createElement('span');
                    if (originalTeacherNoteSelect.value === 'custom') {
                        const originalCustomTextarea = document.querySelector('#sheet [data-field="teacher_notes_custom"]');
                        text.textContent = originalCustomTextarea ? originalCustomTextarea.value : '';
                    } else {
                        text.textContent = originalTeacherNoteSelect.value;
                    }
                    clonedTeacherNoteContainer.parentElement.innerHTML = `<strong>ملاحظات الأستاذ(ة):</strong><br>${text.textContent}`;
                }

                // تحويل بقية حقول الإدخال إلى نصوص ثابتة (إبقاء خانات الاختيار كما هي)
                sheetClone.querySelectorAll('input[type="number"], input[type="text"], textarea').forEach(input => {
                    const text = win.document.createElement('span');
                    text.textContent = input.value;
                    input.parentNode.replaceChild(text, input);
                });

                // معالجة القائمة المنسدلة للمعدل العام السنوي
                const finalAverageSelect = sheetClone.querySelector('#finalAverageLabelSelect');
                if (finalAverageSelect) {
                    const text = win.document.createElement('span');
                    text.textContent = finalAverageSelect.options[finalAverageSelect.selectedIndex]?.text || '';
                    finalAverageSelect.parentNode.replaceChild(text, finalAverageSelect);
                }

                sheetClone.querySelectorAll('.observation-cell').forEach(cell => {
                    cell.innerHTML = cell.textContent;
                });

                const pageDiv = win.document.createElement('div');
                pageDiv.className = 'page page-break';
                pageDiv.innerHTML = sheetClone.innerHTML;
                container.appendChild(pageDiv);
            }

            win.document.close();
            win.focus();
            setTimeout(() => {
                win.print();
                win.close();
                // إعادة عرض التلميذ الذي كان مختاراً أصلاً
                if (selectedHomeStudentId) selectHomeStudent(selectedHomeStudentId);
            }, 1000);
        }
    </script>
    <!-- تفعيل أزرار الاستيراد والتصدير -->
    <script>















        const exportBtn = document.getElementById('exportBtn');
        const importBtn = document.getElementById('importBtn');

        exportBtn.addEventListener('click', () => {
            document.getElementById('exportModal').classList.remove('hidden');
        });

        importBtn.addEventListener('click', () => {
            document.getElementById('importModal').classList.remove('hidden');
        });

        window.exportAll = function () {
            // حفظ أي تعديلات غير محفوظة قبل التصدير
            if (typeof saveAll === 'function') {
                saveAll();
            }

            // تجميع كل البيانات من localStorage
            const dataToExport = {
                academicYears: JSON.parse(appStorage.getItem("academicYears") || "[]"),
                academicData: JSON.parse(appStorage.getItem("academicData") || "{}"),
                currentAcademicYear: appStorage.getItem("currentAcademicYear"),
                institutionName: appStorage.getItem("institutionName") || "",
                studentFields: JSON.parse(appStorage.getItem("studentFields") || "null"),
                migration_v3_complete: appStorage.getItem("migration_v3_complete") || "false"
            };

            const dataStr = JSON.stringify(dataToExport, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `full_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            document.getElementById('exportModal').classList.add('hidden');
        };

        window.exportImages = function () {
            const academicDataStr = appStorage.getItem("academicData");
            if (!academicDataStr) return alert("لا توجد بيانات لتصديرها.");

            const acData = JSON.parse(academicDataStr);
            const imagesExport = { type: 'images_only', years: {} };

            for (const year in acData) {
                imagesExport.years[year] = {
                    studentImages: {},
                    reportImagesByGender: acData[year].reportImagesByGender || { 'ذكر': [], 'أنثى': [] }
                };
                if (acData[year].students) {
                    acData[year].students.forEach(s => {
                        const name = s.info && s.info['الاسم الكامل (بالعربية)'];
                        if (name && s.info && s.info['صورة']) {
                            imagesExport.years[year].studentImages[name] = s.info['صورة'];
                        }
                    });
                }
            }

            const dataStr = JSON.stringify(imagesExport, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `images_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            document.getElementById('exportModal').classList.add('hidden');
        };

        window.importAll = async function (e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const imported = JSON.parse(event.target.result);
                    if (imported.type === 'images_only') {
                        alert("هذا الملف يحتوي على صور فقط. يرجى استخدام 'استيراد الصور فقط'.");
                        return;
                    }
                    if (imported.academicData && imported.academicYears) {
                        if (confirm(`هل تريد استبدال جميع بيانات النظام الحالية بالبيانات من الملف المستورد؟ سيتم حذف جميع البيانات الحالية.`)) {
                            appStorage.setItem("academicYears", JSON.stringify(imported.academicYears));
                            appStorage.setItem("academicData", JSON.stringify(imported.academicData));
                            appStorage.setItem("currentAcademicYear", imported.currentAcademicYear);
                            appStorage.setItem("institutionName", imported.institutionName || "");
                            appStorage.setItem("studentFields", JSON.stringify(imported.studentFields || null));
                            appStorage.setItem("migration_v3_complete", imported.migration_v3_complete || "false");

                            // تعيين المتغيرات العامة ليقوم حفظ السحابة باستخدامها
                            academicData = imported.academicData || {};
                            academicYears = imported.academicYears || [];
                            currentAcademicYear = imported.currentAcademicYear || "";
                            institutionName = imported.institutionName || "";
                            studentFields = imported.studentFields || null;

                            // مزامنة البيانات فورا مع السحابة قبل إعادة التحميل لمنع مسحها
                            if (typeof fs !== 'undefined' && typeof cloudUserId !== 'undefined' && cloudUserId) {
                                try {
                                    updateCloudStatus('saving');

                                    // دالة تجريد الصور لأن حجمها كبير
                                    const strippedAcademicData = JSON.parse(JSON.stringify(academicData));
                                    for (const year in strippedAcademicData) {
                                        strippedAcademicData[year].reportImagesByGender = { 'ذكر': [], 'أنثى': [] };
                                        if (strippedAcademicData[year].studentReports) {
                                            for (const sid in strippedAcademicData[year].studentReports) {
                                                if (strippedAcademicData[year].studentReports[sid].photo) {
                                                    delete strippedAcademicData[year].studentReports[sid].photo;
                                                }
                                            }
                                        }
                                        if (strippedAcademicData[year].students) {
                                            strippedAcademicData[year].students.forEach(s => {
                                                if (s.photo) delete s.photo;
                                                if (s.info && s.info['الصورة']) delete s.info['الصورة'];
                                            });
                                        }
                                    }

                                    const newLastUpdated = new Date().toISOString();
                                    const dataToSave = {
                                        academicData: strippedAcademicData,
                                        academicYears: academicYears,
                                        currentAcademicYear: currentAcademicYear,
                                        institutionName: institutionName,
                                        studentFields: studentFields,
                                        lastUpdated: newLastUpdated,
                                        lastUpdatedBy: typeof instanceId !== 'undefined' ? instanceId : 'import'
                                    };

                                    // تحديث الوقت محلياً لكي لا تقوم السحابة بالكتابة فوقه بعد التحديث
                                    appStorage.setItem("lastUpdated", newLastUpdated);

                                    // الكتابة فوق بيانات السحابة بشكل كامل بالبيانات المستوردة
                                    await fs.collection("users").doc(cloudUserId).set(dataToSave);
                                    // النسخ الاحتياطي في Realtime DB
                                    if (typeof db !== 'undefined') {
                                        db.ref('backup/' + cloudUserId).set(dataToSave).catch(e => console.error(e));
                                    }
                                    console.log("تم الرفع للسحابة بنجاح");
                                } catch (err) {
                                    console.error("خطأ أثناء مزامنة الاستيراد مع السحابة", err);
                                    alert("تحذير: تم الاستيراد محلياً ولكن فشل الرفع للسحابة (السبب: " + err.message + ")");
                                }
                            } else {
                                appStorage.setItem("lastUpdated", new Date().toISOString());
                            }

                            alert('تم استيراد البيانات بنجاح. سيتم إعادة تحميل الصفحة.');
                            window.location.reload();
                        }
                    } else {
                        alert("ملف الاستيراد غير صالح أو لا يطابق البنية المطلوبة.");
                    }
                } catch (err) {
                    alert("خطأ في قراءة الملف.");
                    console.error(err);
                }
            };
            reader.readAsText(file);
            e.target.value = ''; // Reset
            document.getElementById('importModal').classList.add('hidden');
        };

        window.importImages = async function (e) {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const imported = JSON.parse(event.target.result);
                    if (imported.type !== 'images_only') {
                        alert("هذا الملف ليس ملف صور فقط. يرجى استخدام 'استيراد كل البيانات'.");
                        return;
                    }

                    const acData = JSON.parse(appStorage.getItem("academicData") || "{}");
                    let importedCount = 0;

                    for (const year in imported.years) {
                        if (acData[year]) {
                            // استيراد صور النتائج الدراسية
                            if (imported.years[year].reportImagesByGender) {
                                acData[year].reportImagesByGender = imported.years[year].reportImagesByGender;
                            }

                            // استيراد صور التلاميذ حسب الاسم
                            if (imported.years[year].studentImages && acData[year].students) {
                                acData[year].students.forEach(s => {
                                    const name = s.info && s.info['الاسم الكامل (بالعربية)'];
                                    if (name && imported.years[year].studentImages[name]) {
                                        s.info['صورة'] = imported.years[year].studentImages[name];
                                        importedCount++;
                                    }
                                });
                            }
                        }
                    }

                    appStorage.setItem("academicData", JSON.stringify(acData));
                    alert(`تم استيراد الصور بنجاح! تم ربط ${importedCount} صورة تلاميذ.`);
                    window.location.reload();

                } catch (err) {
                    alert("خطأ في قراءة الملف.");
                    console.error(err);
                }
            };
            reader.readAsText(file);
            e.target.value = ''; // Reset
            document.getElementById('importModal').classList.add('hidden');
        };

        // تهيئة نظام المصادقة عند تحميل الصفحة
        initAuth();

    </script>
</body>

</html>
