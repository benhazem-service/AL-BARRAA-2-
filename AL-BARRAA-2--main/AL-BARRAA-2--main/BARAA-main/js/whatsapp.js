// ============================================================
// === 19. نظام التواصل عبر واتساب مع أولياء الأمور (WhatsApp) ===
// ============================================================

// القوالب الافتراضية الجاهزة
const DEFAULT_WA_TEMPLATES = [
    {
        id: 'tpl_absence',
        title: '🚨 إشعار غياب أو تأخر',
        category: 'absence',
        text: 'السلام عليكم ورحمة الله تعالى وبركاته،\nنحيطكم علماً بأن التلميذ(ة) *{اسم_التلميذ}* المسجل(ة) بقسم *{القسم}*، قد تغيب(ت) اليوم عن الحصص الدراسية.\nيرجى التواصل مع إدارة المؤسسة أو تبرير الغياب حرصاً على مصلحة التلميذ(ة).\nإدارة *{المؤسسة}*.'
    },
    {
        id: 'tpl_report',
        title: '📊 إشعار بالنتيجة والمعدل',
        category: 'grades',
        text: 'السلام عليكم ورحمة الله،\nتهنئكم إدارة *{المؤسسة}* بمناسبة صدور نتائج الدورة الدراسية.\nحصل(ت) التلميذ(ة) *{اسم_التلميذ}* ({القسم}) على معدل: *{المعدل_العام}* بتقدير: *{التقدير}*.\nمع تمنياتنا له(ا) بمزيد من التفوق والنجاح.'
    },
    {
        id: 'tpl_homework',
        title: '📝 تذكير بالفروض والواجبات',
        category: 'homework',
        text: 'تحية طيبة ولي أمر التلميذ(ة) *{اسم_التلميذ}*،\nنود تذكيركم بأن هناك فروضاً واختبارات قادمة خلال هذا الأسبوع لقسم *{القسم}*.\nنرجو منكم حث التلميذ(ة) على المراجعة الجيدة والتحضير، وفقهم الله جميعاً.\nإدارة *{المؤسسة}*.'
    },
    {
        id: 'tpl_meeting',
        title: '🤝 استدعاء ولي الأمر / لقاء تواصل',
        category: 'general',
        text: 'السلام عليكم ورحمة الله،\nتدعوكم إدارة *{المؤسسة}* لحضور لقاء تواصلي بخصوص التلميذ(ة) *{اسم_التلميذ}*، وذلك يوم *{التاريخ}*.\nحضوركم يهمنا لمتابعة المسار الدراسي للتلميذ(ة).\nتقبلوا فائق التقدير والاحترام.'
    },
    {
        id: 'tpl_announcement',
        title: '📢 إعلان عام / عطلة مدرسية',
        category: 'announcement',
        text: 'إعلان هام لجميع أولياء الأمور الكرام،\nتنهي إدارة *{المؤسسة}* إلى علمكم بأنه بمناسبة (...)، ستتوقف الدراسة ابتداءً من يوم (...) على أن تُستأنف يوم (...).\nنتمنى لكم ولأبنائكم عطلة سعيدة ومفيدة.\nإدارة *{المؤسسة}*.'
    },
    {
        id: 'tpl_encouragement',
        title: '🌟 تهنئة وتشجيع بالسلوك والتحسن',
        category: 'grades',
        text: 'السلام عليكم ورحمة الله،\nيسعدنا إخباركم بأن التلميذ(ة) *{اسم_التلميذ}* يظهر سلوكاً متميزاً ومجهوداً طيباً ومشاركة فعالة داخل قسم *{القسم}*.\nنشكركم على حسن المتابعة والدعم المستمر.\nمع تحيات إدارة *{المؤسسة}*.'
    }
];

let whatsappTemplates = [];
let batchSendingQueue = [];
let batchCurrentIndex = -1;

// تهيئة قوالب واتساب
function initWhatsApp() {
    loadWhatsAppTemplates();
    setupWhatsAppEventListeners();
}

// تحميل القوالب من التخزين المحلي
function loadWhatsAppTemplates() {
    try {
        const stored = appStorage.getItem('whatsappTemplates');
        if (stored) {
            whatsappTemplates = JSON.parse(stored);
        } else {
            whatsappTemplates = [...DEFAULT_WA_TEMPLATES];
            saveWhatsAppTemplates(false);
        }
    } catch (e) {
        whatsappTemplates = [...DEFAULT_WA_TEMPLATES];
    }
}

// حفظ القوالب
function saveWhatsAppTemplates(syncCloud = true) {
    try {
        appStorage.setItem('whatsappTemplates', JSON.stringify(whatsappTemplates));
    } catch (e) { }

    if (syncCloud && typeof fs !== 'undefined' && typeof cloudUserId !== 'undefined' && cloudUserId) {
        fs.collection('users').doc(cloudUserId).set({
            whatsappTemplates: whatsappTemplates,
            lastUpdated: new Date().toISOString()
        }, { merge: true }).catch(err => console.log('Firestore WhatsApp templates sync error:', err));
    }
}

