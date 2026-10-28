// ============================================================
// === 15. أداء الواجبات الشهرية والرسوم (Monthly Performance & Custom Duties) ===
// ============================================================

const ALL_DEFAULT_MONTHS = [
    "شتنبر", "أكتوبر", "نونبر", "دجنبر", "يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو", "يوليوز", "غشت"
];

const DEFAULT_ENABLED_MONTHS = [
    "شتنبر", "أكتوبر", "نونبر", "دجنبر", "يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو", "يوليوز"
];

let performanceConfig = {
    enabledMonths: [...DEFAULT_ENABLED_MONTHS],
    customDuties: []
};

// تحميل الإعدادات من التخزين
function loadPerformanceConfig() {
    try {
        const key = "performanceConfig_" + (currentAcademicYear || "default");
        let stored = appStorage.getItem(key);
        if (!stored) {
            stored = appStorage.getItem("performanceConfig");
        }
        if (stored) {
            const parsed = JSON.parse(stored);
            performanceConfig.enabledMonths = Array.isArray(parsed.enabledMonths) ? parsed.enabledMonths : [...DEFAULT_ENABLED_MONTHS];
            performanceConfig.customDuties = Array.isArray(parsed.customDuties) ? parsed.customDuties : [];
        } else {
            performanceConfig = {
                enabledMonths: [...DEFAULT_ENABLED_MONTHS],
                customDuties: []
            };
        }
    } catch (e) {
        performanceConfig = {
            enabledMonths: [...DEFAULT_ENABLED_MONTHS],
            customDuties: []
        };
    }
}
window.loadPerformanceConfig = loadPerformanceConfig;

function loadPerformanceConfigFromData(dataCfg) {
    if (dataCfg) {
        performanceConfig.enabledMonths = Array.isArray(dataCfg.enabledMonths) ? dataCfg.enabledMonths : [...DEFAULT_ENABLED_MONTHS];
        performanceConfig.customDuties = Array.isArray(dataCfg.customDuties) ? dataCfg.customDuties : [];
    } else {
        loadPerformanceConfig();
    }
}
window.loadPerformanceConfigFromData = loadPerformanceConfigFromData;

// حفظ الإعدادات
function savePerformanceConfig(syncCloud = true) {
    try {
        const key = "performanceConfig_" + (currentAcademicYear || "default");
        const str = JSON.stringify(performanceConfig);
        appStorage.setItem(key, str);
        appStorage.setItem("performanceConfig", str);

        if (currentAcademicYear && academicData[currentAcademicYear]) {
            academicData[currentAcademicYear].performanceConfig = JSON.parse(str);
        }
    } catch (e) {
        console.warn("Save performanceConfig error:", e);
    }

    if (syncCloud && typeof fs !== 'undefined' && typeof cloudUserId !== 'undefined' && cloudUserId) {
        fs.collection('users').doc(cloudUserId).set({
            performanceConfig: performanceConfig,
            lastUpdated: new Date().toISOString()
        }, { merge: true }).catch(err => console.log('Firestore performanceConfig sync error:', err));
    }

    renderPerformanceSettings();
    populatePerformanceModalSelects();
}
window.savePerformanceConfig = savePerformanceConfig;

function getPerformanceConfig() {
    return performanceConfig;
}
window.getPerformanceConfig = getPerformanceConfig;

// استخراج جميع بنود الأداء النشطة (واجبات إضافية أولاً ثم أشهر مفعلة)
function getActivePerformanceItems() {
    loadPerformanceConfig();
    const months = performanceConfig.enabledMonths || [];
    const customs = performanceConfig.customDuties || [];
    return [...customs, ...months];
}
window.getActivePerformanceItems = getActivePerformanceItems;

// تبديل تفعيل شهر معين
function toggleMonthEnabled(month) {
    const idx = performanceConfig.enabledMonths.indexOf(month);
    if (idx > -1) {
        performanceConfig.enabledMonths.splice(idx, 1);
    } else {
        const nextMonths = [];
        ALL_DEFAULT_MONTHS.forEach(m => {
            if (performanceConfig.enabledMonths.includes(m) || m === month) {
                nextMonths.push(m);
            }
        });
        performanceConfig.enabledMonths = nextMonths;
    }
    savePerformanceConfig();
}
window.toggleMonthEnabled = toggleMonthEnabled;

// تفعيل كل الأشهر أو إلغاء تحديد الكل
function setAllMonths(enabled) {
    performanceConfig.enabledMonths = enabled ? [...ALL_DEFAULT_MONTHS] : [];
    savePerformanceConfig();
}
window.setAllMonths = setAllMonths;

// الأشهر الأساسية (شتنبر إلى يونيو)
function setBasicMonths() {
    performanceConfig.enabledMonths = ["شتنبر", "أكتوبر", "نونبر", "دجنبر", "يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو"];
    savePerformanceConfig();
}
window.setBasicMonths = setBasicMonths;

// إضافة واجب إضافي مخصص
function submitNewCustomDuty() {
    const input = document.getElementById('newCustomDutyInput');
    if (!input) return;
    const name = input.value.trim();
    if (!name) return;
    addCustomDuty(name);
    input.value = '';
    input.focus();
}
window.submitNewCustomDuty = submitNewCustomDuty;

