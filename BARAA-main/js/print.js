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

    sheet.querySelectorAll('.resize-handle, .delete-image-btn, .session-avg-reset, #finalAvgReset').forEach(el => {
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
                .resize-handle, .editable[placeholder]:empty:before { display: none; }
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
                .resize-handle, .delete-image-btn, .editable[placeholder]:empty:before { display: none !important; }
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

        sheetClone.querySelectorAll('.resize-handle, .delete-image-btn').forEach(el => el.remove());

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
window.printPaymentReceipt = function (studentId, month, amount) {
    const student = students.find(s => String(s.id) === String(studentId));
    if (!student) return;
    const dept = departments.find(d => String(d.id) === String(student.deptId));
    const today = new Date().toLocaleDateString('ar-MA');

    const win = window.open('', '', 'width=600,height=400');
    const instTitle = (typeof currentSession !== 'undefined' && currentSession && currentSession.institution)
        ? currentSession.institution.replace(/\n/g, '<br>')
        : (institutionName || 'المؤسسة التعليمية');

    win.document.write(`
        <html dir="rtl"><head>
            <title>وصل أداء</title>
            <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap" rel="stylesheet">
            <style>
                @page { size: A5 landscape; margin: 5mm; }
                body { font-family: 'Tajawal', sans-serif; padding: 15px; border: 2px solid teal; border-radius: 10px; width: 138mm; margin: auto; box-sizing: border-box; }
                .header { text-align: center; border-bottom: 2px solid teal; margin-bottom: 20px; }
                .info { margin-bottom: 8px; font-size: 14px; }
                .amount { font-size: 18px; font-weight: bold; color: teal; text-align: center; margin: 15px 0; border: 2px dashed teal; padding: 8px; background: #f0fdfa; }
                .footer { margin-top: 30px; display: flex; justify-content: space-between; }
            </style>
        </head><body>
            <div class="header">
                <h2>${instTitle}</h2>
                <p>وصل استلام مبلغ شهري</p>
            </div>
            <div class="info"><strong>التلميذ(ة):</strong> ${student.info['الاسم الكامل (بالعربية)']}</div>
            <div class="info"><strong>القسم:</strong> ${dept?.name || '-'}</div>
            <div class="info"><strong>شهر:</strong> ${month}</div>
            <div class="info"><strong>السنة الدراسية:</strong> ${currentAcademicYear}</div>
            <div class="amount">المبلغ المؤدى: ${amount}</div>
            <div class="info"><strong>تاريخ الأداء:</strong> ${today}</div>
            <div class="footer">
                <span>توقيع الإدارة: ...........</span>
                <span>توقيع ولي الأمر: ...........</span>
            </div>
            <script>
window.onload = function() { window.print(); window.close(); }<\/script>
        </body></html>
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
