// ============================================================
// === 16. وظائف الطباعة (Printing Engine) ===
// ============================================================

// طباعة النتيجة المدرسية الفردية للتلميذ المختار
function printNewReport() {
    const studentId = selectedHomeStudentId;
    if (!studentId) return;
    if (typeof saveReportCard === 'function') saveReportCard(studentId);

    const sheetEl = document.getElementById('sheet');
    if (!sheetEl) return;
    const sheet = sheetEl.cloneNode(true);

    sheet.querySelectorAll('.resize-handle, .delete-image-btn, .session-avg-reset, #finalAvgReset, .manual-grade-notice, #manualGradeNotice, .print\\:hidden, .print-hidden').forEach(el => {
        el.remove();
    });

    const originalTeacherNoteSelect = document.querySelector('#sheet [data-field="teacher_notes_select"]');
    const clonedTeacherNoteContainer = sheet.querySelector('[data-field="teacher_notes_select"]')?.parentElement;

    if (originalTeacherNoteSelect && clonedTeacherNoteContainer) {
        const text = document.createElement('span');
        if (originalTeacherNoteSelect.value === 'custom') {
            const originalCustomTextarea = document.querySelector('#sheet [data-field="teacher_notes_custom"]');
            text.textContent = originalCustomTextarea ? originalCustomTextarea.value : '';
        } else {
            text.textContent = originalTeacherNoteSelect.value;
        }
        clonedTeacherNoteContainer.parentElement.innerHTML = `<strong>ملاحظات الأستاذ(ة):</strong><br>${text.textContent}`;
    }

    sheet.querySelectorAll('input[type="number"], input[type="text"], textarea').forEach(input => {
        const text = document.createElement('span');
        text.textContent = input.value;
        input.parentNode.replaceChild(text, input);
    });

    const finalAverageSelect = sheet.querySelector('#finalAverageLabelSelect');
    if (finalAverageSelect) {
        const text = document.createElement('span');
        text.textContent = finalAverageSelect.options[finalAverageSelect.selectedIndex]?.text || '';
        finalAverageSelect.parentNode.replaceChild(text, finalAverageSelect);
    }

    sheet.querySelectorAll('.observation-cell').forEach(cell => {
        cell.innerHTML = cell.textContent;
    });

    const content = sheet.innerHTML;
    const win = window.open('', '', 'width=900,height=700');
    win.document.write(`
        <html dir="rtl"><head>
            <title>النتيجة المدرسية</title>
            <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
            <style>
                @page {
                    size: A4;
                    margin: 0;
                }
                body { 
                    font-family: 'Tajawal', sans-serif; 
                    margin: 0; 
                    -webkit-print-color-adjust: exact; 
                    print-color-adjust: exact;
                }
                .page { 
                    width: 210mm;
                    height: 297mm;
                    margin: 0; 
                    padding: 10mm;
                    box-sizing: border-box;
                    background: #fff; 
                    position: relative; 
                    display: flex;
                    flex-direction: column;
                }
                .page > * { flex-shrink: 0; }
                .page > .main-report-table { flex-grow: 1; }

                h2 { font-size: 18px !important; margin-bottom: 8px !important; }
                h3 { font-size: 14px !important; padding: 5px 10px !important; margin-top: 10px !important; margin-bottom: 8px !important; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 8px !important; }
                th, td { border: 1px solid #ddd; padding: 5px !important; text-align: right; font-size: 12px !important; vertical-align: middle; }
                div, p, span, strong, label { font-size: 12px !important; }
                #reportCardStudentImage { width: 90px !important; height: 90px !important; }
                .main-report-table th, .main-report-table td { text-align: center; }
                .main-report-table td[rowspan] { font-size: 14px !important; }
                .draggable { position: absolute; user-select: none; }
                .resize-handle, .editable[placeholder]:empty:before, .manual-grade-notice, #manualGradeNotice, .print-hidden, .print\\:hidden, [class*="print:hidden"] { display: none !important; }
            </style>
        </head><body>
            <div class="page">${content}</div>
            <script>
window.onload = function() { window.print(); window.close(); }<\/script>
        </body></html>
    `);
    win.document.close();
}

