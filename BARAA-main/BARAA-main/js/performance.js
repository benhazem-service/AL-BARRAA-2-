// ============================================================
// === 15. أداء الواجبات الشهرية والرسوم (Monthly Performance) ===
// ============================================================

const months = [
    "شتنبر", "أكتوبر", "نونبر", "دجنبر", "يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو", "يوليوز"
];

function renderPerformanceList() {
    const perfDeptSelect = document.getElementById('perfDeptSelect');
    const perfMonthSelect = document.getElementById('perfMonthSelect');
    const list = document.getElementById('perfStudentsList');
    if (!perfDeptSelect || !perfMonthSelect || !list) return;

    const deptId = perfDeptSelect.value;
    const month = perfMonthSelect.value;
    list.innerHTML = '';

    if (!deptId || !month) {
        list.innerHTML = '<p class="text-center text-gray-500">اختر القسم والشهر لإدخال النقط...</p>';
        return;
    }

    const deptStudents = students.filter(s => String(s.deptId) === String(deptId) && !s.isDroppedOut);
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
    renderPerformanceList();
};

// ربط بطاقة الأداء الشهري
const monthlyPerformanceCard = document.getElementById("monthlyPerformanceCard");
if (monthlyPerformanceCard) {
    monthlyPerformanceCard.onclick = function () {
        const deptSelect = document.getElementById('perfDeptSelect');
        const monthSelect = document.getElementById('perfMonthSelect');
        if (deptSelect) {
            deptSelect.innerHTML = '<option value="">-- اختر القسم --</option>';
            departments.forEach(d => deptSelect.appendChild(new Option(d.name, d.id)));
        }
        if (monthSelect) {
            monthSelect.innerHTML = months.map(m => `<option value="${m}">${m}</option>`).join('');
        }
        const perfModal = document.getElementById('performanceModal');
        if (perfModal) perfModal.classList.remove('hidden');

        if (deptSelect && monthSelect && deptSelect.value && monthSelect.value) {
            renderPerformanceList();
        }
    };
}

const perfDeptSelectEl = document.getElementById('perfDeptSelect');
if (perfDeptSelectEl) perfDeptSelectEl.onchange = renderPerformanceList;

const perfMonthSelectEl = document.getElementById('perfMonthSelect');
if (perfMonthSelectEl) perfMonthSelectEl.onchange = renderPerformanceList;