// دالة تنظيف وتنسيق رقم الهاتف مع إضافة رمز البلد 212 تلقائياً
function formatWhatsAppPhone(rawPhone) {
    if (!rawPhone) return '';
    let cleaned = String(rawPhone).replace(/[^\d+]/g, '').trim();
    if (!cleaned) return '';

    if (cleaned.startsWith('+')) {
        cleaned = cleaned.substring(1);
    }
    if (cleaned.startsWith('00212')) {
        cleaned = cleaned.substring(2);
    }

    // إذا بدأ بـ 06 أو 07 أو 05: حذف الصفر وإضافة 212 تلقائياً
    if (/^0[567]\d+$/.test(cleaned)) {
        cleaned = '212' + cleaned.substring(1);
    } else if (/^[567]\d{8}$/.test(cleaned)) {
        cleaned = '212' + cleaned;
    } else if (cleaned.startsWith('212')) {
        if (/^2120[567]/.test(cleaned)) {
            cleaned = '212' + cleaned.substring(4);
        }
    }

    return cleaned;
}
window.formatWhatsAppPhone = formatWhatsAppPhone;

// استخراج رقم هاتف ولي أمر التلميذ
function getStudentParentPhone(student) {
    if (!student || !student.info) return '';
    const info = student.info;
    if (info['هاتف ولي الأمر']) return String(info['هاتف ولي الأمر']).trim();
    if (info['الهاتف']) return String(info['الهاتف']).trim();
    if (info['رقم الهاتف']) return String(info['رقم الهاتف']).trim();

    for (const key in info) {
        if (/هاتف|phone|teleph/i.test(key)) {
            const val = String(info[key] || '').trim();
            if (val) return val;
        }
    }
    return '';
}
window.getStudentParentPhone = getStudentParentPhone;

// استبدال الكلمات الدلالية والوسوم في القالب ببيانات التلميذ الحقيقية
function parseWhatsAppMessage(templateText, student) {
    if (!templateText) return '';
    let msg = templateText;
    const sInfo = (student && student.info) ? student.info : {};
    const sName = sInfo['الاسم الكامل (بالعربية)'] || sInfo['الاسم الكامل'] || 'التلميذ(ة)';

    let deptName = 'القسم';
    if (student && student.deptId) {
        const d = departments.find(x => String(x.id) === String(student.deptId));
        if (d) deptName = d.name;
    } else {
        const homeDeptSel = document.getElementById('homeDeptSelect');
        if (homeDeptSel && homeDeptSel.selectedOptions.length > 0 && homeDeptSel.value) {
            deptName = homeDeptSel.selectedOptions[0].text;
        }
    }

    const instName = institutionName || appStorage.getItem('institutionName') || 'مؤسستنا';
    const curYear = currentAcademicYear || '';
    const todayStr = new Date().toLocaleDateString('ar-MA', { year: 'numeric', month: 'long', day: 'numeric' });

    // حساب الغيابات
    let absCount = 0;
    if (student && student.id && absences && absences[student.id]) {
        absCount = Array.isArray(absences[student.id]) ? absences[student.id].length : Object.keys(absences[student.id]).length;
    }

    // حساب المعدل والتقدير
    let avgStr = '-';
    let obsStr = '-';
    if (student && student.id && grades && grades[student.id]) {
        const stGrades = grades[student.id];
        let total = 0;
        let count = 0;
        for (const subId in stGrades) {
            const val = parseFloat(stGrades[subId]);
            if (!isNaN(val)) {
                total += val;
                count++;
            }
        }
        if (count > 0) {
            const avg = total / count;
            avgStr = avg.toFixed(2);
            if (typeof getScoreObservation === 'function') {
                obsStr = getScoreObservation(avg);
            }
        }
    }

    msg = msg.replace(/{اسم_التلميذ}/g, sName)
        .replace(/{الاسم}/g, sName)
        .replace(/{القسم}/g, deptName)
        .replace(/{المؤسسة}/g, instName)
        .replace(/{المدرسة}/g, instName)
        .replace(/{السنة_الدراسية}/g, curYear)
        .replace(/{السنة}/g, curYear)
        .replace(/{التاريخ}/g, todayStr)
        .replace(/{عدد_الغياب}/g, String(absCount))
        .replace(/{المعدل_العام}/g, avgStr)
        .replace(/{المعدل}/g, avgStr)
        .replace(/{التقدير}/g, obsStr);

    return msg;
}
window.parseWhatsAppMessage = parseWhatsAppMessage;

// فتح محادثة واتساب مباشرة
function openWhatsAppDirect(phone, message) {
    const formatted = formatWhatsAppPhone(phone);
    if (!formatted || formatted.length < 10) {
        alert('❌ رقم الهاتف غير متوفر أو غير مكتمل.\nتأكد من كتابة الرقم مثل: 0612345678 أو 0712345678');
        return false;
    }
    const encoded = encodeURIComponent(message || '');
    const url = `https://wa.me/${formatted}?text=${encoded}`;
    window.open(url, '_blank');
    return true;
}
window.openWhatsAppDirect = openWhatsAppDirect;

// فتح نافذة التواصل بالواتساب
function openWhatsAppModal(defaultStudentId = null, defaultTab = 'single') {
    const modal = document.getElementById('whatsappModal');
    if (!modal) return;

    loadWhatsAppTemplates();
    switchWhatsAppTab(defaultTab);
    populateWhatsAppSelects(defaultStudentId);
    renderTemplatesList();

    modal.classList.remove('hidden');
    if (typeof feather !== 'undefined') feather.replace();
}
window.openWhatsAppModal = openWhatsAppModal;

