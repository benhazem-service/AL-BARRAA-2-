// ============================================================
// === 5. إدارة السنوات الدراسية (Academic Years) ===
// ============================================================

function renderAcademicYears() {
    const academicYearSelect = document.getElementById("academicYearSelect");
    const yearSelectForStudents = document.getElementById("yearSelectForStudents");
    const prevYearBtn = document.getElementById("prevYearBtn");
    const nextYearBtn = document.getElementById("nextYearBtn");
    const sidebarAcademicYear = document.getElementById("sidebarAcademicYear");
    const currentYearDisplayLabel = document.getElementById("currentYearDisplayLabel");
    const settingsActiveYearBadge = document.getElementById("settingsActiveYearBadge");
    const settingsCurrentYearSelect = document.getElementById("settingsCurrentYearSelect");

    if (academicYearSelect) academicYearSelect.innerHTML = "";
    if (yearSelectForStudents) yearSelectForStudents.innerHTML = "";
    if (settingsCurrentYearSelect) settingsCurrentYearSelect.innerHTML = "";

    academicYears.forEach(year => {
        if (academicYearSelect) academicYearSelect.appendChild(new Option(year, year));
        if (yearSelectForStudents) yearSelectForStudents.appendChild(new Option(year, year));
        if (settingsCurrentYearSelect) settingsCurrentYearSelect.appendChild(new Option(year, year));
    });

    if (academicYearSelect) academicYearSelect.value = currentAcademicYear;
    if (yearSelectForStudents) yearSelectForStudents.value = currentAcademicYear;
    if (settingsCurrentYearSelect) settingsCurrentYearSelect.value = currentAcademicYear;
    if (sidebarAcademicYear) sidebarAcademicYear.textContent = currentAcademicYear || '-';
    if (currentYearDisplayLabel) currentYearDisplayLabel.textContent = currentAcademicYear || '2026/2027';
    if (settingsActiveYearBadge) settingsActiveYearBadge.textContent = currentAcademicYear || '2026/2027';

    const currentIndex = academicYears.indexOf(currentAcademicYear);
    if (prevYearBtn) prevYearBtn.disabled = currentIndex <= 0;
    if (nextYearBtn) nextYearBtn.disabled = currentIndex >= academicYears.length - 1;

    renderYearList();
}

