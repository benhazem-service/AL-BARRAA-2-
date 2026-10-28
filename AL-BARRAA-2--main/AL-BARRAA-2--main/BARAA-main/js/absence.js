// ============================================================
// === 14. تسجيل وتتبع الغياب المطور (Advanced Absence Engine) ===
// ============================================================

let currentAbsFilter = 'all'; // 'all' | 'absent' | 'present'

// تهيئة صفحة تسجيل الغياب عند الانتقال إليها
window.initAbsencePage = function () {
    const deptSelect = document.getElementById('absDeptSelect');
    const sessionSelect = document.getElementById('absSessionSelect');

    if (deptSelect) {
        const prevVal = deptSelect.value;
        deptSelect.innerHTML = '<option value="">-- اختر المستوى / القسم --</option>';
        if (Array.isArray(departments) && departments.length > 0) {
            departments.forEach(d => {
                deptSelect.appendChild(new Option(d.name, d.id));
            });
            if (prevVal && Array.from(deptSelect.options).some(o => o.value === prevVal)) {
                deptSelect.value = prevVal;
            } else if (departments.length > 0) {
                deptSelect.value = departments[0].id;
            }
        }
    }

    if (sessionSelect) {
        const prevSession = sessionSelect.value;
        const sessions = (typeof reportSessions !== 'undefined' && Array.isArray(reportSessions) && reportSessions.length > 0)
            ? reportSessions
            : ["الدورة الأولى", "الدورة الثانية"];
        sessionSelect.innerHTML = sessions.map(s => `<option value="${s}">${s}</option>`).join('');
        if (prevSession && sessions.includes(prevSession)) {
            sessionSelect.value = prevSession;
        } else if (sessions.length > 0) {
            sessionSelect.value = sessions[0];
        }
    }

    renderAbsDeptChips();
    setAbsenceFilter(currentAbsFilter || 'all');
    renderAbsenceList();
};