function closeWhatsAppModal() {
    const modal = document.getElementById('whatsappModal');
    if (modal) modal.classList.add('hidden');
}
window.closeWhatsAppModal = closeWhatsAppModal;

// التبديل بين تبويبات المراسلة (فردية / جماعية / القوالب)
function switchWhatsAppTab(tabKey) {
    const tabBtns = document.querySelectorAll('.wa-tab-btn');
    const tabPanels = document.querySelectorAll('.wa-tab-panel');

    tabBtns.forEach(btn => {
        if (btn.dataset.tab === tabKey) {
            btn.classList.add('bg-emerald-600', 'text-white', 'shadow-xs');
            btn.classList.remove('text-gray-600', 'hover:bg-gray-100');
        } else {
            btn.classList.remove('bg-emerald-600', 'text-white', 'shadow-xs');
            btn.classList.add('text-gray-600', 'hover:bg-gray-100');
        }
    });

    tabPanels.forEach(panel => {
        if (panel.id === 'waPanel_' + tabKey) {
            panel.classList.remove('hidden');
        } else {
            panel.classList.add('hidden');
        }
    });

    if (tabKey === 'batch') {
        renderBatchRecipientsList();
    } else if (tabKey === 'templates') {
        renderTemplatesList();
    } else if (tabKey === 'single') {
        updateSinglePreview();
    }
}
window.switchWhatsAppTab = switchWhatsAppTab;

// تعبئة القوائم المنسدلة في نافذة المراسلة
function populateWhatsAppSelects(preselectStudentId = null) {
    // 1. أقسام المراسلة الفردية
    const singleDeptSel = document.getElementById('waSingleDeptSelect');
    const singleStudentSel = document.getElementById('waSingleStudentSelect');
    const singleTplSel = document.getElementById('waSingleTemplateSelect');

    // 2. أقسام المراسلة الجماعية
    const batchDeptSel = document.getElementById('waBatchDeptSelect');
    const batchTplSel = document.getElementById('waBatchTemplateSelect');

    if (singleDeptSel) {
        singleDeptSel.innerHTML = '<option value="">-- كل الأقسام --</option>';
        departments.forEach(d => singleDeptSel.appendChild(new Option(d.name, d.id)));
    }
    if (batchDeptSel) {
        batchDeptSel.innerHTML = '<option value="all">🌟 جميع الأقسام المشتركة</option>';
        departments.forEach(d => batchDeptSel.appendChild(new Option(d.name, d.id)));
    }

    // القوالب
    const fillTpls = (sel) => {
        if (!sel) return;
        sel.innerHTML = '<option value="">-- اختر قالباً جاهزاً أو اكتب رسالتك --</option>';
        whatsappTemplates.forEach(t => {
            sel.appendChild(new Option(t.title, t.id));
        });
    };
    fillTpls(singleTplSel);
    fillTpls(batchTplSel);

    // تحديد التلميذ المسبق إن وجد أو تلميذ الصفحة الرئيسية
    let targetStId = preselectStudentId || selectedHomeStudentId;
    if (singleStudentSel) {
        updateSingleStudentsOptions(targetStId);
    }
}

// تحديث قائمة التلاميذ للمراسلة الفردية
function updateSingleStudentsOptions(selectedStId = null) {
    const singleDeptSel = document.getElementById('waSingleDeptSelect');
    const singleStudentSel = document.getElementById('waSingleStudentSelect');
    if (!singleStudentSel) return;

    const deptId = singleDeptSel ? singleDeptSel.value : '';
    let filtered = students.filter(s => !s.isDroppedOut);
    if (deptId) {
        filtered = filtered.filter(s => String(s.deptId) === String(deptId));
    }

    singleStudentSel.innerHTML = '<option value="">-- اختر التلميذ المستهدف --</option>';
    filtered.forEach(s => {
        const phone = getStudentParentPhone(s);
        const hasPhone = !!phone;
        const opt = new Option(`${s.info['الاسم الكامل (بالعربية)'] || 'بدون اسم'} ${hasPhone ? '📱' : '⚠️ (بدون هاتف)'}`, s.id);
        singleStudentSel.appendChild(opt);
    });

    if (selectedStId && filtered.some(s => String(s.id) === String(selectedStId))) {
        singleStudentSel.value = selectedStId;
        const targetStudent = students.find(s => String(s.id) === String(selectedStId));
        if (targetStudent && targetStudent.deptId && singleDeptSel) {
            singleDeptSel.value = targetStudent.deptId;
        }
    } else if (filtered.length > 0) {
        singleStudentSel.value = filtered[0].id;
    }

    onSingleStudentChanged();
}
window.updateSingleStudentsOptions = updateSingleStudentsOptions;

