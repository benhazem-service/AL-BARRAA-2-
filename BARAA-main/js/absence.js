// ============================================================
// === 14. تسجيل وتتبع الغياب (Absence Tracking) ===
// ============================================================

function renderAbsenceList() {
    const absDeptSelect = document.getElementById('absDeptSelect');
    const absSessionSelect = document.getElementById('absSessionSelect');
    const list = document.getElementById('absStudentsList');
    if (!absDeptSelect || !absSessionSelect || !list) return;

    const deptId = absDeptSelect.value;
    const session = absSessionSelect.value;
    list.innerHTML = '';

    if (!deptId || !session) {
        list.innerHTML = '<p class="text-center text-gray-500">اختر القسم والدورة لبدء تسجيل الغياب...</p>';
        return;
    }

    const deptStudents = students.filter(s => String(s.deptId) === String(deptId) && !s.isDroppedOut);
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
    if (typeof feather !== 'undefined') feather.replace();
}

window.updateAbsenceCount = function (studentId, session, type, count) {
    if (!absences[studentId]) absences[studentId] = {};
    if (!absences[studentId][session]) absences[studentId][session] = [];

    const filteredAbs = absences[studentId][session].filter(a => a.type !== type);
    const newAbsencesForType = [];
    const countNum = parseInt(count || 0, 10);
    for (let i = 0; i < countNum; i++) {
        newAbsencesForType.push({ type: type, date: new Date().toISOString() });
    }

    absences[studentId][session] = [...filteredAbs, ...newAbsencesForType];
    saveAll();

    if (selectedHomeStudentId && String(selectedHomeStudentId) === String(studentId)) {
        if (typeof renderNewReportCard === 'function') renderNewReportCard(studentId);
    }
};

// ربط بطاقة الغياب والمحددات
const absenceCard = document.getElementById("absenceCard");
if (absenceCard) {
    absenceCard.onclick = function () {
        const deptSelect = document.getElementById('absDeptSelect');
        const sessionSelect = document.getElementById('absSessionSelect');
        if (deptSelect) {
            deptSelect.innerHTML = '<option value="">-- اختر القسم --</option>';
            departments.forEach(d => deptSelect.appendChild(new Option(d.name, d.id)));
        }
        if (sessionSelect) {
            sessionSelect.innerHTML = reportSessions.map(s => `<option value="${s}">${s}</option>`).join('');
        }
        const absenceModal = document.getElementById('absenceModal');
        if (absenceModal) absenceModal.classList.remove('hidden');

        if (deptSelect && sessionSelect && deptSelect.value && sessionSelect.value) {
            renderAbsenceList();
        }
    };
}

const absDeptSelectEl = document.getElementById('absDeptSelect');
if (absDeptSelectEl) absDeptSelectEl.onchange = renderAbsenceList;

const absSessionSelectEl = document.getElementById('absSessionSelect');
if (absSessionSelectEl) absSessionSelectEl.onchange = renderAbsenceList;
