// ============================================================
// === 2. حالة النظام العامة والبيانات (State Management) ===
// ============================================================

// --- نظام السنوات الدراسية والحالة المحلية ---
let academicYears = JSON.parse(appStorage.getItem("academicYears") || "[]");
let currentAcademicYear = appStorage.getItem("currentAcademicYear");
if (!currentAcademicYear) {
    try {
        const _s = JSON.parse(localStorage.getItem("sub_appSession") || "null");
        if (_s && _s.phone) {
            currentAcademicYear = localStorage.getItem("user_year_" + _s.phone);
        }
    } catch (e) { }
    if (!currentAcademicYear) {
        currentAcademicYear = localStorage.getItem("admin_currentAcademicYear") || localStorage.getItem("last_selected_academic_year");
    }
}
let academicData = JSON.parse(appStorage.getItem("academicData") || "{}");
let studentFields = JSON.parse(appStorage.getItem("studentFields"));
let institutionName = appStorage.getItem("institutionName") || "";

// التأكد من توفر البيانات الأساسية من النسخة المدمجة إذا كان التخزين فارغاً
function ensureInitialData() {
    let hasStudents = false;
    if (academicData && typeof academicData === 'object') {
        for (const y in academicData) {
            if (academicData[y] && Array.isArray(academicData[y].students) && academicData[y].students.length > 0) {
                hasStudents = true;
                break;
            }
        }
    }
    if (!hasStudents && typeof window !== 'undefined' && window.__EMBEDDED_BACKUP_RECOVERY__) {
        const emb = window.__EMBEDDED_BACKUP_RECOVERY__;
        if (emb && emb.academicData) {
            console.log("[State] Initializing active state from embedded backup recovery data...");
            academicData = JSON.parse(JSON.stringify(emb.academicData));
            if (Array.isArray(emb.academicYears) && emb.academicYears.length > 0) {
                academicYears = emb.academicYears;
            }
            if (!currentAcademicYear) {
                if (emb.currentAcademicYear) {
                    currentAcademicYear = emb.currentAcademicYear;
                } else if (academicYears.length > 0) {
                    currentAcademicYear = "2025/2026";
                }
            }
            if (emb.institutionName) institutionName = emb.institutionName;
            if (emb.studentFields) studentFields = emb.studentFields;
        }
    }
}
ensureInitialData();


// معرف مستمر خاص بالجهاز للمزامنة عند استخدام بروتوكول file://
let cloudUserId = appStorage.getItem("cloudUserId");
if (!cloudUserId) {
    cloudUserId = 'user_' + Date.now().toString() + '_' + Math.random().toString().slice(2, 10);
    appStorage.setItem("cloudUserId", cloudUserId);
}