// عند تغيير التلميذ المحدد في المراسلة الفردية
function onSingleStudentChanged() {
    const singleStudentSel = document.getElementById('waSingleStudentSelect');
    const phoneInput = document.getElementById('waSinglePhoneInput');
    const phoneFormattedBadge = document.getElementById('waSinglePhoneFormatted');
    const phoneMissingAlert = document.getElementById('waSinglePhoneMissingAlert');

    const stId = singleStudentSel ? singleStudentSel.value : '';
    const student = students.find(s => String(s.id) === String(stId));

    if (!student) {
        if (phoneInput) phoneInput.value = '';
        if (phoneFormattedBadge) phoneFormattedBadge.textContent = '-';
        if (phoneMissingAlert) phoneMissingAlert.classList.add('hidden');
        updateSinglePreview();
        return;
    }

    const rawPhone = getStudentParentPhone(student);
    if (phoneInput) phoneInput.value = rawPhone;

    const formatted = formatWhatsAppPhone(rawPhone);
    if (formatted) {
        if (phoneFormattedBadge) phoneFormattedBadge.textContent = 'صيغة واتساب: +' + formatted;
        if (phoneMissingAlert) phoneMissingAlert.classList.add('hidden');
    } else {
        if (phoneFormattedBadge) phoneFormattedBadge.textContent = '⚠️ صيغة غير صالحة';
        if (phoneMissingAlert) phoneMissingAlert.classList.remove('hidden');
    }

    updateSinglePreview();
}
window.onSingleStudentChanged = onSingleStudentChanged;

// تحديث معاينة الرسالة الفردية
function updateSinglePreview() {
    const singleStudentSel = document.getElementById('waSingleStudentSelect');
    const singleMsgTextarea = document.getElementById('waSingleMessageText');
    const singlePreviewBox = document.getElementById('waSinglePreviewBox');

    const stId = singleStudentSel ? singleStudentSel.value : '';
    const student = students.find(s => String(s.id) === String(stId));
    const rawTemplate = singleMsgTextarea ? singleMsgTextarea.value : '';

    if (!singlePreviewBox) return;

    if (!rawTemplate.trim()) {
        singlePreviewBox.innerHTML = '<span class="text-gray-400 italic">اكتب رسالتك أو اختر قالباً أعلاه لتظهر المعاينة هنا...</span>';
        return;
    }

    const parsed = parseWhatsAppMessage(rawTemplate, student);
    // تنسيق الرموز الغامقة *نص*
    const formattedHtml = parsed
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\*(.*?)\*/g, '<strong class="font-extrabold text-emerald-900">$1</strong>')
        .replace(/\n/g, '<br>');

    singlePreviewBox.innerHTML = formattedHtml;
}
window.updateSinglePreview = updateSinglePreview;

// عند اختيار قالب في المراسلة الفردية
function onSingleTemplateSelected() {
    const singleTplSel = document.getElementById('waSingleTemplateSelect');
    const singleMsgTextarea = document.getElementById('waSingleMessageText');
    if (!singleTplSel || !singleMsgTextarea) return;

    const tplId = singleTplSel.value;
    const tpl = whatsappTemplates.find(t => t.id === tplId);
    if (tpl) {
        singleMsgTextarea.value = tpl.text;
    }
    updateSinglePreview();
}
window.onSingleTemplateSelected = onSingleTemplateSelected;

// إرسال الرسالة الفردية
function sendSingleWhatsApp() {
    const singleStudentSel = document.getElementById('waSingleStudentSelect');
    const phoneInput = document.getElementById('waSinglePhoneInput');
    const singleMsgTextarea = document.getElementById('waSingleMessageText');

    const stId = singleStudentSel ? singleStudentSel.value : '';
    const student = students.find(s => String(s.id) === String(stId));
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const rawMsg = singleMsgTextarea ? singleMsgTextarea.value.trim() : '';

    if (!student) {
        alert('❌ يرجى اختيار التلميذ أولاً.');
        return;
    }
    if (!phone) {
        alert('❌ يرجى إدخال رقم هاتف ولي الأمر (مثال: 0612345678).');
        return;
    }
    if (!rawMsg) {
        alert('❌ يرجى كتابة نص الرسالة أو اختيار قالب جاهز.');
        return;
    }

    // إذا تم تعديل رقم الهاتف في الخانة، نقوم بتحديثه في معلومات التلميذ تلقائياً
    const currentPhone = getStudentParentPhone(student);
    if (phone !== currentPhone) {
        student.info['هاتف ولي الأمر'] = phone;
        saveAll();
    }

    const finalMessage = parseWhatsAppMessage(rawMsg, student);
    const opened = openWhatsAppDirect(phone, finalMessage);
    if (opened) {
        console.log(`WhatsApp chat opened for ${student.info['الاسم الكامل (بالعربية)']}`);
    }
}
window.sendSingleWhatsApp = sendSingleWhatsApp;

// فتح واتساب مباشرة للتلميذ المحدد في لوحة التحكم
function openWhatsAppForCurrentStudent() {
    if (!selectedHomeStudentId) {
        alert('يرجى اختيار تلميذ أولاً من القائمة.');
        return;
    }
    openWhatsAppModal(selectedHomeStudentId, 'single');
}
window.openWhatsAppForCurrentStudent = openWhatsAppForCurrentStudent;

// ------------------------------------------------------------
// --- المراسلة الجماعية وحسب القسم (Batch / Class Messaging) ---
// ------------------------------------------------------------

