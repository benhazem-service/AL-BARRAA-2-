// ============================================================
// === 13. ترتيب المراكز والأوائل (Student Rankings) ===
// ============================================================

function renderRankingDeptOptions() {
    const rankingSelect = document.getElementById('rankingDeptSelect');
    if (!rankingSelect) return;
    rankingSelect.innerHTML = '<option value="">-- اختر القسم/المستوى لعرض الترتيب --</option>';
    departments.forEach(d => {
        rankingSelect.appendChild(new Option(d.name, d.id));
    });
}

const rankingCard = document.getElementById("rankingCard");
if (rankingCard) {
    rankingCard.onclick = function () {
        renderRankingDeptOptions();
        const rankingModal = document.getElementById('rankingModal');
        if (rankingModal) rankingModal.classList.remove('hidden');
    };
}

const rankingDeptSelect = document.getElementById('rankingDeptSelect');
if (rankingDeptSelect) {
    rankingDeptSelect.onchange = function () {
        const deptId = this.value;
        const reportSessionSelect = document.getElementById('reportSessionSelect');
        const session = reportSessionSelect ? reportSessionSelect.value : "";
        const resultList = document.getElementById('rankingResultList');
        if (!resultList) return;

        if (!deptId) {
            resultList.innerHTML = '<p class="text-center text-gray-500">اختر قسماً لعرض ترتيب التلاميذ...</p>';
            return;
        }

        const deptStudents = students.filter(s => String(s.deptId) === String(deptId) && !s.isDroppedOut);
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
}