function renderYearList() {
    const yearList = document.getElementById("yearList");
    const yearForm = document.getElementById("yearForm");
    const sidebarAcademicYear = document.getElementById("sidebarAcademicYear");
    const currentYearDisplayLabel = document.getElementById("currentYearDisplayLabel");
    const settingsActiveYearBadge = document.getElementById("settingsActiveYearBadge");
    const settingsCurrentYearSelect = document.getElementById("settingsCurrentYearSelect");

    if (sidebarAcademicYear) sidebarAcademicYear.textContent = currentAcademicYear || '-';
    if (currentYearDisplayLabel) currentYearDisplayLabel.textContent = currentAcademicYear || '2026/2027';
    if (settingsActiveYearBadge) settingsActiveYearBadge.textContent = currentAcademicYear || '2026/2027';
    if (settingsCurrentYearSelect) settingsCurrentYearSelect.value = currentAcademicYear;

    const isAdmin = typeof currentSession !== 'undefined' && currentSession && currentSession.isAdmin;
    if (yearForm) {
        yearForm.style.display = isAdmin ? "flex" : "none";
    }

    if (!yearList) return;
    yearList.innerHTML = "";
    if (academicYears.length === 0) {
        yearList.innerHTML = `<p class="text-gray-500 text-center">لا توجد سنوات دراسية</p>`;
        return;
    }

    academicYears.forEach(year => {
        const li = document.createElement("li");
        li.className = "flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100 shadow-2xs";
        const isCurrent = year === currentAcademicYear;
        li.innerHTML = `
            <span class="font-bold ${isCurrent ? 'text-purple-700' : 'text-gray-700'} flex items-center gap-2">
                <span>📅 ${year}</span>
                ${isCurrent ? '<span class="bg-purple-100 text-purple-700 text-xs px-2.5 py-0.5 rounded-full font-bold">✅ الحالية (مثبتة)</span>' : ''}
            </span>
            <div class="flex gap-2">
                ${!isCurrent ? `<button class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-btn shadow-2xs flex items-center gap-1" onclick="setCurrentYear('${year}')">🎯 تعيين كسنة حالية</button>` : ''}
                ${isAdmin ? `<button class="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-btn" onclick="deleteYear('${year}')">حذف</button>` : ''}
            </div>
        `;
        yearList.appendChild(li);
    });
}

// دالة تحديد وتثبيت السنة الدراسية الحالية للمدير ولكل مستخدم
function setCurrentYear(year) {
    if (!academicYears.includes(year)) return;
    if (currentAcademicYear === year) return;

    // 1. حفظ بيانات السنة الحالية قبل الانتقال إلى السنة الجديدة
    if (currentAcademicYear) {
        saveAll();
    }

    currentAcademicYear = year;

    // 2. الحفظ في appStorage للبادئة النشطة
    appStorage.setItem("currentAcademicYear", currentAcademicYear);

    // 3. الحفظ في المفاتيح الدائمة للمستخدم لمنع ضياع التثبيت عند الخروج
    const userPhone = (typeof currentSession !== 'undefined' && currentSession && currentSession.phone)
        ? currentSession.phone
        : null;
    const isAdmin = typeof currentSession !== 'undefined' && currentSession && currentSession.isAdmin;

    try {
        if (userPhone) {
            localStorage.setItem("user_year_" + userPhone, year);
        }
        if (isAdmin) {
            localStorage.setItem("admin_currentAcademicYear", year);
        }
        localStorage.setItem("last_selected_academic_year", year);
    } catch (e) {
        console.warn("Storage save year error:", e);
    }

    // 4. تحديث عناصر واجهة المستخدم
    const academicYearSelect = document.getElementById("academicYearSelect");
    const yearSelectForStudents = document.getElementById("yearSelectForStudents");
    const prevYearBtn = document.getElementById("prevYearBtn");
    const nextYearBtn = document.getElementById("nextYearBtn");
    const sidebarAcademicYear = document.getElementById("sidebarAcademicYear");
    const currentYearDisplayLabel = document.getElementById("currentYearDisplayLabel");
    const settingsActiveYearBadge = document.getElementById("settingsActiveYearBadge");
    const settingsCurrentYearSelect = document.getElementById("settingsCurrentYearSelect");

    if (academicYearSelect) academicYearSelect.value = currentAcademicYear;
    if (yearSelectForStudents) yearSelectForStudents.value = currentAcademicYear;
    if (sidebarAcademicYear) sidebarAcademicYear.textContent = currentAcademicYear;
    if (currentYearDisplayLabel) currentYearDisplayLabel.textContent = currentAcademicYear;
    if (settingsActiveYearBadge) settingsActiveYearBadge.textContent = currentAcademicYear;
    if (settingsCurrentYearSelect) settingsCurrentYearSelect.value = currentAcademicYear;

    const currentIndex = academicYears.indexOf(currentAcademicYear);
    if (prevYearBtn) prevYearBtn.disabled = currentIndex <= 0;
    if (nextYearBtn) nextYearBtn.disabled = currentIndex >= academicYears.length - 1;

    // 5. تحميل بيانات السنة وتحديث كل الجداول والقوائم
    loadDataForCurrentYear();
    saveAll();
    refreshUI();
    renderYearList();

    // 6. مزامنة فورية للسنة المختارة في وثيقة المستخدم بالسحابة
    const targetDocId = userPhone || (typeof cloudUserId !== 'undefined' ? cloudUserId : 'default');
    if (typeof fs !== 'undefined' && targetDocId) {
        fs.collection('users').doc(targetDocId).set({
            currentAcademicYear: year,
            lastUpdated: new Date().toISOString()
        }, { merge: true }).catch(err => console.log('Firestore user year sync error:', err));
    }
    if (isAdmin && typeof fs !== 'undefined') {
        fs.collection('settings').doc('global').set({
            currentAcademicYear: year,
            lastUpdated: new Date().toISOString()
        }, { merge: true }).catch(err => console.log('Firestore global year sync error:', err));
    }
}
window.setCurrentYear = setCurrentYear;

function deleteYear(year) {
    if (academicYears.length <= 1) {
        alert("لا يمكن حذف آخر سنة دراسية.");
        return;
    }

    const performYearDelete = () => {
        academicYears = academicYears.filter(y => y !== year);
        delete academicData[year];
        if (currentAcademicYear === year) {
            currentAcademicYear = (academicYears.includes("2025/2026")) ? "2025/2026" : academicYears[0];
        }
        loadDataForCurrentYear();
        saveAll();
        refreshUI();
        renderAcademicYears();
    };

    if (typeof openDeleteConfirmModal === 'function') {
        openDeleteConfirmModal(`هل أنت متأكد من حذف السنة الدراسية "${year}"؟ سيتم حذف جميع بياناتها (الأقسام، التلاميذ، النقط...).`, performYearDelete);
    } else {
        const modal = document.getElementById("modalConfirm");
        const modalText = document.getElementById("modalText");
        if (modalText) {
            modalText.textContent = `هل تريد حذف السنة الدراسية "${year}"؟ سيتم حذف جميع بياناتها (الأقسام، التلاميذ، الدرجات...).`;
        }
        currentDeleteCallback = performYearDelete;
        if (modal) modal.classList.remove("hidden");
    }
}

// ربط أحداث نموذج السنوات والأزرار
const yearForm = document.getElementById("yearForm");
const yearNameInput = document.getElementById("yearName");
if (yearForm && yearNameInput) {
    yearForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const yearName = yearNameInput.value.trim();
        if (yearName && /^\d{4}\/\d{4}$/.test(yearName) && !academicYears.includes(yearName)) {
            academicYears.push(yearName);
            academicData[yearName] = { departments: [], students: [], subjects: [], grades: {}, monthlyGrades: {} };
            if (typeof inheritStructuralSchoolData === 'function') {
                inheritStructuralSchoolData(yearName);
            }
            saveAll();
            renderAcademicYears();
            yearNameInput.value = "";
            alert(`✅ تمت إضافة السنة الدراسية "${yearName}" بنجاح!\nتم الاحتفاظ ونقل جميع الأقسام والأنشطة والدورات تلقائياً.`);
        } else {
            alert("الرجاء إدخال سنة دراسية بالصيغة الصحيحة (مثال: 2025/2026) وغير مكررة.");
        }
    });
}

const academicYearSelectEl = document.getElementById("academicYearSelect");
if (academicYearSelectEl) {
    academicYearSelectEl.addEventListener("change", function () {
        setCurrentYear(this.value);
    });
}

const yearSelectForStudentsEl = document.getElementById('yearSelectForStudents');
if (yearSelectForStudentsEl) {
    yearSelectForStudentsEl.addEventListener('change', function () {
        setCurrentYear(this.value);
    });
}

const prevYearBtnEl = document.getElementById("prevYearBtn");
if (prevYearBtnEl) {
    prevYearBtnEl.addEventListener("click", function () {
        const currentIndex = academicYears.indexOf(currentAcademicYear);
        if (currentIndex > 0) {
            setCurrentYear(academicYears[currentIndex - 1]);
        }
    });
}

const nextYearBtnEl = document.getElementById("nextYearBtn");
if (nextYearBtnEl) {
    nextYearBtnEl.addEventListener("click", function () {
        const currentIndex = academicYears.indexOf(currentAcademicYear);
        if (currentIndex < academicYears.length - 1) {
            setCurrentYear(academicYears[currentIndex + 1]);
        }
    });
}