function onBatchTemplateSelected() {
    const batchTplSel = document.getElementById('waBatchTemplateSelect');
    const batchMsgTextarea = document.getElementById('waBatchMessageText');
    if (!batchTplSel || !batchMsgTextarea) return;

    const tplId = batchTplSel.value;
    const tpl = whatsappTemplates.find(t => t.id === tplId);
    if (tpl) {
        batchMsgTextarea.value = tpl.text;
    }
    renderBatchRecipientsList();
}
window.onBatchTemplateSelected = onBatchTemplateSelected;

// عرض قائمة المستلمين للمراسلة الجماعية
function renderBatchRecipientsList() {
    const batchDeptSel = document.getElementById('waBatchDeptSelect');
    const listEl = document.getElementById('waBatchRecipientsList');
    const countBadge = document.getElementById('waBatchReadyCount');
    const missingBadge = document.getElementById('waBatchMissingCount');
    if (!listEl) return;

    const deptId = batchDeptSel ? batchDeptSel.value : 'all';
    let targetStudents = students.filter(s => !s.isDroppedOut);
    if (deptId && deptId !== 'all') {
        targetStudents = targetStudents.filter(s => String(s.deptId) === String(deptId));
    }

    if (targetStudents.length === 0) {
        listEl.innerHTML = '<p class="text-gray-400 text-xs text-center py-6">لا يوجد تلاميذ في هذا القسم.</p>';
        if (countBadge) countBadge.textContent = '0 قابل للمراسلة';
        if (missingBadge) missingBadge.textContent = '0 بدون هاتف';
        return;
    }

    let readyCount = 0;
    let missingCount = 0;

    listEl.innerHTML = '';
    targetStudents.forEach((student, index) => {
        const rawPhone = getStudentParentPhone(student);
        const formatted = formatWhatsAppPhone(rawPhone);
        const hasPhone = !!formatted;

        if (hasPhone) readyCount++;
        else missingCount++;

        const deptObj = departments.find(d => String(d.id) === String(student.deptId));
        const deptTitle = deptObj ? deptObj.name : '-';

        const row = document.createElement('div');
        row.className = `flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-xl border text-xs gap-2 transition-colors ${
            hasPhone ? 'bg-white hover:bg-emerald-50/60 border-gray-200' : 'bg-rose-50/60 border-rose-200'
        }`;
        row.id = `wa_batch_row_${student.id}`;

        row.innerHTML = `
            <div class="flex items-center gap-3">
                <input type="checkbox" value="${student.id}" class="wa-batch-cb accent-emerald-600 w-4 h-4 cursor-pointer" ${hasPhone ? 'checked' : 'disabled'}>
                <div>
                    <span class="font-bold text-gray-800 text-sm">${student.info['الاسم الكامل (بالعربية)'] || 'بدون اسم'}</span>
                    <span class="text-indigo-600 font-medium text-[11px] mr-2">📚 ${deptTitle}</span>
                    <div class="flex items-center gap-2 mt-0.5">
                        ${hasPhone
                            ? `<span class="text-emerald-700 font-mono font-bold">📱 ${rawPhone} <span class="text-gray-400 font-normal text-[10px]">(+${formatted})</span></span>`
                            : `<span class="text-rose-600 font-bold flex items-center gap-1">⚠️ رقم الهاتف غير مسجل</span>`
                        }
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <span id="wa_status_${student.id}" class="text-[10px] font-bold px-2 py-0.5 rounded-full ${hasPhone ? 'bg-slate-100 text-slate-600' : 'bg-rose-100 text-rose-700'}">
                    ${hasPhone ? '⏳ بانتظار الإرسال' : 'غير متاح'}
                </span>
                ${hasPhone
                    ? `<button type="button" onclick="sendBatchItemDirect('${student.id}')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-2xs">
                        <span>💬 إرسال</span>
                       </button>`
                    : `<button type="button" onclick="promptAddPhoneForStudent('${student.id}')" class="bg-amber-500 hover:bg-amber-600 text-white font-bold px-2.5 py-1 rounded-lg text-[11px]">
                        ➕ تسجيل رقم
                       </button>`
                }
            </div>
        `;
        listEl.appendChild(row);
    });

    if (countBadge) countBadge.textContent = `${readyCount} جاهز للمراسلة`;
    if (missingBadge) missingBadge.textContent = `${missingCount} بدون هاتف`;
}
window.renderBatchRecipientsList = renderBatchRecipientsList;

function toggleSelectAllBatch(checked) {
    document.querySelectorAll('.wa-batch-cb:not(:disabled)').forEach(cb => {
        cb.checked = checked;
    });
}
window.toggleSelectAllBatch = toggleSelectAllBatch;

// إرسال مباشر لتلميذ واحد من داخل قائمة القسم
function sendBatchItemDirect(studentId) {
    const student = students.find(s => String(s.id) === String(studentId));
    if (!student) return;

    const phone = getStudentParentPhone(student);
    const batchMsgTextarea = document.getElementById('waBatchMessageText');
    const rawMsg = batchMsgTextarea ? batchMsgTextarea.value.trim() : '';

    if (!rawMsg) {
        alert('❌ يرجى كتابة نص الرسالة الجماعية أو اختيار قالب أولاً.');
        return;
    }

    const finalMsg = parseWhatsAppMessage(rawMsg, student);
    const opened = openWhatsAppDirect(phone, finalMsg);
    if (opened) {
        markBatchItemSent(studentId);
    }
}
window.sendBatchItemDirect = sendBatchItemDirect;