// إنشاء شرائح (Chips) للأقسام للتنقل السريع بنقرة واحدة
window.renderAbsDeptChips = function () {
    const chipsContainer = document.getElementById('absDeptChips');
    const deptSelect = document.getElementById('absDeptSelect');
    if (!chipsContainer || !deptSelect) return;

    chipsContainer.innerHTML = '';
    const currentDeptId = deptSelect.value;

    if (!Array.isArray(departments) || departments.length === 0) {
        chipsContainer.innerHTML = '<span class="text-xs text-slate-400">لا توجد أقسام مسجلة</span>';
        return;
    }

    departments.forEach(d => {
        const isSelected = String(d.id) === String(currentDeptId);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-2xs cursor-pointer ${
            isSelected
                ? 'bg-rose-600 text-white border-rose-600 shadow-rose-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
        }`;
        btn.innerHTML = `<span>🏫</span><span>${d.name}</span>`;
        btn.onclick = () => {
            deptSelect.value = d.id;
            onAbsenceDeptOrSessionChange();
        };
        chipsContainer.appendChild(btn);
    });
};

// عند تغيير القسم أو الدورة
window.onAbsenceDeptOrSessionChange = function () {
    renderAbsDeptChips();
    renderAbsenceList();
};

// تحديد فلتر الحالة (الكل / لديهم غياب / مواظبون)
window.setAbsenceFilter = function (filter) {
    currentAbsFilter = filter;
    ['all', 'absent', 'present'].forEach(f => {
        const btn = document.getElementById(`absFilterBtn_${f}`);
        if (!btn) return;
        if (f === filter) {
            btn.className = 'abs-filter-btn active px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs';
        } else {
            btn.className = 'abs-filter-btn px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-1.5';
        }
    });
    renderAbsenceList();
};

// دالة العرض الرئيسية لجدول الغياب وحساب المؤشرات
function renderAbsenceList() {
    const deptSelect = document.getElementById('absDeptSelect');
    const sessionSelect = document.getElementById('absSessionSelect');
    const list = document.getElementById('absStudentsList');
    const searchInput = document.getElementById('absSearchInput');
    if (!deptSelect || !sessionSelect || !list) return;

    const deptId = deptSelect.value;
    const session = sessionSelect.value;
    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : '';

    if (!deptId || !session) {
        list.innerHTML = `
            <div class="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-8 text-center space-y-2">
                <span class="text-4xl block">🏫</span>
                <h4 class="font-bold text-slate-800 text-base">يرجى اختيار القسم والدورة الدراسية</h4>
                <p class="text-xs text-slate-500">اختر القسم من القائمة أعلاه لبدء تسجيل ومتابعة غياب التلاميذ بكل سلاسة</p>
            </div>
        `;
        updateAbsenceKpis(0, 0, 0, 100);
        updateAbsFilterCounts(0, 0, 0);
        return;
    }

    const deptStudents = (Array.isArray(students))
        ? students.filter(s => String(s.deptId) === String(deptId) && !s.isDroppedOut)
        : [];

    if (deptStudents.length === 0) {
        list.innerHTML = `
            <div class="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center space-y-2">
                <span class="text-4xl block">👨‍🎓</span>
                <h4 class="font-bold text-slate-700 text-base">لا يوجد تلاميذ في هذا القسم</h4>
                <p class="text-xs text-slate-400">يمكنك إضافة تلاميذ لهذا القسم من صفحة الإعدادات أو الرئيسية</p>
            </div>
        `;
        updateAbsenceKpis(0, 0, 0, 100);
        updateAbsFilterCounts(0, 0, 0);
        return;
    }

    // حساب الإحصائيات الشاملة للقسم
    let totalJustified = 0;
    let totalUnjustified = 0;
    let absentCount = 0;
    let presentCount = 0;

    const studentAbsenceMap = new Map();
    deptStudents.forEach(s => {
        const sAbs = (absences[s.id] && absences[s.id][session]) ? absences[s.id][session] : [];
        const just = sAbs.filter(a => a.type === 'justified').length;
        const unjust = sAbs.filter(a => a.type === 'unjustified').length;
        const total = just + unjust;

        totalJustified += just;
        totalUnjustified += unjust;
        if (total > 0) absentCount++;
        else presentCount++;

        studentAbsenceMap.set(String(s.id), { just, unjust, total });
    });

    const totalStudents = deptStudents.length;
    const attendanceRate = totalStudents > 0
        ? Math.max(0, Math.round(((totalStudents - absentCount) / totalStudents) * 100))
        : 100;

    updateAbsenceKpis(totalStudents, totalJustified, totalUnjustified, attendanceRate);
    updateAbsFilterCounts(totalStudents, absentCount, presentCount);

    // تصفية التلاميذ حسب البحث وفلتر الحالة
    const filteredStudents = deptStudents.filter(s => {
        const sName = (s.info && s.info['الاسم الكامل (بالعربية)'] || '').toLowerCase();
        if (searchTerm && !sName.includes(searchTerm)) return false;

        const info = studentAbsenceMap.get(String(s.id));
        if (currentAbsFilter === 'absent' && info.total === 0) return false;
        if (currentAbsFilter === 'present' && info.total > 0) return false;

        return true;
    });

    if (filteredStudents.length === 0) {
        list.innerHTML = `
            <div class="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-xs font-bold">
                🔍 لا توجد نتائج مطابقة للبحث أو الفلتر المحدد في هذا القسم.
            </div>
        `;
        return;
    }

    // بناء الجدول العصري المتجاوب
    let html = `
        <div class="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs bg-white">
            <table class="w-full text-right border-collapse">
                <thead>
                    <tr class="bg-gradient-to-r from-slate-50 via-rose-50/30 to-slate-50 border-b border-slate-200 text-slate-700 text-xs font-bold">
                        <th class="p-3.5 text-center w-12">#</th>
                        <th class="p-3.5 min-w-[200px]">التلميذ(ة)</th>
                        <th class="p-3.5 text-center min-w-[150px]">
                            <div class="inline-flex items-center gap-1 text-sky-700">
                                <span>📝</span>
                                <span>غياب مبرر</span>
                            </div>
                        </th>
                        <th class="p-3.5 text-center min-w-[150px]">
                            <div class="inline-flex items-center gap-1 text-rose-700">
                                <span>⚠️</span>
                                <span>غير مبرر</span>
                            </div>
                        </th>
                        <th class="p-3.5 text-center min-w-[110px]">المجموع</th>
                        <th class="p-3.5 text-center min-w-[130px]">إشعار ولي الأمر</th>
                        <th class="p-3.5 text-center w-16">تصفير</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 text-xs font-medium text-slate-700">
    `;

    filteredStudents.forEach((s, idx) => {
        const sInfo = studentAbsenceMap.get(String(s.id));
        const just = sInfo ? sInfo.just : 0;
        const unjust = sInfo ? sInfo.unjust : 0;
        const total = just + unjust;
        const sName = s.info && s.info['الاسم الكامل (بالعربية)'] ? s.info['الاسم الكامل (بالعربية)'] : 'تلميذ غير محدد';
        const photo = s.info && s.info['صورة'] ? s.info['صورة'] : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
        const parentPhone = (typeof getStudentParentPhone === 'function') ? getStudentParentPhone(s) : (s.info['هاتف ولي الأمر'] || '');

        let statusBadge = '';
        if (total === 0) {
            statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span>✅</span><span>حاضر (0)</span>
            </span>`;
        } else if (unjust === 0) {
            statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                <span>📝</span><span>${total} يوم مبرر</span>
            </span>`;
        } else {
            statusBadge = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                <span>⚠️</span><span>${total} يوم غياب</span>
            </span>`;
        }

        html += `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="p-3 text-center text-slate-400 font-mono text-xs">${idx + 1}</td>
                <td class="p-3">
                    <div class="flex items-center gap-3">
                        <img src="${photo}" alt="${sName}" class="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0 shadow-2xs" onerror="this.src='https://cdn-icons-png.flaticon.com/512/3135/3135715.png'">
                        <div>
                            <span class="font-bold text-slate-900 block text-xs md:text-sm">${sName}</span>
                            ${parentPhone ? `<span class="text-[10px] text-slate-400 font-mono flex items-center gap-1">📞 ${parentPhone}</span>` : `<span class="text-[10px] text-amber-500 font-medium">بدون هاتف</span>`}
                        </div>
                    </div>
                </td>
                
                <!-- أزرار زيادة ونقصان الغياب المبرر -->
                <td class="p-3 text-center">
                    <div class="inline-flex items-center justify-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-2xs">
                        <button type="button" onclick="stepAbsence('${s.id}', '${session}', 'justified', -1)" title="إنقاص يوم مبرر"
                            class="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-extrabold text-sm flex items-center justify-center transition-all cursor-pointer border border-slate-200 hover:scale-105 active:scale-95 shadow-2xs">
                            -
                        </button>
                        <input type="number" min="0" value="${just}" onchange="updateAbsenceCount('${s.id}', '${session}', 'justified', this.value)"
                            class="w-12 text-center text-xs font-bold text-sky-800 bg-white border border-slate-200 rounded-lg py-1 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 shadow-inner">
                        <button type="button" onclick="stepAbsence('${s.id}', '${session}', 'justified', 1)" title="زيادة يوم مبرر"
                            class="w-7 h-7 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-sm flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs shadow-sky-200">
                            +
                        </button>
                    </div>
                </td>

                <!-- أزرار زيادة ونقصان الغياب غير المبرر -->
                <td class="p-3 text-center">
                    <div class="inline-flex items-center justify-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-2xs">
                        <button type="button" onclick="stepAbsence('${s.id}', '${session}', 'unjustified', -1)" title="إنقاص يوم غير مبرر"
                            class="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 font-extrabold text-sm flex items-center justify-center transition-all cursor-pointer border border-slate-200 hover:scale-105 active:scale-95 shadow-2xs">
                            -
                        </button>
                        <input type="number" min="0" value="${unjust}" onchange="updateAbsenceCount('${s.id}', '${session}', 'unjustified', this.value)"
                            class="w-12 text-center text-xs font-bold text-rose-800 bg-white border border-slate-200 rounded-lg py-1 focus:ring-1 focus:ring-rose-500 focus:border-rose-500 shadow-inner">
                        <button type="button" onclick="stepAbsence('${s.id}', '${session}', 'unjustified', 1)" title="زيادة يوم غير مبرر"
                            class="w-7 h-7 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs shadow-rose-200">
                            +
                        </button>
                    </div>
                </td>

                <!-- شارة المجموع الكلي -->
                <td class="p-3 text-center">
                    ${statusBadge}
                </td>

                <!-- زر واتساب الفوري لولي الأمر -->
                <td class="p-3 text-center">
                    <button type="button" onclick="sendAbsenceWhatsApp('${s.id}', '${session}')" title="مراسلة ولي أمر التلميذ(ة) عبر واتساب"
                        class="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 text-[11px] font-bold inline-flex items-center gap-1 transition-all shadow-2xs hover:shadow-xs cursor-pointer group">
                        <span class="group-hover:scale-110 transition-transform">💬</span>
                        <span class="hidden sm:inline">إشعار ولي الأمر</span>
                        <span class="sm:hidden">واتساب</span>
                    </button>
                </td>

                <!-- زر تصفير الغياب للتلميذ -->
                <td class="p-3 text-center">
                    ${total > 0 ? `
                        <button type="button" onclick="resetStudentAbsence('${s.id}', '${session}', '${sName}')" title="تصفير غياب هذا التلميذ"
                            class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer text-xs">
                            🔄
                        </button>
                    ` : `<span class="text-slate-300 text-xs">-</span>`}
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;

    list.innerHTML = html;
    if (typeof feather !== 'undefined') feather.replace();
}

// تحديث بطاقات المؤشرات العلوية
function updateAbsenceKpis(total, justified, unjustified, rate) {
    const elTotal = document.getElementById('absKpiTotalStudents');
    const elJust = document.getElementById('absKpiJustified');
    const elUnjust = document.getElementById('absKpiUnjustified');
    const elRate = document.getElementById('absKpiRate');

    if (elTotal) elTotal.textContent = total;
    if (elJust) elJust.textContent = `${justified} يوم`;
    if (elUnjust) elUnjust.textContent = `${unjustified} يوم`;
    if (elRate) elRate.textContent = `${rate}%`;
}

// تحديث أعداد أزرار التصفية
function updateAbsFilterCounts(all, absent, present) {
    const elAll = document.getElementById('absCount_all');
    const elAbsent = document.getElementById('absCount_absent');
    const elPresent = document.getElementById('absCount_present');

    if (elAll) elAll.textContent = all;
    if (elAbsent) elAbsent.textContent = absent;
    if (elPresent) elPresent.textContent = present;
}

// زيادة أو إنقاص الغياب بنقرة واحدة
window.stepAbsence = function (studentId, session, type, delta) {
    if (!absences[studentId]) absences[studentId] = {};
    if (!absences[studentId][session]) absences[studentId][session] = [];

    const currentCount = absences[studentId][session].filter(a => a.type === type).length;
    const newCount = Math.max(0, currentCount + delta);
    updateAbsenceCount(studentId, session, type, newCount);
    renderAbsenceList();
};

// حفظ وتحديث عدد الغياب للتلميذ
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

    // تحديث بطاقة النتيجة إذا كان هذا التلميذ مفتوحاً حالياً في الرئيسية
    if (selectedHomeStudentId && String(selectedHomeStudentId) === String(studentId)) {
        if (typeof renderNewReportCard === 'function') renderNewReportCard(studentId);
    }
};

// تصفير غياب تلميذ محدد
window.resetStudentAbsence = function (studentId, session, studentName) {
    if (!confirm(`هل أنت متأكد من تصفير جميع أيام الغياب للتلميذ(ة) "${studentName}" في ${session}؟`)) return;
    if (absences[studentId] && absences[studentId][session]) {
        absences[studentId][session] = [];
        saveAll();
        renderAbsenceList();
        if (selectedHomeStudentId && String(selectedHomeStudentId) === String(studentId)) {
            if (typeof renderNewReportCard === 'function') renderNewReportCard(studentId);
        }
    }
};

// إرسال إشعار غياب فوري لولي الأمر عبر واتساب
window.sendAbsenceWhatsApp = function (studentId, session) {
    const student = (Array.isArray(students)) ? students.find(x => String(x.id) === String(studentId)) : null;
    if (!student) return alert("تعذر العثور على بيانات التلميذ.");

    const rawPhone = (typeof getStudentParentPhone === 'function')
        ? getStudentParentPhone(student)
        : (student.info['هاتف ولي الأمر'] || student.info['الهاتف'] || '');

    if (!rawPhone || !rawPhone.trim()) {
        const entered = prompt(`لا يوجد رقم هاتف مسجل لولي أمر التلميذ(ة) "${student.info['الاسم الكامل (بالعربية)']}".\nيرجى إدخال رقم هاتف ولي الأمر لمراسلته عبر واتساب:`);
        if (entered && entered.trim()) {
            student.info['هاتف ولي الأمر'] = entered.trim();
            saveAll();
            sendAbsenceWhatsApp(studentId, session);
        }
        return;
    }

    const sAbs = (absences[studentId] && absences[studentId][session]) ? absences[studentId][session] : [];
    const just = sAbs.filter(a => a.type === 'justified').length;
    const unjust = sAbs.filter(a => a.type === 'unjustified').length;
    const total = just + unjust;

    const studentName = student.info['الاسم الكامل (بالعربية)'] || '';
    const instName = institutionName || 'مؤسسة البراءة للتعليم المدرسي الخصوصي';

    let msg = `السلام عليكم ورحمة الله وبركاته،\n`;
    msg += `المحترم(ة) ولي أمر التلميذ(ة): *${studentName}*،\n\n`;
    msg += `نحيطكم علماً من إدارة *${instName}* بأنه قد تم تسجيل غياب للتلميذ(ة) خلال *${session}*:\n`;
    msg += `🔹 أيام الغياب المبرر: ${just} يوم\n`;
    msg += `🔸 أيام الغياب غير المبرر: ${unjust} يوم\n`;
    msg += `📌 مجموع أيام الغياب: *${total} يوم*\n\n`;
    if (unjust > 0) {
        msg += `يرجى منكم التفضل بالتواصل مع إدارة المؤسسة أو موافاتنا بمبرر الغياب، حرصاً على المواظبة والتحصيل الدراسي للتلميذ(ة).\n\n`;
    } else {
        msg += `نشكركم على حسن تواصلكم وحرصكم الدائم على مواظبة التلميذ(ة).\n\n`;
    }
    msg += `مع أطيب التحيات،\nإدارة المؤسسة.`;

    let cleanPhone = rawPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '212' + cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('212') && cleanPhone.length === 9) {
        cleanPhone = '212' + cleanPhone;
    }

    const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
};

// طباعة لائحة غياب القسم منسقة وجاهزة للتوقيع
window.printAbsenceSheet = function () {
    const deptSelect = document.getElementById('absDeptSelect');
    const sessionSelect = document.getElementById('absSessionSelect');
    if (!deptSelect || !deptSelect.value) return alert("يرجى اختيار القسم أولاً لطباعة لائحة الغياب.");

    const deptId = deptSelect.value;
    const session = sessionSelect ? sessionSelect.value : 'الدورة الأولى';
    const deptObj = departments.find(d => String(d.id) === String(deptId));
    const deptName = deptObj ? deptObj.name : 'القسم';

    const deptStudents = (Array.isArray(students))
        ? students.filter(s => String(s.deptId) === String(deptId) && !s.isDroppedOut)
        : [];

    if (deptStudents.length === 0) return alert("لا يوجد تلاميذ في هذا القسم لطباعة اللائحة.");

    const instName = institutionName || 'مؤسسة البراءة للتعليم المدرسي الخصوصي';
    const year = currentAcademicYear || '2025/2026';
    const today = new Date().toLocaleDateString('ar-MA', { year: 'numeric', month: 'long', day: 'numeric' });

    let rowsHtml = '';
    let sumJust = 0;
    let sumUnjust = 0;

    deptStudents.forEach((s, idx) => {
        const sAbs = (absences[s.id] && absences[s.id][session]) ? absences[s.id][session] : [];
        const just = sAbs.filter(a => a.type === 'justified').length;
        const unjust = sAbs.filter(a => a.type === 'unjustified').length;
        const total = just + unjust;
        sumJust += just;
        sumUnjust += unjust;

        const sName = s.info && s.info['الاسم الكامل (بالعربية)'] ? s.info['الاسم الكامل (بالعربية)'] : '-';
        const massar = s.info && s.info['رقم مسار للتلميذ(ة)'] ? s.info['رقم مسار للتلميذ(ة)'] : '-';

        rowsHtml += `
            <tr style="border-bottom: 1px solid #e2e8f0; text-align: right;">
                <td style="padding: 8px 10px; text-align: center; border: 1px solid #cbd5e1;">${idx + 1}</td>
                <td style="padding: 8px 10px; font-weight: bold; border: 1px solid #cbd5e1;">${sName}</td>
                <td style="padding: 8px 10px; text-align: center; font-family: monospace; border: 1px solid #cbd5e1;">${massar}</td>
                <td style="padding: 8px 10px; text-align: center; border: 1px solid #cbd5e1;">${just > 0 ? just : '-'}</td>
                <td style="padding: 8px 10px; text-align: center; border: 1px solid #cbd5e1; font-weight: ${unjust > 0 ? 'bold' : 'normal'}; color: ${unjust > 0 ? '#b91c1c' : '#334155'};">${unjust > 0 ? unjust : '-'}</td>
                <td style="padding: 8px 10px; text-align: center; font-weight: bold; border: 1px solid #cbd5e1; background-color: ${total > 0 ? '#fff1f2' : '#f8fafc'};">${total}</td>
                <td style="padding: 8px 10px; text-align: center; border: 1px solid #cbd5e1; font-size: 11px; color: #64748b;">${total === 0 ? 'مواظب' : ''}</td>
            </tr>
        `;
    });

    const printHtml = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>لائحة غياب التلاميذ - ${deptName} - ${session}</title>
            <style>
                @page { size: A4 portrait; margin: 15mm; }
                body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; margin: 0; padding: 10px; color: #1e293b; background: white; }
                .header-box { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 18px; }
                .inst-title { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0; }
                .sheet-title { text-align: center; font-size: 16px; font-weight: 800; color: #be123c; margin: 5px 0; }
                .meta-badge { font-size: 11px; font-weight: bold; background: #f1f5f9; padding: 4px 10px; border-radius: 6px; border: 1px solid #cbd5e1; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 15px; }
                th { background-color: #f8fafc; color: #334155; font-weight: bold; padding: 8px 10px; border: 1px solid #cbd5e1; }
                .summary-box { display: flex; justify-content: space-between; margin-top: 15px; font-size: 12px; font-weight: bold; background: #f8fafc; padding: 10px 15px; border-radius: 8px; border: 1px solid #cbd5e1; }
                .signatures { display: flex; justify-content: space-between; margin-top: 45px; padding: 0 40px; font-size: 13px; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header-box">
                <div>
                    <h1 class="inst-title">${instName}</h1>
                    <p style="margin: 3px 0 0; font-size: 11px; color: #64748b;">السنة الدراسية: <strong>${year}</strong></p>
                </div>
                <div style="text-align: center;">
                    <h2 class="sheet-title">📋 لائحة تتبع حضور وغياب التلاميذ</h2>
                    <span class="meta-badge">القسم: ${deptName} | ${session}</span>
                </div>
                <div style="text-align: left; font-size: 11px; color: #64748b;">
                    <p style="margin: 0;">تاريخ الاستخراج:</p>
                    <p style="margin: 3px 0 0; font-weight: bold; color: #0f172a;">${today}</p>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 35px;">#</th>
                        <th>الاسم الكامل للتلميذ(ة)</th>
                        <th style="width: 100px;">رقم مسار</th>
                        <th style="width: 90px;">غياب مبرر</th>
                        <th style="width: 90px;">غير مبرر</th>
                        <th style="width: 80px;">المجموع</th>
                        <th style="width: 110px;">ملاحظات</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>

            <div class="summary-box">
                <span>إجمالي التلاميذ: ${deptStudents.length}</span>
                <span>إجمالي أيام الغياب المبرر: ${sumJust} يوم</span>
                <span>إجمالي أيام الغياب غير المبرر: ${sumUnjust} يوم</span>
                <span>المجموع العام للغياب: ${sumJust + sumUnjust} يوم</span>
            </div>

            <div class="signatures">
                <div>توقيع الأستاذ(ة):</div>
                <div>توقيع وخاتم الإدارة:</div>
            </div>

            <script>
                window.onload = function() { window.print(); };
            </script>
        </body>
        </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
        printWin.document.open();
        printWin.document.write(printHtml);
        printWin.document.close();
    }
};

// توافق مع أي استدعاءات سابقة
window.renderAbsenceList = renderAbsenceList;