// ترحيل البيانات القديمة إلى النظام الجديد (يُنفذ مرة واحدة فقط)
function migrateOldData() {
    if (appStorage.getItem("migration_v3_complete") === "true") return;

    let migrationPerformed = false;
    const oldDepts = appStorage.getItem("departments");
    if (oldDepts && !Object.keys(academicData).length) {
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
        (yearData.students || []).forEach(student => {
            if (typeof student.name === 'string') {
                student.info = { "الاسم الكامل (بالعربية)": student.name };
                delete student.name;
                migrationPerformed = true;
            }
            if (student.info && student.info.hasOwnProperty('الاسم الكامل')) {
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
        console.log("تم تحديث بنية البيانات بنجاح.");
    }
    appStorage.setItem("migration_v3_complete", "true");
}
migrateOldData();

// تعيين السنة الدراسية الحالية
if (!currentAcademicYear || !academicYears.includes(currentAcademicYear)) {
    const pinnedYear = (typeof currentSession !== 'undefined' && currentSession && currentSession.phone)
        ? localStorage.getItem("user_year_" + currentSession.phone)
        : (localStorage.getItem("admin_currentAcademicYear") || localStorage.getItem("last_selected_academic_year"));
    if (pinnedYear && academicYears.includes(pinnedYear)) {
        currentAcademicYear = pinnedYear;
    } else {
        currentAcademicYear = (academicYears.includes("2025/2026")) ? "2025/2026" : (academicYears.length > 0 ? academicYears[academicYears.length - 1] : null);
    }
    if (currentAcademicYear) appStorage.setItem("currentAcademicYear", currentAcademicYear);
}

// البيانات الحالية بناءً على السنة المختارة
let departments = [];
let students = [];
let subjects = [];
let grades = {};
let monthlyGrades = {};
let studentReports = {};
let reportActivities = [];
let reportBehaviors = [];
let generalObservations = [];
if (!institutionName) institutionName = "";
let reportSessions = [];
let absences = {};
let scoreObservations = [];
let customFinalAverageLabels = [];
let globalFinalAverageLabel = 'المعدل العام السنوي';
let reportImagesByGender = { 'ذكر': [], 'أنثى': [] };

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
    scoreObservations = data.scoreObservations || [
        { min: 8, max: 10, text: "ممتاز" },
        { min: 7, max: 7.99, text: "جيد جدا" },
        { min: 6, max: 6.99, text: "حسن" },
        { min: 5, max: 5.99, text: "مقبول" },
        { min: 0, max: 4.99, text: "يحتاج لمجهود" }
    ];
    customFinalAverageLabels = data.customFinalAverageLabels || [];
    absences = data.absences || {};
    globalFinalAverageLabel = data.globalFinalAverageLabel || 'المعدل العام السنوي';
}

const allReportItems = [...reportActivities, ...reportBehaviors];

// حفظ كل البيانات في التخزين المحلي واستدعاء الحفظ التلقائي للسحابة
const saveAll = () => {
    if (currentAcademicYear) {
        const existingYearData = academicData[currentAcademicYear] || {};
        // حماية: إذا كان في الذاكرة 0 تلاميذ ولكن في academicData مخزن تلاميذ، لا نمسحهم
        const safeStudents = (Array.isArray(students) && students.length > 0)
            ? students
            : (Array.isArray(existingYearData.students) ? existingYearData.students : []);
        const safeDepartments = (Array.isArray(departments) && departments.length > 0)
            ? departments
            : (Array.isArray(existingYearData.departments) ? existingYearData.departments : []);

        academicData[currentAcademicYear] = {
            ...existingYearData,
            departments: safeDepartments,
            students: safeStudents,
            subjects: (subjects && subjects.length) ? subjects : (existingYearData.subjects || []),
            grades: grades || existingYearData.grades || {},
            monthlyGrades: monthlyGrades || existingYearData.monthlyGrades || {},
            studentReports: studentReports || existingYearData.studentReports || {},
            reportActivities: (reportActivities && reportActivities.length) ? reportActivities : (existingYearData.reportActivities || ["القرآن الكريم", "القيم والعادات", "اللغة العربية", "الرياضيات", "الأنشطة العلمية"]),
            reportBehaviors: (reportBehaviors && reportBehaviors.length) ? reportBehaviors : (existingYearData.reportBehaviors || ["المواظبة على الحضور", "السلوك داخل القسم"]),
            generalObservations: (generalObservations && generalObservations.length) ? generalObservations : (existingYearData.generalObservations || ["يتحسن", "مجهود طيب", "عمل حسن", "يحتاج إلى تركيز", "يشارك", "لا يشارك"]),
            reportSessions: (reportSessions && reportSessions.length) ? reportSessions : (existingYearData.reportSessions || ["الدورة الأولى", "الدورة الثانية"]),
            absences: absences || existingYearData.absences || {},
            reportImagesByGender: reportImagesByGender || existingYearData.reportImagesByGender || { 'ذكر': [], 'أنثى': [] },
            customFinalAverageLabels: customFinalAverageLabels || existingYearData.customFinalAverageLabels || [],
            globalFinalAverageLabel: globalFinalAverageLabel || existingYearData.globalFinalAverageLabel || 'المعدل العام السنوي',
            scoreObservations: scoreObservations || existingYearData.scoreObservations || [
                { min: 8, max: 10, text: "ممتاز" },
                { min: 7, max: 7.99, text: "جيد جدا" },
                { min: 6, max: 6.99, text: "حسن" },
                { min: 5, max: 5.99, text: "مقبول" },
                { min: 0, max: 4.99, text: "يحتاج لمجهود" }
            ]
        };
    }
    try {
        appStorage.setItem("academicData", JSON.stringify(academicData));
    } catch (e) {
        console.warn("Storage warning handled:", e);
    }
    if (typeof idbManager !== 'undefined') {
        try { idbManager.setItem(appStorage._getPrefix() + "academicData", academicData); } catch (e) { }
    }
    appStorage.setItem("academicYears", JSON.stringify(academicYears));
    appStorage.setItem("currentAcademicYear", currentAcademicYear);
    appStorage.setItem("institutionName", institutionName);
    appStorage.setItem("studentFields", JSON.stringify(studentFields));

    if (typeof autoSaveToFirebase === 'function') {
        autoSaveToFirebase();
    }
};

// تحميل البيانات للسنة الحالية
const loadDataForCurrentYear = () => {
    if (currentAcademicYear && academicData[currentAcademicYear]) {
        const data = academicData[currentAcademicYear];
        if (typeof currentSession !== 'undefined' && currentSession && !currentSession.isAdmin) {
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
        scoreObservations = data.scoreObservations || [
            { min: 8, max: 10, text: "ممتاز" },
            { min: 7, max: 7.99, text: "جيد جدا" },
            { min: 6, max: 6.99, text: "حسن" },
            { min: 5, max: 5.99, text: "مقبول" },
            { min: 0, max: 4.99, text: "يحتاج لمجهود" }
        ];
        customFinalAverageLabels = data.customFinalAverageLabels || [];
        absences = data.absences || {};
        globalFinalAverageLabel = data.globalFinalAverageLabel || 'المعدل العام السنوي';
    }
    allReportItems.splice(0, allReportItems.length, ...reportActivities, ...reportBehaviors);
};

// تحديث الواجهة بالكامل
const refreshUI = () => {
    if (typeof renderStats === 'function') renderStats();
    if (typeof renderDepartments === 'function') renderDepartments();
    if (typeof renderStudents === 'function') renderStudents();
    if (typeof renderReportActivities === 'function') renderReportActivities();
    if (typeof renderGeneralObservations === 'function') renderGeneralObservations();
    if (typeof renderReportSessions === 'function') renderReportSessions();
    if (typeof renderScoreObservations === 'function') renderScoreObservations();
    if (typeof renderYearList === 'function') renderYearList();
    if (typeof renderGeneralSettings === 'function') renderGeneralSettings();
    if (typeof renderAcademicYears === 'function') renderAcademicYears();
    if (typeof renderRankingDeptOptions === 'function') renderRankingDeptOptions();

    const homeDeptSelect = document.getElementById("homeDeptSelect");
    const homeStudentSelect = document.getElementById("homeStudentSelect");
    const homeStudentInfo = document.getElementById("homeStudentInfo");
    const studentDisplaySection = document.getElementById("studentDisplaySection");
    const homeStudentCount = document.getElementById("homeStudentCount");
    const tableDeptLabel = document.getElementById("tableDeptLabel");

    if (homeDeptSelect) homeDeptSelect.value = "";
    if (homeStudentSelect) homeStudentSelect.innerHTML = `<option value="">-- اختر تلميذ --</option>`;
    if (homeStudentInfo) homeStudentInfo.textContent = "";
    if (studentDisplaySection) studentDisplaySection.classList.add("hidden");
    if (homeStudentCount) homeStudentCount.textContent = "";
    if (tableDeptLabel) tableDeptLabel.textContent = "";
};

// إعادة تحميل الحالة والبيانات من التخزين المحلي فوراً
function reloadStateFromStorage() {
    academicYears = JSON.parse(appStorage.getItem("academicYears") || "[]");
    
    // محاولة استرجاع السنة المثبتة المخصصة للمستخدم أولاً
    let userYear = null;
    if (typeof currentSession !== 'undefined' && currentSession && currentSession.phone) {
        userYear = localStorage.getItem("user_year_" + currentSession.phone);
    }
    currentAcademicYear = userYear || appStorage.getItem("currentAcademicYear") || localStorage.getItem("admin_currentAcademicYear") || localStorage.getItem("last_selected_academic_year");

    academicData = JSON.parse(appStorage.getItem("academicData") || "{}");
    studentFields = JSON.parse(appStorage.getItem("studentFields") || "null");
    institutionName = appStorage.getItem("institutionName") || "";

    ensureInitialData();

    if (!currentAcademicYear || !academicYears.includes(currentAcademicYear)) {
        currentAcademicYear = (academicYears.includes("2025/2026")) ? "2025/2026" : (academicYears.length > 0 ? academicYears[academicYears.length - 1] : null);
    }
    if (currentAcademicYear) {
        appStorage.setItem("currentAcademicYear", currentAcademicYear);
    }

    loadDataForCurrentYear();
    refreshUI();
}
window.reloadStateFromStorage = reloadStateFromStorage;

// استعادة الصور من IndexedDB إذا كانت مفقودة في الذاكرة الحالية بسبب قيود localStorage
async function hydrateImagesFromIndexedDB() {
    if (typeof idbManager === 'undefined') return;
    try {
        const pfx = (typeof appStorage !== 'undefined' && appStorage._getPrefix) ? appStorage._getPrefix() : 'sub_0662065072_';
        const fullKey = pfx + 'academicData';
        let idbData = await idbManager.getItem(fullKey);
        if (!idbData) idbData = await idbManager.getItem('sub_0662065072_academicData');
        if (!idbData) idbData = await idbManager.getItem('academicData_full');
        if (!idbData) idbData = await idbManager.getItem('academicData');

        if (idbData && typeof idbData === 'object') {
            let hydrated = false;
            for (const y in idbData) {
                if (academicData[y]) {
                    // استعادة صور التقرير
                    if (idbData[y].reportImagesByGender && (!academicData[y].reportImagesByGender || (!academicData[y].reportImagesByGender['ذكر']?.length && !academicData[y].reportImagesByGender['أنثى']?.length))) {
                        academicData[y].reportImagesByGender = idbData[y].reportImagesByGender;
                        hydrated = true;
                    }
                    // استعادة صور التلاميذ
                    if (Array.isArray(idbData[y].students) && Array.isArray(academicData[y].students)) {
                        idbData[y].students.forEach(idbSt => {
                            if (idbSt && idbSt.info && idbSt.info['صورة']) {
                                const st = academicData[y].students.find(s => String(s.id) === String(idbSt.id) || (s.info && s.info['الاسم الكامل (بالعربية)'] === idbSt.info['الاسم الكامل (بالعربية)']));
                                if (st && st.info && !st.info['صورة']) {
                                    st.info['صورة'] = idbSt.info['صورة'];
                                    hydrated = true;
                                }
                            }
                        });
                    }
                }
            }
            if (hydrated) {
                console.log("[IndexedDB] Images successfully hydrated into active academicData in memory.");
                if (typeof loadDataForCurrentYear === 'function') loadDataForCurrentYear();
            }
        }
    } catch (e) {
        console.warn("[IndexedDB] Image hydration notice:", e);
    }
}
window.hydrateImagesFromIndexedDB = hydrateImagesFromIndexedDB;

// تشغيل فحص الصور عند بدء التطبيق
setTimeout(() => {
    hydrateImagesFromIndexedDB();
}, 200);