function quickAddDuty(name) {
    addCustomDuty(name);
}
window.quickAddDuty = quickAddDuty;

function addCustomDuty(name) {
    if (!name) return;
    const cleanName = name.trim();
    if (!cleanName) return;

    if (performanceConfig.customDuties.includes(cleanName) || ALL_DEFAULT_MONTHS.includes(cleanName)) {
        alert('هذا البند موجود مسبقاً.');
        return;
    }

    performanceConfig.customDuties.push(cleanName);
    savePerformanceConfig();
}
window.addCustomDuty = addCustomDuty;

// حذف واجب إضافي
function deleteCustomDuty(name) {
    if (!confirm(`هل أنت متأكد من حذف البند "${name}"؟`)) return;
    performanceConfig.customDuties = performanceConfig.customDuties.filter(d => d !== name);
    savePerformanceConfig();
}
window.deleteCustomDuty = deleteCustomDuty;

// استعادة الإعدادات الافتراضية
function restoreDefaultPerformanceConfig() {
    if (!confirm('هل تريد استعادة إعدادات الأشهر الافتراضية؟')) return;
    performanceConfig = {
        enabledMonths: [...DEFAULT_ENABLED_MONTHS],
        customDuties: []
    };
    savePerformanceConfig();
}
window.restoreDefaultPerformanceConfig = restoreDefaultPerformanceConfig;

// رسم واجهة إعدادات أداء الواجبات والرسوم في الإعدادات
function renderPerformanceSettings() {
    loadPerformanceConfig();

    const grid = document.getElementById('monthsCheckboxGrid');
    const customList = document.getElementById('customDutiesList');
    const monthsBadge = document.getElementById('activeMonthsCountBadge');
    const customBadge = document.getElementById('customDutiesCountBadge');
    const previewSummary = document.getElementById('performanceActiveSummaryPreview');

    // 1. شبكة الأشهر
    if (grid) {
        grid.innerHTML = '';
        ALL_DEFAULT_MONTHS.forEach(month => {
            const isEnabled = performanceConfig.enabledMonths.includes(month);
            const card = document.createElement('label');
            card.className = `flex items-center justify-between p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                isEnabled ? 'bg-teal-50/80 border-teal-300 text-teal-950 font-bold shadow-2xs' : 'bg-slate-50 border-slate-200 text-slate-400 font-medium'
            }`;
            card.innerHTML = `
                <div class="flex items-center gap-2">
                    <input type="checkbox" ${isEnabled ? 'checked' : ''} onchange="toggleMonthEnabled('${month}')" class="w-4 h-4 accent-teal-600 rounded cursor-pointer">
                    <span class="text-xs">${month}</span>
                </div>
                <span class="text-[10px] px-1.5 py-0.5 rounded ${isEnabled ? 'bg-teal-200/80 text-teal-900' : 'bg-slate-200 text-slate-500'}">
                    ${isEnabled ? 'مفعل' : 'معطل'}
                </span>
            `;
            grid.appendChild(card);
        });
    }

    if (monthsBadge) {
        monthsBadge.textContent = `${performanceConfig.enabledMonths.length} شهر مفعل`;
    }

    // 2. قائمة الواجبات الإضافية
    if (customList) {
        customList.innerHTML = '';
        if (performanceConfig.customDuties.length === 0) {
            customList.innerHTML = '<p class="text-slate-400 text-xs text-center py-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">لا توجد أداءات إضافية مضافة بعد. يمكنك إضافة واجب التسجيل، التأمين، إلخ.</p>';
        } else {
            performanceConfig.customDuties.forEach(duty => {
                const item = document.createElement('div');
                item.className = 'flex items-center justify-between p-2.5 bg-indigo-50/50 border border-indigo-200 rounded-xl text-xs';
                item.innerHTML = `
                    <div class="flex items-center gap-2">
                        <span class="text-base">💳</span>
                        <strong class="text-indigo-950">${duty}</strong>
                    </div>
                    <button type="button" onclick="deleteCustomDuty('${duty}')" class="text-rose-600 hover:text-rose-800 text-xs font-bold px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 transition-colors" title="حذف هذا البند">
                        🗑️ حذف
                    </button>
                `;
                customList.appendChild(item);
            });
        }
    }

    if (customBadge) {
        customBadge.textContent = `${performanceConfig.customDuties.length} أداء إضافي`;
    }

    // 3. ملخص المعاينة
    if (previewSummary) {
        previewSummary.innerHTML = '';
        const allActive = getActivePerformanceItems();
        if (allActive.length === 0) {
            previewSummary.innerHTML = '<span class="text-rose-500 font-bold">⚠️ تنبيه: لا يوجد أي شهر أو واجب مفعل حالياً! يرجى تفعيل شهر واحد على الأقل.</span>';
        } else {
            allActive.forEach(item => {
                const isCustom = performanceConfig.customDuties.includes(item);
                const tag = document.createElement('span');
                tag.className = `px-2.5 py-1 rounded-lg font-bold border text-xs flex items-center gap-1 ${
                    isCustom ? 'bg-indigo-50 border-indigo-300 text-indigo-900' : 'bg-teal-50 border-teal-300 text-teal-900'
                }`;
                tag.innerHTML = `<span>${isCustom ? '💳' : '📅'}</span><span>${item}</span>`;
                previewSummary.appendChild(tag);
            });
        }
    }
}
window.renderPerformanceSettings = renderPerformanceSettings;

