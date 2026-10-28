// ============================================================
// === 10. إدارة الدورات الدراسية (Sessions / Semesters) ===
// ============================================================

function renderReportSessions() {
    const sessionList = document.getElementById('sessionList');
    if (!sessionList) return;

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
    if (typeof feather !== 'undefined') feather.replace();
}

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
            const reportSessionSelect = document.getElementById("reportSessionSelect");
            if (selectedHomeStudentId && reportSessionSelect && reportSessionSelect.value === oldName) {
                if (typeof renderNewReportCard === 'function') renderNewReportCard(selectedHomeStudentId);
            }
        }
    }
}

function deleteSession(sessionName) {
    const performSessionDelete = () => {
        reportSessions = reportSessions.filter(s => s !== sessionName);
        saveAll();
        renderReportSessions();
    };

    if (typeof openDeleteConfirmModal === 'function') {
        openDeleteConfirmModal(`هل أنت متأكد من حذف الدورة "${sessionName}"؟ سيتم حذف جميع تقييماتها المرتبطة.`, performSessionDelete);
    } else {
        if (confirm(`هل أنت متأكد من حذف الدورة "${sessionName}"؟ سيتم حذف جميع تقييماتها.`)) {
            performSessionDelete();
        }
    }
}

// ربط أحداث نموذج الدورات
const sessionForm = document.getElementById('sessionForm');
const sessionNameInput = document.getElementById('sessionName');
if (sessionForm && sessionNameInput) {
    sessionForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = sessionNameInput.value.trim();
        if (name && !reportSessions.includes(name)) {
            reportSessions.push(name);
            saveAll();
            if (typeof renderReportActivities === 'function') renderReportActivities();
            renderReportSessions();
            sessionNameInput.value = '';
        }
    });
}