function markBatchItemSent(studentId) {
    const statusEl = document.getElementById(`wa_status_${studentId}`);
    const rowEl = document.getElementById(`wa_batch_row_${studentId}`);
    if (statusEl) {
        statusEl.textContent = '✅ تم الإرسال';
        statusEl.className = 'text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800';
    }
    if (rowEl) {
        rowEl.classList.add('bg-emerald-50/50');
    }
}

// نافذة سريعة لتسجيل رقم هاتف لتلميذ ينقصه الرقم
function promptAddPhoneForStudent(studentId) {
    const student = students.find(s => String(s.id) === String(studentId));
    if (!student) return;

    const sName = student.info['الاسم الكامل (بالعربية)'] || 'التلميذ';
    const newPhone = prompt(`أدخل رقم هاتف ولي أمر التلميذ(ة) "${sName}":\n(مثال: 0612345678 أو 0712345678)`);
    if (newPhone && newPhone.trim()) {
        student.info['هاتف ولي الأمر'] = newPhone.trim();
        saveAll();
        renderBatchRecipientsList();
    }
}
window.promptAddPhoneForStudent = promptAddPhoneForStudent;

// طابور الإرسال التتابعي السلس (Step-by-Step WhatsApp Queue)
function startBatchQueue() {
    const batchMsgTextarea = document.getElementById('waBatchMessageText');
    const rawMsg = batchMsgTextarea ? batchMsgTextarea.value.trim() : '';
    if (!rawMsg) {
        alert('❌ يرجى كتابة نص الرسالة أو اختيار قالب أولاً.');
        return;
    }

    const checkedBoxes = Array.from(document.querySelectorAll('.wa-batch-cb:checked'));
    if (checkedBoxes.length === 0) {
        alert('❌ يرجى تحديد تلميذ واحد على الأقل للمراسلة.');
        return;
    }

    batchSendingQueue = checkedBoxes.map(cb => cb.value);
    batchCurrentIndex = 0;

    openQueueModal();
}
window.startBatchQueue = startBatchQueue;

function openQueueModal() {
    const qModal = document.getElementById('waQueueModal');
    if (!qModal) return;
    qModal.classList.remove('hidden');
    renderCurrentQueueStep();
}
window.openQueueModal = openQueueModal;

function closeQueueModal() {
    const qModal = document.getElementById('waQueueModal');
    if (qModal) qModal.classList.add('hidden');
    renderBatchRecipientsList();
}
window.closeQueueModal = closeQueueModal;

function renderCurrentQueueStep() {
    if (batchCurrentIndex < 0 || batchCurrentIndex >= batchSendingQueue.length) {
        document.getElementById('waQueueContent').innerHTML = `
            <div class="text-center py-6">
                <span class="text-4xl">🎉</span>
                <h4 class="text-lg font-bold text-emerald-700 mt-2">اكتمل إرسال جميع الرسائل!</h4>
                <p class="text-xs text-gray-500 mt-1">تمت مراسلة جميع أولياء الأمور المحددين بنجاح.</p>
                <button type="button" onclick="closeQueueModal()" class="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-xl text-xs">
                    إغلاق
                </button>
            </div>
        `;
        return;
    }

    const studentId = batchSendingQueue[batchCurrentIndex];
    const student = students.find(s => String(s.id) === String(studentId));
    if (!student) {
        batchCurrentIndex++;
        renderCurrentQueueStep();
        return;
    }

    const sName = student.info['الاسم الكامل (بالعربية)'] || 'بدون اسم';
    const rawPhone = getStudentParentPhone(student);
    const formatted = formatWhatsAppPhone(rawPhone);
    const dept = departments.find(d => String(d.id) === String(student.deptId))?.name || '-';

    const batchMsgTextarea = document.getElementById('waBatchMessageText');
    const rawMsg = batchMsgTextarea ? batchMsgTextarea.value.trim() : '';
    const finalMsg = parseWhatsAppMessage(rawMsg, student);

    const progressPercent = Math.round(((batchCurrentIndex) / batchSendingQueue.length) * 100);

    document.getElementById('waQueueContent').innerHTML = `
        <div class="space-y-4">
            <!-- شريط التقدم -->
            <div>
                <div class="flex justify-between items-center text-xs font-bold text-gray-600 mb-1">
                    <span>التقدم: تلميذ ${batchCurrentIndex + 1} من ${batchSendingQueue.length}</span>
                    <span>${progressPercent}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div class="bg-emerald-500 h-2 transition-all duration-300" style="width: ${progressPercent}%"></div>
                </div>
            </div>

            <!-- بطاقة التلميذ الحالي -->
            <div class="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4">
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-extrabold text-gray-900 text-base">${sName}</h4>
                        <p class="text-xs text-indigo-700 font-medium">القسم: ${dept}</p>
                    </div>
                    <span class="bg-emerald-200 text-emerald-900 text-xs font-mono font-bold px-2.5 py-1 rounded-lg">
                        📱 ${rawPhone} (+${formatted})
                    </span>
                </div>
            </div>

            <!-- معاينة الرسالة -->
            <div>
                <label class="block text-xs font-bold text-gray-700 mb-1">الرسالة المخصصة لولي الأمر:</label>
                <div class="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap font-sans">
                    ${finalMsg.replace(/\*(.*?)\*/g, '<strong>$1</strong>')}
                </div>
            </div>

            <!-- أزرار الإرسال والتخطي -->
            <div class="flex justify-between items-center gap-3 pt-2">
                <button type="button" onclick="skipQueueStep()" class="text-gray-500 hover:text-gray-700 text-xs font-bold px-3 py-2">
                    تخطي هذا التلميذ ⏭️
                </button>
                <button type="button" onclick="executeQueueStep('${student.id}', '${rawPhone}')" class="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition-transform active:scale-95">
                    <span>🚀 إرسال عبر واتساب والانتقال للتالي</span>
                </button>
            </div>
        </div>
    `;
}