// تعبئة القائمة المنسدلة في نافذة تسجيل الواجبات
function populatePerformanceModalSelects() {
    const monthSelect = document.getElementById('perfMonthSelect');
    if (!monthSelect) return;

    loadPerformanceConfig();
    const currentVal = monthSelect.value;
    monthSelect.innerHTML = '';

    const customs = performanceConfig.customDuties || [];
    const months = performanceConfig.enabledMonths || [];

    if (customs.length > 0) {
        const grp = document.createElement('optgroup');
        grp.label = '💳 أداءات وواجبات إضافية';
        customs.forEach(c => {
            grp.appendChild(new Option(c, c));
        });
        monthSelect.appendChild(grp);
    }

    if (months.length > 0) {
        const grp = document.createElement('optgroup');
        grp.label = '📅 الأشهر الدراسية';
        months.forEach(m => {
            grp.appendChild(new Option(m, m));
        });
        monthSelect.appendChild(grp);
    }

    if (monthSelect.options.length === 0) {
        monthSelect.appendChild(new Option('-- لا توجد بنود أداء مفعلة --', ''));
    }

    if (currentVal && Array.from(monthSelect.options).some(o => o.value === currentVal)) {
        monthSelect.value = currentVal;
    }
}
window.populatePerformanceModalSelects = populatePerformanceModalSelects;

// ============================================================
// === إدارة الجدول المتقاطع لتتبع أداء الشهور والواجبات ===
// ============================================================

let currentPerfFilter = 'all';    // 'all' أو 'paid' أو 'unpaid'
let perfSearchQuery = '';

