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
    // إذا كان هناك جلسة نشطة لمشترك فرعي (ليس أدمن)، لا نحقن النسخة الاحتياطية المدمجة
    try {
        const s = (typeof currentSession !== 'undefined' && currentSession) ? currentSession : JSON.parse(localStorage.getItem("sub_appSession") || "null");
        if (s && !s.isAdmin) return;
    } catch (e) { }

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

// استنساخ ونقل البنية التنظيمية للمؤسسة (الأقسام، الأنشطة، الدورات، المواد، والإعدادات) إلى السنة المحددة
function inheritStructuralSchoolData(targetYear) {
    if (!targetYear) return false;
    if (!academicData[targetYear]) {
        academicData[targetYear] = {};
    }
    const target = academicData[targetYear];

    // البحث عن أفضل سنة مصدرية تحتوي على أقسام وأنشطة
    let sourceData = null;

    // 1. الأفضلية للسنة الحالية إن كانت مختلفة وبها أقسام
    if (currentAcademicYear && currentAcademicYear !== targetYear && academicData[currentAcademicYear]) {
        const cur = academicData[currentAcademicYear];
        if (Array.isArray(cur.departments) && cur.departments.length > 0) {
            sourceData = cur;
        }
    }

    // 2. فحص بقية السنوات المسجلة تنازلياً
    if (!sourceData && Array.isArray(academicYears)) {
        for (let i = academicYears.length - 1; i >= 0; i--) {
            const y = academicYears[i];
            if (y === targetYear) continue;
            const cand = academicData[y];
            if (cand && Array.isArray(cand.departments) && cand.departments.length > 0) {
                sourceData = cand;
                break;
            }
        }
    }

    // 3. فحص أي سنة في academicData بها أقسام
    if (!sourceData) {
        for (const y in academicData) {
            if (y === targetYear) continue;
            const cand = academicData[y];
            if (cand && Array.isArray(cand.departments) && cand.departments.length > 0) {
                sourceData = cand;
                break;
            }
        }
    }

    // 4. إذا لم نجد بعد، نبحث عن سنة بها أنشطة أو دورات
    if (!sourceData) {
        for (const y in academicData) {
            if (y === targetYear) continue;
            const cand = academicData[y];
            if (cand && ((Array.isArray(cand.reportActivities) && cand.reportActivities.length > 0) || (Array.isArray(cand.reportSessions) && cand.reportSessions.length > 0))) {
                sourceData = cand;
                break;
            }
        }
    }

    // تأمين القيم الافتراضية إذا لم تتوفر أي سنة مصدرية
    if (!sourceData) {
        if (!Array.isArray(target.reportActivities) || target.reportActivities.length === 0) {
            target.reportActivities = ["القرآن الكريم", "القيم والعادات", "اللغة العربية", "الرياضيات", "الأنشطة العلمية"];
        }
        if (!Array.isArray(target.reportSessions) || target.reportSessions.length === 0) {
            target.reportSessions = ["الدورة الأولى", "الدورة الثانية"];
        }
        if (!Array.isArray(target.reportBehaviors) || target.reportBehaviors.length === 0) {
            target.reportBehaviors = ["المواظبة على الحضور", "السلوك داخل القسم"];
        }
        if (!Array.isArray(target.generalObservations) || target.generalObservations.length === 0) {
            target.generalObservations = ["يتحسن", "مجهود طيب", "عمل حسن", "يحتاج إلى تركيز", "يشارك", "لا يشارك"];
        }
        if (!Array.isArray(target.scoreObservations) || target.scoreObservations.length === 0) {
            target.scoreObservations = [
                { min: 8, max: 10, text: "ممتاز" },
                { min: 7, max: 7.99, text: "جيد جدا" },
                { min: 6, max: 6.99, text: "حسن" },
                { min: 5, max: 5.99, text: "مقبول" },
                { min: 0, max: 4.99, text: "يحتاج لمجهود" }
            ];
        }
        return false;
    }

    let changed = false;

    // --- 1. الأقسام (Departments) ---
    if (!Array.isArray(target.departments) || target.departments.length === 0) {
        if (Array.isArray(sourceData.departments) && sourceData.departments.length > 0) {
            target.departments = JSON.parse(JSON.stringify(sourceData.departments));
            changed = true;
        }
    }

    // --- 2. الأنشطة والمواد والسلوك (Activities & Behaviors & Subjects) ---
    if (!Array.isArray(target.reportActivities) || target.reportActivities.length === 0) {
        if (Array.isArray(sourceData.reportActivities) && sourceData.reportActivities.length > 0) {
            target.reportActivities = JSON.parse(JSON.stringify(sourceData.reportActivities));
            changed = true;
        }
    }
    if (!Array.isArray(target.reportBehaviors) || target.reportBehaviors.length === 0) {
        if (Array.isArray(sourceData.reportBehaviors) && sourceData.reportBehaviors.length > 0) {
            target.reportBehaviors = JSON.parse(JSON.stringify(sourceData.reportBehaviors));
            changed = true;
        }
    }
    if (!Array.isArray(target.subjects) || target.subjects.length === 0) {
        if (Array.isArray(sourceData.subjects) && sourceData.subjects.length > 0) {
            target.subjects = JSON.parse(JSON.stringify(sourceData.subjects));
            changed = true;
        }
    }

    // --- 3. الدورات الدراسية (Report Sessions) ---
    if (!Array.isArray(target.reportSessions) || target.reportSessions.length === 0) {
        if (Array.isArray(sourceData.reportSessions) && sourceData.reportSessions.length > 0) {
            target.reportSessions = JSON.parse(JSON.stringify(sourceData.reportSessions));
            changed = true;
        }
    }

    // --- 4. الملاحظات والتقديرات والإعدادات العامة ---
    if (!Array.isArray(target.generalObservations) || target.generalObservations.length === 0) {
        if (Array.isArray(sourceData.generalObservations) && sourceData.generalObservations.length > 0) {
            target.generalObservations = JSON.parse(JSON.stringify(sourceData.generalObservations));
            changed = true;
        }
    }
    if (!Array.isArray(target.scoreObservations) || target.scoreObservations.length === 0) {
        if (Array.isArray(sourceData.scoreObservations) && sourceData.scoreObservations.length > 0) {
            target.scoreObservations = JSON.parse(JSON.stringify(sourceData.scoreObservations));
            changed = true;
        }
    }
    if (!Array.isArray(target.customFinalAverageLabels) || target.customFinalAverageLabels.length === 0) {
        if (Array.isArray(sourceData.customFinalAverageLabels) && sourceData.customFinalAverageLabels.length > 0) {
            target.customFinalAverageLabels = JSON.parse(JSON.stringify(sourceData.customFinalAverageLabels));
            changed = true;
        }
    }
    if (!target.globalFinalAverageLabel && sourceData.globalFinalAverageLabel) {
        target.globalFinalAverageLabel = sourceData.globalFinalAverageLabel;
        changed = true;
    }
    if (!target.performanceConfig && sourceData.performanceConfig) {
        target.performanceConfig = JSON.parse(JSON.stringify(sourceData.performanceConfig));
        changed = true;
    }

    // تهيئة مصفوفات التلاميذ والدرجات فارغة لتلك السنة الجديدة
    if (!Array.isArray(target.students)) target.students = [];
    if (!target.grades) target.grades = {};
    if (!target.monthlyGrades) target.monthlyGrades = {};
    if (!target.studentReports) target.studentReports = {};
    if (!target.absences) target.absences = {};

    return changed;
}
window.inheritStructuralSchoolData = inheritStructuralSchoolData;