function executeQueueStep(studentId, phone) {
    const student = students.find(s => String(s.id) === String(studentId));
    if (!student) return;

    const batchMsgTextarea = document.getElementById('waBatchMessageText');
    const rawMsg = batchMsgTextarea ? batchMsgTextarea.value.trim() : '';
    const finalMsg = parseWhatsAppMessage(rawMsg, student);

    openWhatsAppDirect(phone, finalMsg);
    markBatchItemSent(studentId);

    batchCurrentIndex++;
    renderCurrentQueueStep();
}
window.executeQueueStep = executeQueueStep;

function skipQueueStep() {
    batchCurrentIndex++;
    renderCurrentQueueStep();
}
window.skipQueueStep = skipQueueStep;

// ------------------------------------------------------------
// --- تصدير أرقام أولياء الأمور كملف جهات اتصال (VCF Card) ---
// ------------------------------------------------------------

function exportParentsVCard() {
    const batchDeptSel = document.getElementById('waBatchDeptSelect');
    const deptId = batchDeptSel ? batchDeptSel.value : 'all';

    let targetStudents = students.filter(s => !s.isDroppedOut);
    let fileNameDept = 'جميع_الأقسام';
    if (deptId && deptId !== 'all') {
        targetStudents = targetStudents.filter(s => String(s.deptId) === String(deptId));
        const d = departments.find(x => String(x.id) === String(deptId));
        if (d) fileNameDept = d.name.replace(/\s+/g, '_');
    }

    const studentsWithPhone = targetStudents.filter(s => !!getStudentParentPhone(s));
    if (studentsWithPhone.length === 0) {
        alert('لا يوجد أي تلميذ يتوفر على رقم هاتف لتصديره.');
        return;
    }

    let vcfContent = '';
    studentsWithPhone.forEach(s => {
        const sName = s.info['الاسم الكامل (بالعربية)'] || 'تلميذ';
        const rawPhone = getStudentParentPhone(s);
        const formatted = formatWhatsAppPhone(rawPhone);
        const dept = departments.find(d => String(d.id) === String(s.deptId))?.name || '';
        const inst = institutionName || 'مؤسستنا';

        vcfContent += 'BEGIN:VCARD\r\n';
        vcfContent += 'VERSION:3.0\r\n';
        vcfContent += `FN:ولي أمر ${sName} (${dept})\r\n`;
        vcfContent += `N:;ولي أمر ${sName};;;;\r\n`;
        vcfContent += `TEL;TYPE=CELL,VOICE:+${formatted}\r\n`;
        vcfContent += `ORG:${inst};${dept}\r\n`;
        vcfContent += `NOTE:تلميذ(ة): ${sName} - قسم: ${dept} - سنة: ${currentAcademicYear || ''}\r\n`;
        vcfContent += 'END:VCARD\r\n';
    });

    const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `أولياء_أمور_${fileNameDept}_${currentAcademicYear ? currentAcademicYear.replace('/', '-') : '2026'}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(`🎉 تم تصدير ${studentsWithPhone.length} جهة اتصال بنجاح بصيغة VCF!\nيمكنك فتح الملف في هاتفك لحفظ جميع الأرقام فوراً بالأسماء وإنشاء مجموعة واتساب بسهولة.`);
}
window.exportParentsVCard = exportParentsVCard;

// ------------------------------------------------------------
// --- إدارة القوالب (Templates Management) ---
// ------------------------------------------------------------

function renderTemplatesList() {
    const listEl = document.getElementById('waTemplatesList');
    if (!listEl) return;

    if (whatsappTemplates.length === 0) {
        listEl.innerHTML = '<p class="text-gray-400 text-xs text-center py-4">لا توجد قوالب حالياً. أضف قالباً جديداً أدناه.</p>';
        return;
    }

    listEl.innerHTML = '';
    whatsappTemplates.forEach((tpl, index) => {
        const card = document.createElement('div');
        card.className = 'p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2';
        card.innerHTML = `
            <div class="flex justify-between items-center">
                <span class="font-bold text-xs text-gray-800">${tpl.title}</span>
                <div class="flex gap-1.5">
                    <button type="button" onclick="editTemplate('${tpl.id}')" class="text-indigo-600 hover:text-indigo-800 text-xs font-bold px-2 py-0.5 bg-indigo-50 rounded-md">✏️ تعديل</button>
                    <button type="button" onclick="deleteTemplate('${tpl.id}')" class="text-red-600 hover:text-red-800 text-xs font-bold px-2 py-0.5 bg-red-50 rounded-md">🗑️ حذف</button>
                </div>
            </div>
            <p class="text-[11px] text-gray-600 line-clamp-2 leading-relaxed whitespace-pre-wrap">${tpl.text}</p>
        `;
        listEl.appendChild(card);
    });
}
window.renderTemplatesList = renderTemplatesList;

function insertTagIntoTextarea(tag) {
    const textarea = document.getElementById('waTplFormText');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    textarea.value = text.substring(0, start) + tag + text.substring(end);
    textarea.focus();
    textarea.selectionStart = textarea.selectionEnd = start + tag.length;
}
window.insertTagIntoTextarea = insertTagIntoTextarea;

function saveTemplateForm() {
    const idInput = document.getElementById('waTplFormId');
    const titleInput = document.getElementById('waTplFormTitle');
    const textInput = document.getElementById('waTplFormText');

    const id = idInput ? idInput.value : '';
    const title = titleInput ? titleInput.value.trim() : '';
    const text = textInput ? textInput.value.trim() : '';

    if (!title || !text) {
        alert('الرجاء كتابة عنوان القالب ونص الرسالة.');
        return;
    }

    if (id) {
        const existing = whatsappTemplates.find(t => t.id === id);
        if (existing) {
            existing.title = title;
            existing.text = text;
        }
    } else {
        whatsappTemplates.push({
            id: 'tpl_' + Date.now(),
            title: title,
            text: text,
            category: 'custom'
        });
    }

    saveWhatsAppTemplates();
    resetTemplateForm();
    renderTemplatesList();
    populateWhatsAppSelects();
    alert('✅ تم حفظ القالب بنجاح.');
}
window.saveTemplateForm = saveTemplateForm;

function editTemplate(id) {
    const tpl = whatsappTemplates.find(t => t.id === id);
    if (!tpl) return;

    document.getElementById('waTplFormId').value = tpl.id;
    document.getElementById('waTplFormTitle').value = tpl.title;
    document.getElementById('waTplFormText').value = tpl.text;
    document.getElementById('waTplFormTitleHeading').textContent = '✏️ تعديل القالب: ' + tpl.title;
    document.getElementById('waTplCancelBtn').classList.remove('hidden');

    document.getElementById('waTplFormTitle').focus();
}
window.editTemplate = editTemplate;

function resetTemplateForm() {
    document.getElementById('waTplFormId').value = '';
    document.getElementById('waTplFormTitle').value = '';
    document.getElementById('waTplFormText').value = '';
    document.getElementById('waTplFormTitleHeading').textContent = '➕ إضافة قالب جديد';
    document.getElementById('waTplCancelBtn').classList.add('hidden');
}
window.resetTemplateForm = resetTemplateForm;

function deleteTemplate(id) {
    if (!confirm('هل أنت متأكد من حذف هذا القالب؟')) return;
    whatsappTemplates = whatsappTemplates.filter(t => t.id !== id);
    saveWhatsAppTemplates();
    renderTemplatesList();
    populateWhatsAppSelects();
}
window.deleteTemplate = deleteTemplate;

// استعادة القوالب الافتراضية
function restoreDefaultTemplates() {
    if (!confirm('هل تريد استعادة جميع القوالب الافتراضية؟')) return;
    whatsappTemplates = [...DEFAULT_WA_TEMPLATES];
    saveWhatsAppTemplates();
    renderTemplatesList();
    populateWhatsAppSelects();
    alert('✅ تمت استعادة القوالب الافتراضية.');
}
window.restoreDefaultTemplates = restoreDefaultTemplates;

function setupWhatsAppEventListeners() {
    const singleDeptSel = document.getElementById('waSingleDeptSelect');
    if (singleDeptSel) {
        singleDeptSel.addEventListener('change', () => updateSingleStudentsOptions());
    }

    const singleStudentSel = document.getElementById('waSingleStudentSelect');
    if (singleStudentSel) {
        singleStudentSel.addEventListener('change', onSingleStudentChanged);
    }

    const singlePhoneInput = document.getElementById('waSinglePhoneInput');
    if (singlePhoneInput) {
        singlePhoneInput.addEventListener('input', () => {
            const formatted = formatWhatsAppPhone(singlePhoneInput.value);
            const badge = document.getElementById('waSinglePhoneFormatted');
            if (badge) {
                badge.textContent = formatted ? ('صيغة واتساب: +' + formatted) : '⚠️ صيغة غير صالحة';
            }
        });
    }

    const singleMsgTextarea = document.getElementById('waSingleMessageText');
    if (singleMsgTextarea) {
        singleMsgTextarea.addEventListener('input', updateSinglePreview);
    }

    const batchDeptSel = document.getElementById('waBatchDeptSelect');
    if (batchDeptSel) {
        batchDeptSel.addEventListener('change', renderBatchRecipientsList);
    }
}

// تهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initWhatsApp, 400);
});