// تحديث شريط أزرار المستويات السريعة (Chips)
function renderDeptChips() {
    const chipsContainer = document.getElementById('perfDeptChipsList');
    const select = document.getElementById('perfDeptSelect');
    if (!chipsContainer || !select) return;

    chipsContainer.innerHTML = '';
    const currentDeptId = select.value;

    departments.forEach(d => {
        const isSelected = String(d.id) === String(currentDeptId);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
            isSelected
                ? 'bg-teal-700 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200'
        }`;
        btn.textContent = d.name;
        btn.onclick = () => {
            select.value = d.id;
            onPerfDeptChanged();
        };
        chipsContainer.appendChild(btn);
    });
}
window.renderDeptChips = renderDeptChips;

// عند تغيير القسم / المستوى
function onPerfDeptChanged() {
    renderDeptChips();
    renderPerformanceList();
}
window.onPerfDeptChanged = onPerfDeptChanged;

// ضبط تصفية العرض (الكل / المسددون بالكامل / عليهم متأخرات)
function setPerfFilter(filter) {
    currentPerfFilter = filter;
    window._justRecordedStudentId = null;
    const btnAll = document.getElementById('perfFilterAllBtn');
    const btnPaid = document.getElementById('perfFilterPaidBtn');
    const btnUnpaid = document.getElementById('perfFilterUnpaidBtn');

    const defaultClass = 'px-3 py-1.5 rounded-xl text-xs font-bold transition-all ';
    if (btnAll) {
        btnAll.className = defaultClass + (filter === 'all'
            ? 'bg-teal-600 text-white shadow-2xs'
            : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300');
    }
    if (btnPaid) {
        btnPaid.className = defaultClass + (filter === 'paid'
            ? 'bg-emerald-600 text-white shadow-2xs'
            : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200');
    }
    if (btnUnpaid) {
        btnUnpaid.className = defaultClass + (filter === 'unpaid'
            ? 'bg-rose-600 text-white shadow-2xs'
            : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200');
    }

    renderPerformanceList();
}
window.setPerfFilter = setPerfFilter;

// البحث السريع بالتلميذ
function onPerfSearchChanged() {
    const input = document.getElementById('perfSearchInput');
    perfSearchQuery = input ? input.value.trim().toLowerCase() : '';
    renderPerformanceList();
}
window.onPerfSearchChanged = onPerfSearchChanged;

// تحديث عدادات التصفية فقط (بعد إزالة خانات إجمالي المداخيل والمسددين ونسبة الاستخلاص)
function updatePerformanceKPIs(deptStudents) {
    const countAll = document.getElementById('filterCountAll');
    const countPaid = document.getElementById('filterCountPaid');
    const countUnpaid = document.getElementById('filterCountUnpaid');

    if (!deptStudents || deptStudents.length === 0) {
        if (countAll) countAll.textContent = '0';
        if (countPaid) countPaid.textContent = '0';
        if (countUnpaid) countUnpaid.textContent = '0';
        return;
    }

    const activeItems = getActivePerformanceItems();
    const totalStudents = deptStudents.length;
    let fullyPaidCount = 0;
    let hasUnpaidCount = 0;

    deptStudents.forEach(s => {
        const stPayments = monthlyGrades[s.id] || {};
        let studentUnpaidCount = 0;

        activeItems.forEach(item => {
            if (!stPayments[item]) {
                studentUnpaidCount++;
            }
        });

        if (studentUnpaidCount === 0) {
            fullyPaidCount++;
        } else {
            hasUnpaidCount++;
        }
    });

    if (countAll) countAll.textContent = totalStudents;
    if (countPaid) countPaid.textContent = fullyPaidCount;
    if (countUnpaid) countUnpaid.textContent = hasUnpaidCount;
}

// عرض الجدول المتقاطع الرئيسي للقسم المختار
function renderPerformanceList() {
    const perfDeptSelect = document.getElementById('perfDeptSelect');
    const list = document.getElementById('perfStudentsList');
    if (!perfDeptSelect || !list) return;

    const prevScrollLeft = list.scrollLeft;
    const deptId = perfDeptSelect.value;

    // في حال عدم اختيار القسم: لا يتم تحديد المعلومات العامة ويبقى الجدول خالياً مع رسالة توجيهية
    if (!deptId) {
        updatePerformanceKPIs([]);
        list.innerHTML = `
            <div class="text-center py-16 text-slate-400">
                <span class="text-5xl block mb-3">🏫</span>
                <h4 class="font-extrabold text-base text-slate-700">يرجى تحديد المستوى / القسم أولاً</h4>
                <p class="text-xs text-slate-400 mt-1">اختر قسماً من القائمة أو انقر على أحد أزرار المستويات أعلاه لعرض الجدول المتقاطع وإحصائياته العامة</p>
            </div>
        `;
        return;
    }

    const deptStudents = students.filter(s => String(s.deptId) === String(deptId) && !s.isDroppedOut);
    updatePerformanceKPIs(deptStudents);

    if (deptStudents.length === 0) {
        list.innerHTML = `
            <div class="text-center py-16 text-slate-400">
                <span class="text-5xl block mb-3">👥</span>
                <h4 class="font-extrabold text-base text-slate-700">لا يوجد تلاميذ مسجلين في هذا القسم</h4>
            </div>
        `;
        return;
    }

    renderCrossTable(deptStudents, deptId);
}
window.renderPerformanceList = renderPerformanceList;

// بناء ورسم الجدول المتقاطع (Cross-Table / Tableau Croisé)
// بناء ورسم الجدول المتقاطع (Cross-Table / Tableau Croisé)
function renderCrossTable(deptStudents, deptId) {
    const list = document.getElementById('perfStudentsList');
    if (!list) return;

    const activeItems = getActivePerformanceItems();
    if (activeItems.length === 0) {
        list.innerHTML = `
            <div class="text-center py-12 text-slate-400">
                <span class="text-3xl block mb-2">⚠️</span>
                <p class="font-bold text-sm text-slate-600">لا توجد أشهر أو واجبات مفعلة حالياً في الإعدادات!</p>
            </div>
        `;
        return;
    }

    // تصفية التلاميذ حسب البحث وزر الفلترة
    let filtered = deptStudents.filter(s => {
        const sName = (s.info['الاسم الكامل (بالعربية)'] || s.info['الاسم الكامل'] || '').toLowerCase();
        if (perfSearchQuery && !sName.includes(perfSearchQuery)) return false;

        // إذا تم تسجيل أداء لهذا التلميذ للتو في هذه الجلسة، نبقيه ظاهراً لكي لا يختفي فجأة من الجدول
        if (window._justRecordedStudentId && String(s.id) === String(window._justRecordedStudentId)) {
            return true;
        }

        const stPayments = monthlyGrades[s.id] || {};
        let hasAnyUnpaid = false;
        activeItems.forEach(item => {
            if (!stPayments[item]) hasAnyUnpaid = true;
        });

        if (currentPerfFilter === 'paid' && hasAnyUnpaid) return false;
        if (currentPerfFilter === 'unpaid' && !hasAnyUnpaid) return false;

        return true;
    });

    if (filtered.length === 0) {
        list.innerHTML = `
            <div class="text-center py-12 text-slate-400">
                <span class="text-3xl block mb-2">🔍</span>
                <p class="font-bold text-sm text-slate-600">لا توجد نتائج تطابق خيارات التصفية والبحث الحالية.</p>
            </div>
        `;
        return;
    }

    let colTotals = {};
    activeItems.forEach(item => { colTotals[item] = 0; });
    let grandTotal = 0;

    // رؤوس الأعمدة لجميع الشهور والواجبات بعرض ثابت ومحدد
    let headersHtml = '';
    activeItems.forEach(item => {
        const isCustom = performanceConfig.customDuties && performanceConfig.customDuties.includes(item);
        headersHtml += `
            <th style="width: 82px; min-width: 82px; max-width: 82px;"
                class="p-2 font-bold border border-slate-200 text-center whitespace-nowrap text-xs ${
                isCustom ? 'bg-indigo-50 text-indigo-950' : 'bg-teal-50/80 text-teal-950'
            }">
                <div class="truncate text-[11px]" title="${item}">${isCustom ? '💳' : '📅'} ${item}</div>
            </th>
        `;
    });

    // صفوف التلاميذ
    let rowsHtml = '';
    filtered.forEach((s, idx) => {
        const sPayments = monthlyGrades[s.id] || {};
        let studentTotal = 0;
        let cellsHtml = '';

        activeItems.forEach(item => {
            const val = sPayments[item];
            if (val) {
                const num = parseFloat(String(val).replace(/[^\d.]/g, ''));
                if (!isNaN(num)) {
                    studentTotal += num;
                    colTotals[item] += num;
                    grandTotal += num;
                }
                cellsHtml += `
                    <td style="width: 82px; min-width: 82px; max-width: 82px;"
                        class="p-1 border border-slate-200 text-center bg-emerald-50/30">
                        <div class="inline-flex items-center gap-1 justify-center py-0.5">
                            <button type="button"
                                onclick="openPaidCellMenu('${s.id}', '${item}', '${val}')"
                                class="px-1.5 py-0.5 rounded-md font-black text-[11px] bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300 transition-transform active:scale-95 shadow-2xs whitespace-nowrap"
                                title="المبلغ المؤدى: ${val} درهم — انقر للتعديل أو الإلغاء">
                                ✓ ${val}
                            </button>
                            <button type="button"
                                onclick="printPaymentReceipt('${s.id}', '${item}', '${val}')"
                                class="w-5 h-5 rounded bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center text-[10px] shadow-2xs transition-transform active:scale-90 shrink-0"
                                title="🖨️ طباعة وصل A5 بنسختين (للتلميذ والإدارة)">
                                🖨️
                            </button>
                        </div>
                    </td>
                `;
            } else {
                cellsHtml += `
                    <td style="width: 82px; min-width: 82px; max-width: 82px;"
                        class="p-1 border border-slate-200 text-center bg-rose-50/10">
                        <button type="button"
                            onclick="recordStudentPaymentPrompt('${s.id}', '${item}')"
                            class="w-12 py-0.5 rounded-md text-[11px] font-bold text-slate-400 hover:text-teal-700 bg-slate-50 hover:bg-teal-50 border border-dashed border-slate-300 hover:border-teal-400 transition-all active:scale-95 text-center inline-block"
                            title="غير مؤدى — انقر لكتابة المبلغ لتسجيل الأداء">
                            —
                        </button>
                    </td>
                `;
            }
        });

        const sName = s.info['الاسم الكامل (بالعربية)'] || s.info['الاسم الكامل'] || 'بدون اسم';
        const parentPhone = (typeof getStudentParentPhone === 'function') ? getStudentParentPhone(s) : (s.info['هاتف ولي الأمر'] || '');

        rowsHtml += `
            <tr class="group hover:bg-slate-50 transition-colors">
                <!-- عمود الرقم الترتيبي مثبت على اليمين تماماً -->
                <td style="position: sticky; right: 0; z-index: 10; width: 40px; min-width: 40px; max-width: 40px;"
                    class="p-2 border border-slate-200 font-mono text-slate-500 text-center font-bold text-xs bg-white group-hover:bg-slate-50">
                    ${idx + 1}
                </td>
                <!-- عمود اسم التلميذ مثبت بجوار الرقم الترتيبي ومظلل ليبقى واضحاً عند التمرير -->
                <td style="position: sticky; right: 40px; z-index: 10; width: 180px; min-width: 180px; max-width: 180px; box-shadow: -4px 0 6px -2px rgba(0,0,0,0.08); border-left: 2px solid #cbd5e1;"
                    class="p-2 border border-slate-200 bg-white group-hover:bg-slate-50">
                    <div class="flex items-center gap-1.5 font-bold text-slate-900 text-xs truncate" title="${sName}">
                        <span class="truncate">${sName}</span>
                        ${parentPhone
                            ? `<span class="text-[9px] text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded font-mono shrink-0" title="الهاتف: ${parentPhone}">📱</span>`
                            : ''
                        }
                    </div>
                </td>
                ${cellsHtml}
                <!-- عمود إجمالي المؤدى -->
                <td style="width: 95px; min-width: 95px; max-width: 95px;"
                    class="p-2 border border-slate-200 text-center font-black text-teal-800 bg-teal-50/40 whitespace-nowrap text-xs">
                    ${studentTotal > 0 ? (studentTotal + ' د.م') : '-'}
                </td>
                <!-- عمود الإجراءات والطباعة -->
                <td style="width: 115px; min-width: 115px; max-width: 115px;"
                    class="p-1.5 border border-slate-200 text-center whitespace-nowrap">
                    <div class="flex items-center justify-center gap-1">
                        <button type="button"
                            onclick="printStudentReceiptSelector('${s.id}')"
                            class="px-2 py-1 rounded-lg text-[10.5px] font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-2xs transition-colors shrink-0"
                            title="طباعة وصل A5 بنسختين (نسخة التلميذ ونسخة الإدارة مع خط القص)">
                            🖨️ وصل
                        </button>
                        <button type="button"
                            onclick="printStudentAnnualLedger('${s.id}')"
                            class="px-2 py-1 rounded-lg text-[10.5px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors shrink-0"
                            title="طباعة كشف الحساب المالي السنوي الكامل للتلميذ">
                            📋 كشف
                        </button>
                        <button type="button"
                            onclick="remindParentPaymentWhatsApp('${s.id}')"
                            class="px-1.5 py-1 rounded-lg text-[10.5px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-colors shrink-0"
                            title="تذكير ولي الأمر بالواتساب">
                            💬
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    // خلايا المجموع لكل عمود في أسفل الجدول المتقاطع
    let footerCells = '';
    activeItems.forEach(item => {
        footerCells += `
            <th style="width: 82px; min-width: 82px; max-width: 82px;"
                class="p-2 border border-teal-700 text-center text-xs font-black text-white whitespace-nowrap">
                ${colTotals[item] > 0 ? colTotals[item] : '-'}
            </th>`;
    });

    let colgroupHtml = `
        <colgroup>
            <col style="width: 40px;">
            <col style="width: 180px;">
            ${activeItems.map(() => '<col style="width: 82px;">').join('')}
            <col style="width: 95px;">
            <col style="width: 115px;">
        </colgroup>
    `;

    let html = `
        <table class="text-right border-collapse text-xs" style="table-layout: fixed; width: max-content; min-width: 100%;">
            ${colgroupHtml}
            <thead>
                <tr class="bg-slate-100 text-slate-700">
                    <th style="position: sticky; right: 0; z-index: 20; width: 40px; min-width: 40px; max-width: 40px;"
                        class="p-2 font-extrabold border border-slate-200 text-center bg-slate-100">#</th>
                    <th style="position: sticky; right: 40px; z-index: 20; width: 180px; min-width: 180px; max-width: 180px; box-shadow: -4px 0 6px -2px rgba(0,0,0,0.08); border-left: 2px solid #cbd5e1;"
                        class="p-2 font-extrabold border border-slate-200 bg-slate-100 whitespace-nowrap">اسم التلميذ(ة)</th>
                    ${headersHtml}
                    <th style="width: 95px; min-width: 95px; max-width: 95px;"
                        class="p-2 font-extrabold border border-slate-200 text-center bg-teal-100 text-teal-950 whitespace-nowrap">إجمالي المؤدى</th>
                    <th style="width: 115px; min-width: 115px; max-width: 115px;"
                        class="p-2 font-extrabold border border-slate-200 text-center whitespace-nowrap">الإجراءات والطباعة</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
                ${rowsHtml}
            </tbody>
            <tfoot>
                <tr class="bg-teal-800 text-white font-extrabold">
                    <th colspan="2"
                        style="position: sticky; right: 0; z-index: 20; width: 220px; min-width: 220px; max-width: 220px; box-shadow: -4px 0 6px -2px rgba(0,0,0,0.08); border-left: 2px solid #0f766e;"
                        class="p-2 border border-teal-700 text-right font-black bg-teal-800">
                        المجموع الإجمالي المستخلص:
                    </th>
                    ${footerCells}
                    <th style="width: 95px; min-width: 95px; max-width: 95px;"
                        class="p-2 border border-teal-700 text-center text-yellow-300 font-black text-sm whitespace-nowrap">${grandTotal > 0 ? (grandTotal + ' د.م') : '-'}</th>
                    <th style="width: 115px; min-width: 115px; max-width: 115px;"
                        class="p-2 border border-teal-700"></th>
                </tr>
            </tfoot>
        </table>
    `;

    const prevScrollLeft = list.scrollLeft;
    list.innerHTML = html;
    if (typeof prevScrollLeft === 'number') {
        list.scrollLeft = prevScrollLeft;
    }
}