if (currentAcademicYear) {
    inheritStructuralSchoolData(currentAcademicYear);
}

if (currentAcademicYear && academicData[currentAcademicYear]) {
    const data = academicData[currentAcademicYear];
    departments = data.departments || [];
    students = data.students || [];
    subjects = data.subjects || [];
    grades = data.grades || {};
    institutionName = appStorage.getItem("institutionName") || "";
    monthlyGrades = data.monthlyGrades || {};
    if (!monthlyGrades || Object.keys(monthlyGrades).length === 0) {
        try {
            const mgKey = appStorage.getItem("monthlyGrades_" + currentAcademicYear) || appStorage.getItem("monthlyGrades");
            if (mgKey) {
                const parsedMg = JSON.parse(mgKey);
                if (parsedMg && typeof parsedMg === 'object' && Object.keys(parsedMg).length > 0) {
                    monthlyGrades = parsedMg;
                    data.monthlyGrades = parsedMg;
                }
            }
        } catch (e) { }
    }
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
// حفظ كل البيانات في التخزين المحلي واستدعاء الحفظ التلقائي للسحابة
const saveAll = () => {
    if (currentAcademicYear) {
        const existingYearData = academicData[currentAcademicYear] || {};

        academicData[currentAcademicYear] = {
            ...existingYearData,
            departments: Array.isArray(departments) ? [...departments] : (existingYearData.departments || []),
            students: Array.isArray(students) ? [...students] : (existingYearData.students || []),
            subjects: (subjects && subjects.length) ? [...subjects] : (existingYearData.subjects || []),
            grades: grades || existingYearData.grades || {},
            monthlyGrades: monthlyGrades || existingYearData.monthlyGrades || {},
            studentReports: studentReports || existingYearData.studentReports || {},
            reportActivities: (reportActivities && reportActivities.length) ? [...reportActivities] : (existingYearData.reportActivities || ["القرآن الكريم", "القيم والعادات", "اللغة العربية", "الرياضيات", "الأنشطة العلمية"]),
            reportBehaviors: (reportBehaviors && reportBehaviors.length) ? [...reportBehaviors] : (existingYearData.reportBehaviors || ["المواظبة على الحضور", "السلوك داخل القسم"]),
            generalObservations: (generalObservations && generalObservations.length) ? [...generalObservations] : (existingYearData.generalObservations || ["يتحسن", "مجهود طيب", "عمل حسن", "يحتاج إلى تركيز", "يشارك", "لا يشارك"]),
            reportSessions: (reportSessions && reportSessions.length) ? [...reportSessions] : (existingYearData.reportSessions || ["الدورة الأولى", "الدورة الثانية"]),
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
            ],
            performanceConfig: (typeof getPerformanceConfig === 'function') ? getPerformanceConfig() : (existingYearData.performanceConfig || null)
        };
    }
    try {
        appStorage.setItem("academicData", JSON.stringify(academicData));
        if (currentAcademicYear && monthlyGrades) {
            appStorage.setItem("monthlyGrades_" + currentAcademicYear, JSON.stringify(monthlyGrades));
        }
        if (monthlyGrades) {
            appStorage.setItem("monthlyGrades", JSON.stringify(monthlyGrades));
        }
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
    if (!currentAcademicYear) return;

    // ضمان توفر وانتقال الأقسام والأنشطة والدورات عند المرور على أي سنة دراسية
    inheritStructuralSchoolData(currentAcademicYear);

    const data = academicData[currentAcademicYear] || {};
    let yearDepts = Array.isArray(data.departments) ? [...data.departments] : [];
    let yearStudents = Array.isArray(data.students) ? [...data.students] : [];

    const s = (typeof currentSession !== 'undefined' && currentSession) ? currentSession : null;
    if (s && !s.isAdmin) {
        // للمشترك الفرعي: فلترة الأقسام والتلاميذ حسب المستويات المخصصة له مع حماية البيانات المسترجعة الشاملة
        const levels = Array.isArray(s.levels) ? s.levels : [];
        if (levels.length > 0) {
            const allowedSet = new Set(levels.map(String));
            // التعرف على أسماء ومعرفات الأقسام المطابقة عبر كل السنوات
            Object.values(academicData).forEach(yData => {
                (yData.departments || []).forEach(d => {
                    if (allowedSet.has(String(d.id))) {
                        allowedSet.add(d.name);
                    }
                    if (allowedSet.has(d.name)) {
                        allowedSet.add(String(d.id));
                    }
                });
            });

            const hasRestoredData = yearDepts.length > 1 && yearStudents.length > 15;
            const filteredDepts = yearDepts.filter(d => allowedSet.has(String(d.id)) || allowedSet.has(d.name));
            
            if (filteredDepts.length > 0 && (!hasRestoredData || filteredDepts.length === yearDepts.length)) {
                yearDepts = filteredDepts;
                const allowedDeptIds = new Set(yearDepts.map(d => String(d.id)));
                yearStudents = yearStudents.filter(st => allowedDeptIds.has(String(st.deptId)));
            } else if (hasRestoredData && filteredDepts.length < yearDepts.length) {
                // إذا تم استيراد بيانات مدرسة شاملة، نوسع صلاحيات المشترك لتشمل كافة الأقسام لمنع اختفاء الأقسام والتلاميذ
                yearDepts.forEach(d => {
                    if (d && d.id) {
                        if (!s.levels.includes(String(d.id))) s.levels.push(String(d.id));
                        if (d.name && !s.levels.includes(d.name)) s.levels.push(d.name);
                    }
                });
                try {
                    if (s.phone) localStorage.setItem("sub_" + s.phone + "_levels", JSON.stringify(s.levels));
                    localStorage.setItem("sub_appSession", JSON.stringify(s));
                } catch(e){}
            }
        }
    }

    departments = yearDepts;
    students = yearStudents;
    subjects = Array.isArray(data.subjects) ? [...data.subjects] : [];
    grades = data.grades || {};
    institutionName = appStorage.getItem("institutionName") || data.institutionName || "";
    monthlyGrades = data.monthlyGrades || {};
    if (!monthlyGrades || Object.keys(monthlyGrades).length === 0) {
        try {
            const mgKey = appStorage.getItem("monthlyGrades_" + currentAcademicYear) || appStorage.getItem("monthlyGrades");
            if (mgKey) {
                const parsedMg = JSON.parse(mgKey);
                if (parsedMg && typeof parsedMg === 'object' && Object.keys(parsedMg).length > 0) {
                    monthlyGrades = parsedMg;
                    data.monthlyGrades = parsedMg;
                }
            }
        } catch (e) { }
    }
    studentReports = data.studentReports || {};
    generalObservations = Array.isArray(data.generalObservations) ? [...data.generalObservations] : ["يتحسن", "مجهود طيب", "عمل حسن", "يحتاج إلى تركيز", "يشارك", "لا يشارك"];
    reportActivities = Array.isArray(data.reportActivities) ? [...data.reportActivities] : ["القرآن الكريم", "القيم والعادات", "اللغة العربية", "الرياضيات", "الأنشطة العلمية"];
    reportBehaviors = Array.isArray(data.reportBehaviors) ? [...data.reportBehaviors] : ["المواظبة على الحضور", "السلوك داخل القسم"];
    reportSessions = Array.isArray(data.reportSessions) ? [...data.reportSessions] : ["الدورة الأولى", "الدورة الثانية"];
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
    if (typeof loadPerformanceConfigFromData === 'function') {
        loadPerformanceConfigFromData(data.performanceConfig);
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
    if (typeof renderHomeStudents === 'function') renderHomeStudents();
    if (typeof renderAllStudentsList === 'function') renderAllStudentsList();
    if (typeof updateMyDeptsUI === 'function') updateMyDeptsUI();
    if (typeof renderPerformanceSettings === 'function') renderPerformanceSettings();

    const absenceModal = document.getElementById("absenceModal");
    if (absenceModal && !absenceModal.classList.contains("hidden") && typeof renderAbsenceList === 'function') {
        renderAbsenceList();
    }
    const perfPage = document.getElementById("performancePage");
    if (perfPage && !perfPage.classList.contains("hidden") && typeof renderPerformanceList === 'function') {
        renderPerformanceList();
    }
    const rankModal = document.getElementById("rankingModal");
    if (rankModal && !rankModal.classList.contains("hidden") && typeof renderRankingList === 'function') {
        renderRankingList();
    }
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
                if (typeof refreshUI === 'function') refreshUI();
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