// طباعة جميع تقارير المستوى
async function printAllLevelReports() {
    const homeDeptSelect = document.getElementById("homeDeptSelect");
    const deptId = homeDeptSelect ? homeDeptSelect.value : "";
    if (!deptId) return alert("الرجاء اختيار قسم أولاً");

    const levelStudents = students.filter(s => String(s.deptId) === String(deptId) && !s.isDroppedOut);
    if (levelStudents.length === 0) return alert("القسم المختار لا يحتوي على تلاميذ");

    if (!confirm(`هل تريد طباعة تقارير ${levelStudents.length} تلميذ(ة) في هذا القسم؟`)) return;

    const win = window.open('', '', 'width=900,height=700');
    win.document.write(`
        <html dir="rtl"><head>
            <title>طباعة تقارير القسم</title>
            <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
            <style>
                @page { 
                    size: A4; 
                    margin: 0; 
                }
                body { 
                    font-family: 'Tajawal', sans-serif; 
                    margin: 0; 
                    padding: 0;
                    -webkit-print-color-adjust: exact; 
                    print-color-adjust: exact;
                }
                .page-break { 
                    page-break-after: always; 
                    break-after: page; 
                    page-break-inside: avoid;
                    break-inside: avoid;
                    border-bottom: 2px dashed #ccc; 
                    margin-bottom: 20px; 
                }
                @media print { 
                    .page-break { 
                        border: none; 
                        margin-bottom: 0; 
                    } 
                }
                .page { 
                    width: 210mm;
                    height: 297mm;
                    margin: 0 auto; 
                    padding: 10mm;
                    box-sizing: border-box;
                    background: #fff; 
                    position: relative; 
                    display: flex;
                    flex-direction: column;
                }
                .page > * { flex-shrink: 0; }
                .page > .main-report-table { flex-grow: 1; }

                h2 { font-size: 18px !important; margin-bottom: 8px !important; }
                h3 { font-size: 14px !important; padding: 5px 10px !important; margin-top: 10px !important; margin-bottom: 8px !important; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 8px !important; }
                th, td { border: 1px solid #ddd; padding: 5px !important; text-align: right; font-size: 12px !important; vertical-align: middle; }
                div, p, span, strong, label { font-size: 12px !important; }
                #reportCardStudentImage { width: 90px !important; height: 90px !important; }
                .main-report-table th, .main-report-table td { text-align: center; }
                .main-report-table td[rowspan] { font-size: 14px !important; }
                .draggable { position: absolute; user-select: none; }
                .resize-handle, .delete-image-btn, .editable[placeholder]:empty:before, .manual-grade-notice, #manualGradeNotice, .print-hidden, .print\\:hidden, [class*="print:hidden"] { display: none !important; }
            </style>
        </head><body>
        <div id="print-container"></div>
        </body></html>
    `);

    const container = win.document.getElementById('print-container');

    for (let student of levelStudents) {
        selectHomeStudent(student.id);

        const sheetEl = document.getElementById('sheet');
        const sheetClone = sheetEl.cloneNode(true);

        sheetClone.querySelectorAll('.resize-handle, .delete-image-btn, .session-avg-reset, #finalAvgReset, .manual-grade-notice, #manualGradeNotice, .print\\:hidden, .print-hidden').forEach(el => el.remove());

        const originalTeacherNoteSelect = document.querySelector('#sheet [data-field="teacher_notes_select"]');
        const clonedTeacherNoteContainer = sheetClone.querySelector('[data-field="teacher_notes_select"]')?.parentElement;

        if (originalTeacherNoteSelect && clonedTeacherNoteContainer) {
            const text = win.document.createElement('span');
            if (originalTeacherNoteSelect.value === 'custom') {
                const originalCustomTextarea = document.querySelector('#sheet [data-field="teacher_notes_custom"]');
                text.textContent = originalCustomTextarea ? originalCustomTextarea.value : '';
            } else {
                text.textContent = originalTeacherNoteSelect.value;
            }
            clonedTeacherNoteContainer.parentElement.innerHTML = `<strong>ملاحظات الأستاذ(ة):</strong><br>${text.textContent}`;
        }

        sheetClone.querySelectorAll('input[type="number"], input[type="text"], textarea').forEach(input => {
            const text = win.document.createElement('span');
            text.textContent = input.value;
            input.parentNode.replaceChild(text, input);
        });

        const finalAverageSelect = sheetClone.querySelector('#finalAverageLabelSelect');
        if (finalAverageSelect) {
            const text = win.document.createElement('span');
            text.textContent = finalAverageSelect.options[finalAverageSelect.selectedIndex]?.text || '';
            finalAverageSelect.parentNode.replaceChild(text, finalAverageSelect);
        }

        sheetClone.querySelectorAll('.observation-cell').forEach(cell => {
            cell.innerHTML = cell.textContent;
        });

        const pageDiv = win.document.createElement('div');
        pageDiv.className = 'page page-break';
        pageDiv.innerHTML = sheetClone.innerHTML;
        container.appendChild(pageDiv);
    }

    win.document.close();
    win.focus();
    setTimeout(() => {
        win.print();
        win.close();
        if (selectedHomeStudentId) selectHomeStudent(selectedHomeStudentId);
    }, 1000);
}

