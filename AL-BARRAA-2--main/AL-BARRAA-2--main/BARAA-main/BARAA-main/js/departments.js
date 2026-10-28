// ============================================================
// === 6. إدارة الأقسام والمستويات (Departments & Levels) ===
// ============================================================

function renderDepartments() {
    const deptList = document.getElementById("deptList");
    const deptSelectForStudents = document.getElementById("deptSelectForStudents");
    const homeDeptSelect = document.getElementById("homeDeptSelect");
    const deptSearch = document.getElementById("deptSearch");

    if (!deptList || !deptSelectForStudents || !homeDeptSelect) return;

    deptList.innerHTML = "";
    deptSelectForStudents.innerHTML = "";
    const prevHomeDept = homeDeptSelect.value;
    homeDeptSelect.innerHTML = `<option value="">-- اختر القسم --</option>`;

    // خيار عرض جميع الأقسام
    deptSelectForStudents.appendChild(new Option("🌟 جميع الأقسام", "all"));

    const searchTerm = deptSearch ? deptSearch.value : "";
    let filtered = departments.filter(d => (d.name || '').includes(searchTerm || ""));
    if (filtered.length === 0) deptList.innerHTML = `<p class="text-gray-500 text-center">لا توجد أقسام</p>`;

    filtered.forEach(d => {
        const li = document.createElement("li");
        li.className = "flex justify-between items-center bg-gray-50 p-3 rounded-lg";
        li.innerHTML = `
            <span class="font-medium">${d.name}</span>
            <div class="flex gap-2">
                <button class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-btn" onclick="editDept('${d.id}')">تعديل</button>
                <button class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-btn" onclick="deleteDept('${d.id}')">حذف</button>
            </div>
        `;
        deptList.appendChild(li);
        deptSelectForStudents.appendChild(new Option(d.name, d.id));
        homeDeptSelect.appendChild(new Option(d.name, d.id));
    });

    if (prevHomeDept && Array.from(homeDeptSelect.options).some(o => o.value === prevHomeDept)) {
        homeDeptSelect.value = prevHomeDept;
    } else {
        homeDeptSelect.value = "";
    }

    // خيار عرض التلاميذ غير المحددة أقسامهم إن وجدوا
    const unassignedCount = (Array.isArray(students))
        ? students.filter(s => !s.deptId || !departments.some(d => String(d.id) === String(s.deptId))).length
        : 0;
    if (unassignedCount > 0) {
        deptSelectForStudents.appendChild(new Option(`⚠️ تلاميذ بدون قسم (${unassignedCount})`, "unassigned"));
    }

    const reportActivityDept = document.getElementById("reportActivityDept");
    if (reportActivityDept) {
        reportActivityDept.innerHTML = `<option value="all">كل المستويات</option>`;
        departments.forEach(d => {
            reportActivityDept.appendChild(new Option(d.name, d.id));
        });
    }

    // استرجاع القسم المختار من التخزين
    const savedDeptStudents = appStorage.getItem("selectedDeptForStudents");
    if (savedDeptStudents && Array.from(deptSelectForStudents.options).some(opt => opt.value === savedDeptStudents)) {
        deptSelectForStudents.value = savedDeptStudents;
    } else {
        deptSelectForStudents.value = "all";
    }

    if (typeof renderHomeStudents === 'function') renderHomeStudents();
}

function editDept(id) {
    const d = departments.find(x => String(x.id) == String(id));
    if (!d) return;
    const newName = prompt("أدخل الاسم الجديد:", d.name || '');
    if (newName) {
        d.name = newName.trim();
        saveAll();
        renderDepartments();
        if (typeof renderStudents === 'function') renderStudents();
    }
}

function deleteDept(id) {
    const d = departments.find(x => String(x.id) == String(id));
    if (!d) return;

    const performDeptDelete = () => {
        departments = departments.filter(x => String(x.id) != String(id));
        students = students.filter(s => String(s.deptId) != String(id));
        subjects = subjects.filter(s => String(s.deptId) != String(id));
        Object.keys(grades).forEach(stId => {
            const st = students.find(ss => String(ss.id) == String(stId));
            if (!st) delete grades[stId];
        });
        if (typeof currentSession !== 'undefined' && currentSession && !currentSession.isAdmin) {
            if (Array.isArray(currentSession.levels)) {
                currentSession.levels = currentSession.levels.filter(x => x !== String(id) && x !== d.name);
                if (typeof applySubscriberLevels === 'function') {
                    applySubscriberLevels(currentSession.levels);
                }
            }
        }
        saveAll();
        renderDepartments();
        if (typeof renderStudents === 'function') renderStudents();
        if (typeof renderHomeStudents === 'function') renderHomeStudents();
        if (typeof renderStats === 'function') renderStats();
    };

    if (typeof openDeleteConfirmModal === 'function') {
        openDeleteConfirmModal(`هل أنت متأكد من حذف القسم "${d.name}"؟ سيتم حذف جميع تلاميذه ومواده وتقييماته المرتبطة.`, performDeptDelete);
    } else {
        const modal = document.getElementById("modalConfirm");
        const modalText = document.getElementById("modalText");
        if (modalText) {
            modalText.textContent = `هل تريد حذف القسم "${d.name}"؟ سيتم حذف تلاميذه ومواده.`;
        }
        currentDeleteCallback = performDeptDelete;
        if (modal) modal.classList.remove("hidden");
    }
}

// ربط أحداث نموذج الأقسام والبحث
const deptForm = document.getElementById("deptForm");
if (deptForm) {
    deptForm.addEventListener("submit", e => {
        e.preventDefault();
        const name = document.getElementById("deptName").value.trim();
        if (!name) return;
        const newDept = { id: String(Date.now()), name };
        departments.push(newDept);
        if (typeof currentSession !== 'undefined' && currentSession && !currentSession.isAdmin) {
            if (!Array.isArray(currentSession.levels)) currentSession.levels = [];
            currentSession.levels.push(newDept.id, newDept.name);
            if (typeof applySubscriberLevels === 'function') {
                applySubscriberLevels(currentSession.levels);
            }
        }
        saveAll();
        e.target.reset();
        renderDepartments();
        if (typeof renderStudents === 'function') renderStudents();
    });
}

const deptSearchEl = document.getElementById("deptSearch");
if (deptSearchEl) {
    deptSearchEl.addEventListener("input", renderDepartments);
}