// تسجيل أداء تلميذ لشهر محدد (بدون مبلغ موحد - يطلب المبلغ الفعلي)
function recordStudentPaymentPrompt(studentId, item) {
    const student = students.find(s => String(s.id) === String(studentId));
    const sName = student?.info?.['الاسم الكامل (بالعربية)'] || 'التلميذ';

    const inputAmt = prompt(`تسجيل أداء "${item}" للتلميذ(ة): ${sName}\nأدخل المبلغ المؤدى بالدرهم:`, "");
    if (inputAmt === null) return;

    const cleanAmt = inputAmt.trim();
    if (!cleanAmt) return;

    window._justRecordedStudentId = studentId;

    if (!monthlyGrades[studentId]) monthlyGrades[studentId] = {};
    monthlyGrades[studentId][item] = cleanAmt;
    saveAll();

    // حفظ إضافي مباشر لضمان الحفظ الدائم عبر التحديث
    try {
        if (currentAcademicYear) {
            appStorage.setItem("monthlyGrades_" + currentAcademicYear, JSON.stringify(monthlyGrades));
        }
        appStorage.setItem("monthlyGrades", JSON.stringify(monthlyGrades));
    } catch (e) { }

    // تحديث الجدول فوراً: يظهر المبلغ ومعه الزر الصغير للطباعة 🖨️
    renderPerformanceList();
}
window.recordStudentPaymentPrompt = recordStudentPaymentPrompt;