// طباعة وصل الأداء الشهري
// طباعة وصل الأداء الشهري (نسختين على ورقة A5 مع خط تقطيع منقّط ومقص)
window.printPaymentReceipt = function (studentId, dutyOrMonth, amount) {
    const student = students.find(s => String(s.id) === String(studentId));
    if (!student) return;
    const dept = departments.find(d => String(d.id) === String(student.deptId));
    const today = new Date().toLocaleDateString('ar-MA', { year: 'numeric', month: 'long', day: 'numeric' });
    const sName = student.info['الاسم الكامل (بالعربية)'] || 'تلميذ';
    const deptName = dept?.name || '-';
    const receiptNo = (Date.now() % 100000).toString().padStart(5, '0');

    const ALL_MONTHS = ["شتنبر", "أكتوبر", "نونبر", "دجنبر", "يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو", "يوليوز", "غشت"];
    const isMonth = ALL_MONTHS.includes(dutyOrMonth);
    const itemLabel = isMonth ? `أداء شهر: ${dutyOrMonth}` : `نوع الواجب / الأداء: ${dutyOrMonth}`;

    const instTitle = (typeof currentSession !== 'undefined' && currentSession && currentSession.institution)
        ? currentSession.institution.replace(/\n/g, '<br>')
        : (institutionName || 'المؤسسة التعليمية');

    const renderBlock = (copyTitle, isParentCopy) => `
        <div class="receipt-box ${isParentCopy ? 'parent-copy' : 'admin-copy'}">
            <div class="receipt-header">
                <div class="inst-info">
                    <h3 class="inst-name">${instTitle}</h3>
                    <p class="receipt-subtitle">وصل استلام أداء ومستحقات دراسية</p>
                </div>
                <div class="receipt-meta">
                    <span class="copy-badge ${isParentCopy ? 'badge-parent' : 'badge-admin'}">${copyTitle}</span>
                    <span class="receipt-no">وصل رقم: #${receiptNo}</span>
                </div>
            </div>

            <div class="receipt-grid">
                <div class="grid-item"><span>التلميذ(ة):</span> <strong>${sName}</strong></div>
                <div class="grid-item"><span>القسم:</span> <strong>${deptName}</strong></div>
                <div class="grid-item"><span>السنة الدراسية:</span> <strong>${currentAcademicYear || '-'}</strong></div>
                <div class="grid-item"><span>تاريخ الأداء:</span> <strong>${today}</strong></div>
            </div>

            <div class="receipt-highlight">
                <div class="duty-name">
                    <span class="icon">${isMonth ? '📅' : '💳'}</span>
                    <span><strong>${itemLabel}</strong></span>
                </div>
                <div class="amount-wrap">
                    <span class="amount-label">المبلغ المؤدى:</span>
                    <span class="amount-val">${amount}</span>
                </div>
            </div>

            <div class="receipt-footer">
                <div class="sign-col">
                    <span>توقيع ولي الأمر:</span>
                    <div class="dots">...........................</div>
                </div>
                <div class="sign-col" style="text-align: left;">
                    <span>خاتم وتوقيع الإدارة:</span>
                    <div class="dots">...........................</div>
                </div>
            </div>
        </div>
    `;

    const win = window.open('', '', 'width=650,height=750');
    win.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="utf-8">
            <title>وصل أداء #${receiptNo} - ${sName}</title>
            <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;600;700;800;900&display=swap" rel="stylesheet">
            <style>
                @page {
                    size: A5 portrait;
                    margin: 5mm 6mm;
                }
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }
                body {
                    font-family: 'Tajawal', sans-serif;
                    background: #fff;
                    color: #0f172a;
                    width: 100%;
                    padding: 0;
                }
                .sheet {
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                    height: 100%;
                }
                .receipt-box {
                    border: 1.5px solid #0d9488;
                    border-radius: 8px;
                    padding: 10px 14px;
                    background: #ffffff;
                }
                .admin-copy {
                    border-color: #6366f1;
                }
                .receipt-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1.5px solid #e2e8f0;
                    padding-bottom: 6px;
                    margin-bottom: 6px;
                }
                .inst-name {
                    font-size: 13.5px;
                    font-weight: 800;
                    color: #0f766e;
                    line-height: 1.2;
                }
                .admin-copy .inst-name {
                    color: #4338ca;
                }
                .receipt-subtitle {
                    font-size: 9.5px;
                    color: #64748b;
                    margin-top: 2px;
                }
                .receipt-meta {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    gap: 3px;
                }
                .copy-badge {
                    font-size: 9px;
                    font-weight: 800;
                    padding: 2.5px 8px;
                    border-radius: 4px;
                    color: #fff;
                }
                .badge-parent {
                    background: #0d9488;
                }
                .badge-admin {
                    background: #4f46e5;
                }
                .receipt-no {
                    font-size: 9px;
                    font-family: monospace;
                    font-weight: bold;
                    color: #64748b;
                }
                .receipt-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 3px 12px;
                    font-size: 11px;
                    margin-bottom: 6px;
                }
                .grid-item span {
                    color: #64748b;
                    font-size: 10px;
                }
                .grid-item strong {
                    color: #0f172a;
                    font-weight: 700;
                }
                .receipt-highlight {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #f0fdfa;
                    border: 1px dashed #0d9488;
                    border-radius: 6px;
                    padding: 6px 12px;
                    margin: 6px 0;
                }
                .admin-copy .receipt-highlight {
                    background: #eef2ff;
                    border-color: #6366f1;
                }
                .duty-name {
                    font-size: 11.5px;
                    color: #0f766e;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                .admin-copy .duty-name {
                    color: #4338ca;
                }
                .amount-wrap {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .amount-label {
                    font-size: 10.5px;
                    font-weight: 700;
                    color: #334155;
                }
                .amount-val {
                    font-size: 14.5px;
                    font-weight: 900;
                    color: #0f766e;
                    background: #ccfbf1;
                    padding: 2px 10px;
                    border-radius: 5px;
                    letter-spacing: 0.5px;
                }
                .admin-copy .amount-val {
                    color: #4338ca;
                    background: #e0e7ff;
                }
                .receipt-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-top: 6px;
                    font-size: 9.5px;
                    color: #475569;
                }
                .sign-col span {
                    font-weight: 600;
                }
                .dots {
                    color: #94a3b8;
                    margin-top: 2px;
                }
                .cut-divider {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    margin: 8px 0;
                    color: #64748b;
                    font-size: 9.5px;
                    font-weight: 700;
                }
                .cut-divider::before, .cut-divider::after {
                    content: '';
                    flex: 1;
                    border-bottom: 1.5px dashed #94a3b8;
                }
                .scissor {
                    font-size: 13px;
                    color: #475569;
                }
            </style>
        </head>
        <body>
            <div class="sheet">
                ${renderBlock('نسخة التلميذ / ولي الأمر 👨‍👧', true)}
                <div class="cut-divider">
                    <span class="scissor">✂</span>
                    <span>قص من هنا (نسخة للتلميذ ونسخة للإدارة)</span>
                    <span class="scissor">✂</span>
                </div>
                ${renderBlock('نسخة الإدارة 🏫 (للأرشيف)', false)}
            </div>
            <script>
                window.onload = function() {
                    window.print();
                    window.close();
                };
            <\/script>
        </body>
        </html>
    `);
    win.document.close();
};

// طباعة كشف حساب الأداء السنوي للتلميذ
window.printStudentAnnualLedger = function (studentId) {
    const student = students.find(s => String(s.id) === String(studentId));
    if (!student) return;
    const dept = departments.find(d => String(d.id) === String(student.deptId));
    const sName = student.info['الاسم الكامل (بالعربية)'] || 'تلميذ';
    const deptName = dept?.name || '-';
    const today = new Date().toLocaleDateString('ar-MA');

    const instTitle = (typeof currentSession !== 'undefined' && currentSession && currentSession.institution)
        ? currentSession.institution.replace(/\n/g, '<br>')
        : (institutionName || 'المؤسسة التعليمية');

    const activeItems = (typeof getActivePerformanceItems === 'function') ? getActivePerformanceItems() : [];
    const stPayments = monthlyGrades[student.id] || {};

    let rowsHtml = '';
    let totalPaid = 0;
    let paidCount = 0;

    activeItems.forEach((item, idx) => {
        const val = stPayments[item];
        const isPaid = !!val;
        if (isPaid) {
            paidCount++;
            const num = parseFloat(String(val).replace(/[^\d.]/g, ''));
            if (!isNaN(num)) totalPaid += num;
        }

        rowsHtml += `
            <tr style="border-bottom: 1px solid #e2e8f0; background: ${isPaid ? '#f0fdf4' : '#fff'};">
                <td style="padding: 7px; text-align: center; font-weight: bold; color: #64748b;">${idx + 1}</td>
                <td style="padding: 7px; font-weight: bold; color: #1e293b;">${item}</td>
                <td style="padding: 7px; text-align: center; font-weight: bold; color: ${isPaid ? '#15803d' : '#e11d48'};">
                    ${isPaid ? '✅ مؤدى' : '❌ غير مؤدى'}
                </td>
                <td style="padding: 7px; text-align: center; font-weight: 800; color: #0f766e;">
                    ${isPaid ? val : '-'}
                </td>
            </tr>
        `;
    });

    const win = window.open('', '', 'width=700,height=800');
    win.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="utf-8">
            <title>كشف الحساب المالي - ${sName}</title>
            <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;600;700;800;900&display=swap" rel="stylesheet">
            <style>
                @page { size: A4 portrait; margin: 10mm; }
                body { font-family: 'Tajawal', sans-serif; padding: 15px; color: #0f172a; }
                .card { border: 2px solid #0d9488; border-radius: 12px; padding: 18px; }
                .header { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 10px; margin-bottom: 15px; }
                .info-box { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 15px; font-size: 13px; background: #f8fafc; padding: 10px; border-radius: 8px; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 15px; }
                th { background: #0d9488; color: #fff; padding: 8px; font-weight: 800; }
                .summary { background: #f0fdfa; border: 1.5px dashed #0d9488; border-radius: 8px; padding: 10px 15px; display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; color: #0f766e; }
                .footer { margin-top: 35px; display: flex; justify-content: space-between; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="card">
                <div class="header">
                    <h2 style="color: #0f766e; font-size: 18px;">${instTitle}</h2>
                    <h3 style="color: #334155; font-size: 14px; margin-top: 4px;">كشف الحساب المالي السنوي للتلميذ(ة)</h3>
                </div>
                <div class="info-box">
                    <div>التلميذ(ة): <strong>${sName}</strong></div>
                    <div>القسم: <strong>${deptName}</strong></div>
                    <div>السنة الدراسية: <strong>${currentAcademicYear || '-'}</strong></div>
                    <div>تاريخ الاستخراج: <strong>${today}</strong></div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 40px;">#</th>
                            <th>الواجب / الشهر</th>
                            <th style="width: 120px;">حالة الأداء</th>
                            <th style="width: 140px;">المبلغ المؤدى</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
                <div class="summary">
                    <span>عدد البنود المؤداة: ${paidCount} من ${activeItems.length}</span>
                    <span>إجمالي المبالغ المؤداة: ${totalPaid > 0 ? (totalPaid + ' درهم') : 'مسجل'}</span>
                </div>
                <div class="footer">
                    <div>توقيع ولي الأمر: ...................</div>
                    <div>خاتم وتوقيع الإدارة: ...................</div>
                </div>
            </div>
            <script>window.onload = function() { window.print(); window.close(); }<\/script>
        </body>
        </html>
    `);
    win.document.close();
};