// فتح قائمة خيارات الأداء المسجل (طباعة وصل A5 / تعديل / إلغاء)
function openPaidCellMenu(studentId, item, currentVal) {
    const student = students.find(s => String(s.id) === String(studentId));
    const sName = student?.info?.['الاسم الكامل (بالعربية)'] || 'التلميذ';

    const choice = prompt(
        `أداء "${item}" للتلميذ: ${sName}\nالمبلغ الحالي: ${currentVal} درهم\n\nاختر رقم العملية:\n1 - 🖨️ طباعة وصل A5 بنسختين (للتلميذ والإدارة)\n2 - ✏️ تعديل المبلغ\n3 - ❌ إلغاء هذا الأداء\n\nأدخل الرقم (1 أو 2 أو 3):`,
        "1"
    );

    if (choice === null) return;
    const trimmed = choice.trim();

    if (trimmed === '1') {
        if (typeof printPaymentReceipt === 'function') {
            printPaymentReceipt(studentId, item, currentVal);
        }
    } else if (trimmed === '2') {
        const newAmt = prompt(`أدخل المبلغ الجديد لشهر "${item}" (المبلغ السابق: ${currentVal}):`, currentVal);
        if (newAmt !== null && newAmt.trim()) {
            window._justRecordedStudentId = studentId;
            if (!monthlyGrades[studentId]) monthlyGrades[studentId] = {};
            monthlyGrades[studentId][item] = newAmt.trim();
            saveAll();
            try {
                if (currentAcademicYear) {
                    appStorage.setItem("monthlyGrades_" + currentAcademicYear, JSON.stringify(monthlyGrades));
                }
                appStorage.setItem("monthlyGrades", JSON.stringify(monthlyGrades));
            } catch (e) { }
            renderPerformanceList();
        }
    } else if (trimmed === '3') {
        if (confirm(`هل أنت متأكد من إلغاء أداء "${item}" لهذا التلميذ؟`)) {
            if (monthlyGrades[studentId] && monthlyGrades[studentId][item]) {
                delete monthlyGrades[studentId][item];
                saveAll();
                try {
                    if (currentAcademicYear) {
                        appStorage.setItem("monthlyGrades_" + currentAcademicYear, JSON.stringify(monthlyGrades));
                    }
                    appStorage.setItem("monthlyGrades", JSON.stringify(monthlyGrades));
                } catch (e) { }
                renderPerformanceList();
            }
        }
    }
}
window.openPaidCellMenu = openPaidCellMenu;