// طباعة لائحة الترتيب
window.printRankingList = function () {
    const resultList = document.getElementById('rankingResultList');
    const rankingHtml = resultList ? resultList.innerHTML : "";
    const rankingDeptSelect = document.getElementById('rankingDeptSelect');
    const deptName = rankingDeptSelect && rankingDeptSelect.selectedIndex >= 0
        ? rankingDeptSelect.options[rankingDeptSelect.selectedIndex].text
        : "";
    const reportSessionSelect = document.getElementById('reportSessionSelect');
    const session = reportSessionSelect ? reportSessionSelect.value : "";

    if (!rankingHtml || rankingHtml.includes('اختر قسماً')) return alert("يرجى اختيار قسم أولاً");

    const win = window.open('', '', 'width=800,height=600');
    const instTitle = (typeof currentSession !== 'undefined' && currentSession && currentSession.institution)
        ? currentSession.institution.replace(/\n/g, '<br>')
        : (institutionName || '');

    win.document.write(`
        <html dir="rtl"><head>
            <title>لائحة الترتيب</title>
            <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
            <style>
                @page { size: A4; margin: 15mm; }
                body { font-family: 'Tajawal', sans-serif; padding: 0; margin: 0; }
                h2 { text-align: center; color: #b45309; border-bottom: 2px solid #b45309; padding-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; table-layout: fixed; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: center; }
                th { background-color: #fef3c7; }
            </style>
        </head><body>
            <div style="text-align:center">${instTitle}</div>
            <h2>🏆 لائحة المتفوقين: ${deptName}</h2>
            <p style="text-align:center">الدورة: ${session} | السنة الدراسية: ${currentAcademicYear}</p>
            ${rankingHtml}
            <script>
window.onload = function() { window.print(); window.close(); }<\/script>
        </body></html>
    `);
    win.document.close();
};