// طباعة وصل A5 للتلميذ مع تحديد الشهر
function printStudentReceiptSelector(studentId) {
    const student = students.find(s => String(s.id) === String(studentId));
    if (!student) return;

    const sPayments = monthlyGrades[studentId] || {};
    const paidItems = Object.keys(sPayments).filter(k => !!sPayments[k]);

    if (paidItems.length === 0) {
        alert('لا توجد واجبات أو شهور مؤداة مسجلة لهذا التلميذ بعد.');
        return;
    }

    if (paidItems.length === 1) {
        const item = paidItems[0];
        printPaymentReceipt(studentId, item, sPayments[item]);
        return;
    }

    // إذا كانت هناك عدة شهور مؤداة، عرض قائمة للاختيار
    let promptMsg = `اختر الشهر أو البند لطباعة وصل A5 للتلميذ ${student.info['الاسم الكامل (بالعربية)']}:\n`;
    paidItems.forEach((it, i) => {
        promptMsg += `${i + 1} - ${it} (${sPayments[it]} درهم)\n`;
    });
    promptMsg += `\nأدخل الرقم (من 1 إلى ${paidItems.length}):`;

    const choice = prompt(promptMsg, String(paidItems.length));
    if (choice === null) return;

    const idx = parseInt(choice.trim(), 10) - 1;
    if (idx >= 0 && idx < paidItems.length) {
        const chosen = paidItems[idx];
        printPaymentReceipt(studentId, chosen, sPayments[chosen]);
    } else {
        alert('رقم غير صحيح.');
    }
}
window.printStudentReceiptSelector = printStudentReceiptSelector;

// إرسال تذكير واتساب فردي لولي الأمر بالشهور المتأخرة
function remindParentPaymentWhatsApp(studentId) {
    const student = students.find(s => String(s.id) === String(studentId));
    if (!student) return;

    let phone = (typeof getStudentParentPhone === 'function') ? getStudentParentPhone(student) : (student.info['هاتف ولي الأمر'] || '');
    if (!phone) {
        const inputPhone = prompt(`⚠️ رقم هاتف ولي أمر التلميذ(ة) "${student.info['الاسم الكامل (بالعربية)']}" غير مسجل.\nأدخل رقم الهاتف الآن (مثال: 0612345678):`);
        if (!inputPhone || !inputPhone.trim()) return;
        phone = inputPhone.trim();
        student.info['هاتف ولي الأمر'] = phone;
        saveAll();
    }

    const activeItems = getActivePerformanceItems();
    const stPayments = monthlyGrades[student.id] || {};
    const unpaidItems = activeItems.filter(it => !stPayments[it]);

    const sName = student.info['الاسم الكامل (بالعربية)'] || 'التلميذ(ة)';
    const dept = departments.find(d => String(d.id) === String(student.deptId));
    const deptName = dept?.name || 'القسم';
    const curYear = currentAcademicYear || '';
    const instTitle = (typeof currentSession !== 'undefined' && currentSession && currentSession.institution)
        ? currentSession.institution.replace(/\n/g, ' ')
        : (institutionName || 'المؤسسة');

    let unpaidText = unpaidItems.length > 0 ? unpaidItems.join('، ') : 'الواجبات الشهرية';
    const msg = `السلام عليكم ورحمة الله تعالى وبركاته،\nولي أمر التلميذ(ة) المحترم: *${sName}* (${deptName})\nنحيطكم علماً بضرورة تسوية واجبات: *${unpaidText}* للموسم الدراسي *${curYear}*.\nنشكركم جزيلاً على حسن تعاونكم والتزامكم مع المؤسسة.\nمع تحيات إدارة *${instTitle}*.`;

    if (typeof openWhatsAppDirect === 'function') {
        openWhatsAppDirect(phone, msg);
    } else {
        const cleaned = (typeof formatWhatsAppPhone === 'function') ? formatWhatsAppPhone(phone) : phone;
        window.open(`https://wa.me/${cleaned}?text=${encodeURIComponent(msg)}`, '_blank');
    }
}
window.remindParentPaymentWhatsApp = remindParentPaymentWhatsApp;

// تذكير جميع المتأخرين في المستوى عبر واتساب
function remindAllUnpaidWhatsApp() {
    const perfDeptSelect = document.getElementById('perfDeptSelect');
    const deptId = perfDeptSelect?.value;

    if (!deptId) {
        alert('يرجى اختيار المستوى / القسم أولاً.');
        return;
    }

    const deptStudents = students.filter(s => String(s.deptId) === String(deptId) && !s.isDroppedOut);
    const activeItems = getActivePerformanceItems();

    const unpaidStudents = deptStudents.filter(s => {
        const stPayments = monthlyGrades[s.id] || {};
        return activeItems.some(it => !stPayments[it]);
    });

    if (unpaidStudents.length === 0) {
        alert('جميع تلاميذ هذا المستوى مسددون بالكامل لجميع الشهور والواجبات! 🎉');
        return;
    }

    const withPhone = unpaidStudents.filter(s => {
        const ph = (typeof getStudentParentPhone === 'function') ? getStudentParentPhone(s) : (s.info['هاتف ولي الأمر'] || '');
        return !!ph;
    });

    if (withPhone.length === 0) {
        alert(`يوجد ${unpaidStudents.length} تلميذ عليهم متأخرات، ولكن لا توجد أرقام هواتف مسجلة لأولياء أمورهم.\nيرجى تسجيل أرقام الهواتف أولاً.`);
        return;
    }

    if (!confirm(`تم رصد ${unpaidStudents.length} تلميذ لديهم متأخرات (${withPhone.length} منهم لديهم رقم هاتف مسجل).\nهل تريد فتح نافذة التواصل بالواتساب لإرسال تذكير جماعي؟`)) {
        return;
    }

    if (typeof openWhatsAppModal === 'function') {
        openWhatsAppModal(null, 'batch');
        const batchDept = document.getElementById('waBatchDeptSelect');
        if (batchDept) {
            batchDept.value = deptId;
            if (typeof renderBatchRecipientsList === 'function') renderBatchRecipientsList();
        }
        const waMsg = document.getElementById('waBatchMessageText');
        if (waMsg) {
            waMsg.value = `السلام عليكم ورحمة الله، ولي أمر التلميذ(ة) *{اسم_التلميذ}* ({القسم})، نذكركم بتسوية الواجبات الشهرية المتأخرة للموسم الدراسي الحالي. شكراً لحسن تعاونكم مع المؤسسة.`;
        }
    }
}
window.remindAllUnpaidWhatsApp = remindAllUnpaidWhatsApp;

// طباعة تقرير الجدول المتقاطع للقسم كاملاً
function printCurrentPerfViewReport() {
    const perfDeptSelect = document.getElementById('perfDeptSelect');
    const deptId = perfDeptSelect?.value;

    if (!deptId) {
        alert('يرجى اختيار المستوى / القسم أولاً للطباعة.');
        return;
    }

    if (typeof printClassAnnualPerformanceMatrix === 'function') {
        printClassAnnualPerformanceMatrix(deptId);
    }
}
window.printCurrentPerfViewReport = printCurrentPerfViewReport;

// ربط بطاقة الأداء الشهري في القائمة الجانبية (فتح صفحة مستقلة كاملة عوض نافذة منبثقة)
const monthlyPerformanceCard = document.getElementById("monthlyPerformanceCard");
if (monthlyPerformanceCard) {
    monthlyPerformanceCard.onclick = function () {
        if (typeof switchToPerformancePage === 'function') {
            switchToPerformancePage();
        }
    };
}

const perfDeptSelectEl = document.getElementById('perfDeptSelect');
if (perfDeptSelectEl) perfDeptSelectEl.onchange = onPerfDeptChanged;

// تهيئة عند بدء التطبيق
document.addEventListener('DOMContentLoaded', () => {
    loadPerformanceConfig();
});