// طباعة تقرير استخلاص القسم
window.printClassPerformanceReport = function (deptId, dutyOrMonth) {
    const dept = departments.find(d => String(d.id) === String(deptId));
    const deptName = dept?.name || 'القسم';
    const deptStudents = students.filter(s => String(s.deptId) === String(deptId) && !s.isDroppedOut);
    const today = new Date().toLocaleDateString('ar-MA');

    const instTitle = (typeof currentSession !== 'undefined' && currentSession && currentSession.institution)
        ? currentSession.institution.replace(/\n/g, '<br>')
        : (institutionName || 'المؤسسة التعليمية');

    let totalCollected = 0;
    let paidCount = 0;
    let rowsHtml = '';

    deptStudents.forEach((s, idx) => {
        const val = (monthlyGrades[s.id] && monthlyGrades[s.id][dutyOrMonth]) ? monthlyGrades[s.id][dutyOrMonth] : '';
        const isPaid = !!val;
        if (isPaid) {
            paidCount++;
            const num = parseFloat(String(val).replace(/[^\d.]/g, ''));
            if (!isNaN(num)) totalCollected += num;
        }

        rowsHtml += `
            <tr style="border-bottom: 1px solid #e2e8f0; background: ${isPaid ? '#fff' : '#fff1f2'};">
                <td style="padding: 7px; text-align: center; color: #64748b; font-weight: bold;">${idx + 1}</td>
                <td style="padding: 7px; font-weight: bold; color: #1e293b;">${s.info['الاسم الكامل (بالعربية)'] || 'بدون اسم'}</td>
                <td style="padding: 7px; text-align: center; font-weight: bold; color: ${isPaid ? '#15803d' : '#e11d48'};">
                    ${isPaid ? '✅ مؤدى' : '⚠️ متأخر'}
                </td>
                <td style="padding: 7px; text-align: center; font-weight: 800; color: #0f766e;">
                    ${isPaid ? val : '-'}
                </td>
            </tr>
        `;
    });

    const win = window.open('', '', 'width=750,height=800');
    win.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="utf-8">
            <title>تقرير استخلاص - ${deptName} - ${dutyOrMonth}</title>
            <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap" rel="stylesheet">
            <style>
                @page { size: A4 portrait; margin: 10mm; }
                body { font-family: 'Tajawal', sans-serif; padding: 15px; color: #0f172a; }
                .header { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 10px; margin-bottom: 15px; }
                table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 15px; }
                th { background: #0d9488; color: #fff; padding: 8px; font-weight: 800; }
                .summary { background: #f0fdfa; border: 1.5px dashed #0d9488; border-radius: 8px; padding: 10px 15px; display: flex; justify-content: space-between; font-weight: bold; font-size: 13px; color: #0f766e; }
            </style>
        </head>
        <body>
            <div class="header">
                <h2 style="color: #0f766e;">${instTitle}</h2>
                <h3 style="color: #334155; margin-top: 4px;">تقرير استخلاص: ${dutyOrMonth} — ${deptName}</h3>
                <p style="font-size: 12px; color: #64748b; margin-top: 2px;">السنة الدراسية: ${currentAcademicYear || '-'} | تاريخ الاستخراج: ${today}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 35px;">#</th>
                        <th>اسم التلميذ(ة)</th>
                        <th style="width: 120px;">حالة الأداء</th>
                        <th style="width: 140px;">المبلغ المؤدى</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
            <div class="summary">
                <span>المؤدون: ${paidCount} من ${deptStudents.length} (${Math.round((paidCount / (deptStudents.length || 1)) * 100)}%)</span>
                <span>المتأخرون: ${deptStudents.length - paidCount}</span>
                <span>إجمالي المداخيل المستخلصة: ${totalCollected > 0 ? (totalCollected + ' درهم') : 'مسجل'}</span>
            </div>
            <script>window.onload = function() { window.print(); window.close(); }<\/script>
        </body>
        </html>
    `);
    win.document.close();
};

// طباعة المصفوفة السنوية الشاملة للقسم (A4 عرضي Landscape)
window.printClassAnnualPerformanceMatrix = function (deptId) {
    const dept = departments.find(d => String(d.id) === String(deptId));
    const deptName = dept?.name || 'القسم';
    const deptStudents = students.filter(s => String(s.deptId) === String(deptId) && !s.isDroppedOut);
    const activeItems = (typeof getActivePerformanceItems === 'function') ? getActivePerformanceItems() : [];
    const today = new Date().toLocaleDateString('ar-MA');

    const instTitle = (typeof currentSession !== 'undefined' && currentSession && currentSession.institution)
        ? currentSession.institution.replace(/\n/g, '<br>')
        : (institutionName || 'المؤسسة التعليمية');

    let colTotals = {};
    activeItems.forEach(item => { colTotals[item] = 0; });
    let grandTotal = 0;

    let rowsHtml = '';
    deptStudents.forEach((s, idx) => {
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
                cellsHtml += `<td style="padding: 4px; text-align: center; font-weight: bold; color: #15803d; font-size: 10px; background: #f0fdf4;">✓ ${val}</td>`;
            } else {
                cellsHtml += `<td style="padding: 4px; text-align: center; color: #cbd5e1; font-size: 10px;">-</td>`;
            }
        });

        rowsHtml += `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 4px; text-align: center; color: #64748b; font-weight: bold; font-size: 10px;">${idx + 1}</td>
                <td style="padding: 4px 8px; font-weight: bold; color: #1e293b; font-size: 11px; white-space: nowrap;">${s.info['الاسم الكامل (بالعربية)'] || 'بدون اسم'}</td>
                ${cellsHtml}
                <td style="padding: 4px; text-align: center; font-weight: 800; color: #0f766e; font-size: 11px; background: #f8fafc;">${studentTotal > 0 ? (studentTotal + ' د.م') : '-'}</td>
            </tr>
        `;
    });

    let footerCells = '';
    activeItems.forEach(item => {
        footerCells += `<th style="padding: 5px; text-align: center; font-size: 10px; background: #0f766e; color: #fff;">${colTotals[item] > 0 ? colTotals[item] : '-'}</th>`;
    });

    let thItems = '';
    activeItems.forEach(item => {
        thItems += `<th style="padding: 5px; font-size: 10px; background: #0d9488; color: #fff;">${item}</th>`;
    });

    const win = window.open('', '', 'width=1000,height=750');
    win.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="utf-8">
            <title>المصفوفة السنوية - ${deptName}</title>
            <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap" rel="stylesheet">
            <style>
                @page { size: A4 landscape; margin: 8mm; }
                body { font-family: 'Tajawal', sans-serif; padding: 5px; color: #0f172a; margin: 0; }
                .header { text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 6px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
                table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
                th { padding: 6px 4px; font-weight: 800; }
                .summary { margin-top: 10px; background: #f0fdfa; border: 1.5px dashed #0d9488; border-radius: 6px; padding: 6px 12px; display: flex; justify-content: space-between; font-weight: bold; font-size: 11.5px; color: #0f766e; }
            </style>
        </head>
        <body>
            <div class="header">
                <div style="font-size: 14px; font-weight: 800; color: #0f766e;">${instTitle}</div>
                <div>
                    <h2 style="margin: 0; font-size: 14px; color: #1e293b;">📊 سجل استخلاص الواجبات السنوي الشامل: ${deptName}</h2>
                    <span style="font-size: 10.5px; color: #64748b;">السنة الدراسية: ${currentAcademicYear || '-'} | تاريخ الاستخراج: ${today}</span>
                </div>
                <div style="font-size: 11px; font-weight: bold; color: #0f766e;">عدد التلاميذ: ${deptStudents.length}</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 25px; background: #0d9488; color: #fff;">#</th>
                        <th style="text-align: right; background: #0d9488; color: #fff; padding-right: 8px;">اسم التلميذ(ة)</th>
                        ${thItems}
                        <th style="width: 80px; background: #0f766e; color: #fff;">إجمالي المؤدى</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
                <tfoot>
                    <tr>
                        <th colspan="2" style="background: #0f766e; color: #fff; text-align: right; padding-right: 8px; font-size: 10px;">المجموع الإجمالي</th>
                        ${footerCells}
                        <th style="background: #0f766e; color: #fef08a; font-size: 11px; font-weight: 900;">${grandTotal > 0 ? (grandTotal + ' د.م') : '-'}</th>
                    </tr>
                </tfoot>
            </table>
            <div class="summary">
                <span>القسم: ${deptName} (${deptStudents.length} تلميذ)</span>
                <span>المداخيل السنوية الإجمالية المسجلة: ${grandTotal > 0 ? (grandTotal + ' درهم') : 'مسجل'}</span>
                <span>توقيع وخاتم الإدارة: ........................</span>
            </div>
            <script>window.onload = function() { window.print(); window.close(); }<\/script>
        </body>
        </html>
    `);
    win.document.close();
};

