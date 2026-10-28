// ============================================================
// === 11. النتيجة المدرسية وحساب المعدلات (Report Card & Grades) ===
// ============================================================

function renderNewReportCard(studentId) {
    const reportSessionSelect = document.getElementById("reportSessionSelect");
    const student = students.find(s => String(s.id) === String(studentId));
    if (!student || !reportSessionSelect) return;

    const previouslySelectedSession = reportSessionSelect.value;
    reportSessionSelect.innerHTML = reportSessions.map(s => `<option value="${s}">${s}</option>`).join('');
    if (previouslySelectedSession && reportSessions.includes(previouslySelectedSession)) {
        reportSessionSelect.value = previouslySelectedSession;
    }
    const selectedSession = reportSessionSelect.value;

    const studentReportData = studentReports[studentId] || {};
    const reportData = studentReportData[selectedSession] || {};
    const dept = departments.find(d => String(d.id) === String(student.deptId));

    const studentDeptId = student.deptId;
    const studentActivities = reportActivities.filter(act => {
        if (!act) return false;
        if (typeof act === 'string') return true;
        if (Array.isArray(act.deptIds)) {
            return act.deptIds.includes('all') || act.deptIds.map(String).includes(String(studentDeptId));
        }
        const dId = act.deptId || 'all';
        return dId === 'all' || String(dId) === String(studentDeptId);
    }).map(act => act && typeof act === 'object' ? act.name : act);

    const studentBehaviors = reportBehaviors.filter(beh => {
        if (!beh) return false;
        if (typeof beh === 'string') return true;
        if (Array.isArray(beh.deptIds)) {
            return beh.deptIds.includes('all') || beh.deptIds.map(String).includes(String(studentDeptId));
        }
        const dId = beh.deptId || 'all';
        return dId === 'all' || String(dId) === String(studentDeptId);
    }).map(beh => beh && typeof beh === 'object' ? beh.name : beh);

    const reportCardTitle = document.getElementById('reportCardTitle');
    if (reportCardTitle) reportCardTitle.textContent = `النتائج الدراسية - ${selectedSession}`;

    const institutionField = document.querySelector('#sheet [data-field="institution"]');
    if (institutionField) {
        const institutionValue = (typeof currentSession !== 'undefined' && currentSession && currentSession.institution)
            ? currentSession.institution
            : (institutionName || '');
        institutionField.innerHTML = institutionValue.replace(/\n/g, '<br>');
    }

    const levelEl = document.querySelector('#sheet [data-field="level"]');
    const academicYearEl = document.querySelector('#sheet [data-field="academicYear"]');
    const studentNameEl = document.querySelector('#sheet [data-field="studentName"]');

    if (levelEl) levelEl.textContent = dept?.name || '';
    if (academicYearEl) academicYearEl.textContent = currentAcademicYear || '';
    if (studentNameEl) studentNameEl.textContent = student.info['الاسم الكامل (بالعربية)'] || '';

    const studentImageEl = document.getElementById('reportCardStudentImage');
    if (studentImageEl) {
        studentImageEl.src = student.info?.['صورة'] || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    }

    // حساب وعرض الغياب
    const studentSessionAbsences = (absences[studentId] && absences[studentId][selectedSession]) ? absences[studentId][selectedSession] : [];
    const justifiedAbsences = studentSessionAbsences.filter(a => a.type === 'justified').length;
    const unjustifiedAbsences = studentSessionAbsences.filter(a => a.type === 'unjustified').length;
    const justEl = document.querySelector('#sheet [data-field="absences_justified"]');
    const unjustEl = document.querySelector('#sheet [data-field="absences_unjustified"]');
    if (justEl) justEl.textContent = justifiedAbsences;
    if (unjustEl) unjustEl.textContent = unjustifiedAbsences;

    // تعبئة قائمة ملاحظات الأستاذ
    const teacherNoteSelect = document.querySelector('[data-field="teacher_notes_select"]');
    const teacherNoteCustom = document.querySelector('[data-field="teacher_notes_custom"]');
    if (teacherNoteSelect) {
        const teacherNoteOptions = `<option value="">-- اختر ملاحظة --</option>` + generalObservations.map(obs => `<option value="${obs}">${obs}</option>`).join('') + `<option value="custom">ملاحظة مخصصة...</option>`;
        teacherNoteSelect.innerHTML = teacherNoteOptions;

        teacherNoteSelect.onchange = function () {
            if (this.value === 'custom') {
                if (teacherNoteCustom) {
                    teacherNoteCustom.classList.remove('hidden');
                    teacherNoteCustom.value = '';
                }
            } else {
                if (teacherNoteCustom) teacherNoteCustom.classList.add('hidden');
            }
            saveReportCard(studentId);
        };
    }
    if (teacherNoteCustom) {
        teacherNoteCustom.onblur = () => {
            saveReportCard(studentId);
        };
    }

    // بناء جداول الأنشطة ديناميكياً
    const activitiesBody = document.getElementById('reportActivitiesBody');
    if (activitiesBody) {
        activitiesBody.innerHTML = '';

        if (studentActivities.length > 0) {
            const firstActivity = studentActivities[0];
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td rowspan="${studentActivities.length}" style="border: 1px solid #ddd; padding: 8px; text-align: center; vertical-align: middle; font-weight: bold;">الأنشطة التربوية</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${firstActivity}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #fef9c3;"><input type="number" class="w-20 text-center border-gray-300 rounded-md p-1 activity-score" data-row="${firstActivity}" data-col="assessment" placeholder="نقطة" min="0" max="10" step="0.01"></td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;" class="observation-cell" data-row="${firstActivity}"></td>
            `;
            activitiesBody.appendChild(tr);

            for (let i = 1; i < studentActivities.length; i++) {
                const activity = studentActivities[i];
                const nextTr = document.createElement('tr');
                nextTr.innerHTML = `
                    <td style="border: 1px solid #ddd; padding: 8px;">${activity}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #fef9c3;"><input type="number" class="w-20 text-center border-gray-300 rounded-md p-1 activity-score" data-row="${activity}" data-col="assessment" placeholder="نقطة" min="0" max="10" step="0.01"></td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;" class="observation-cell" data-row="${activity}"></td>
                `;
                activitiesBody.appendChild(nextTr);
            }
        }

        if (studentBehaviors.length > 0) {
            const behaviorItemsHTML = studentBehaviors.map(b => `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-bottom: 1px dotted #ccc;">
                    <span>${b}</span>
                    <input type="number" class="w-20 text-center border-gray-300 rounded-md p-1 behavior-score" data-row="${b}" data-col="score" placeholder="نقطة" min="0" max="10" step="0.01">
                </div>
            `).join('');

            const behaviorTr = document.createElement('tr');
            behaviorTr.innerHTML = `
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center; vertical-align: middle; font-weight: bold;">المواظبة والسلوك</td>
                <td style="border: 1px solid #ddd; padding: 8px;">${behaviorItemsHTML}</td>
                <td id="behaviorTotalAssessment" style="border: 1px solid #ddd; padding: 8px; text-align: center; vertical-align: middle; font-weight: bold; background-color: #fef9c3;"></td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: center;" class="observation-cell" data-row="behavior_summary"></td>
            `;
            activitiesBody.appendChild(behaviorTr);
        }
    }

    // تعبئة البيانات المحفوظة للجداول
    const reportTablesData = reportData.tables || {};
    document.querySelectorAll('#sheet .editable[data-row], #sheet .behavior-score, #sheet .activity-score, #sheet .editable[data-field], #sheet .award-cb').forEach(cell => {
        const rowKey = cell.dataset.row;
        const colKey = cell.dataset.col;
        const fieldKey = cell.dataset.field;

        if (rowKey) {
            const savedValue = reportTablesData[rowKey]?.[colKey] || '';
            fillCell(cell, savedValue);
            updateObservationCell(rowKey, savedValue);
        } else if (fieldKey) {
            const isNonLoadableField = ['studentName', 'level', 'academicYear', 'institution'].includes(fieldKey);
            if (isNonLoadableField) return;

            const isSessionSpecificField = ['teacher_notes_select', 'teacher_notes_custom', 'award_commendation', 'award_encouragement', 'award_honor', 'award_warning'].includes(fieldKey);
            const sourceObject = isSessionSpecificField ? reportData : studentReportData;
            const savedValue = sourceObject[fieldKey] || '';
            fillCell(cell, savedValue);
        }
    });

    if (teacherNoteSelect && teacherNoteCustom) {
        const savedNoteSelect = reportData['teacher_notes_select'] || '';
        const savedNoteCustom = reportData['teacher_notes_custom'] || '';
        teacherNoteSelect.value = savedNoteSelect;
        if (savedNoteSelect === 'custom') {
            teacherNoteCustom.classList.remove('hidden');
            teacherNoteCustom.value = savedNoteCustom;
        } else {
            teacherNoteCustom.classList.add('hidden');
        }
    }

    calculateSessionAverage(true, studentActivities.length);
    updateFinalGradesTable(studentId);

    // الصور الملحقة
    const studentGender = student.info?.['الجنس'] || 'ذكر';
    document.querySelectorAll('#sheet .draggable').forEach(el => el.remove());
    const imagesToRender = reportImagesByGender[studentGender] || [];
    imagesToRender.forEach(imgData => {
        if (typeof createDraggableImage === 'function') createDraggableImage(imgData.src, imgData);
    });

    // حفظ التغييرات عند التعديل
    document.querySelectorAll('#sheet .editable, #sheet .award-cb, #sheet .report-note-select').forEach(el => {
        const eventType = el.matches('.award-cb') ? 'change' : 'blur';
        el.addEventListener(eventType, () => {
            saveReportCard(studentId);
        });
    });

    document.querySelectorAll('#sheet .behavior-score, #sheet .activity-score').forEach(input => {
        input.oninput = (e) => {
            let value = parseFloat(e.target.value);
            if (e.target.value !== '' && (isNaN(value) || value > 10 || value < 0)) {
                alert("قيمة خاطئة");
                e.target.value = '';
                return;
            }
            updateObservationCell(e.target.dataset.row, e.target.value);
            calculateSessionAverage(true, studentActivities.length);
            saveReportCard(studentId);
            updateFinalGradesTable(studentId);
        };
    });

    document.querySelectorAll('#sheet .award-cb').forEach(cb => {
        cb.onchange = () => saveReportCard(studentId);
    });

    // قائمة خيارات المعدل النهائي
    const finalAverageSelect = document.getElementById('finalAverageLabelSelect');
    if (finalAverageSelect) {
        finalAverageSelect.addEventListener('change', (e) => {
            const sid = selectedHomeStudentId;
            if (e.target.value === 'custom') {
                const customText = prompt('أدخل النص المخصص لخانة المعدل:');
                if (customText !== null) {
                    const newLabel = customText.trim();
                    if (!customFinalAverageLabels.includes(newLabel)) {
                        customFinalAverageLabels.push(newLabel);
                    }
                    globalFinalAverageLabel = newLabel;
                    saveReportCard(sid);
                    renderNewReportCard(sid);
                }
            } else if (e.target.value === 'delete-custom') {
                const labelToDelete = prompt('أدخل النص المخصص الذي تريد حذفه بالضبط:');
                if (labelToDelete && customFinalAverageLabels.includes(labelToDelete)) {
                    customFinalAverageLabels = customFinalAverageLabels.filter(l => l !== labelToDelete);
                    if (globalFinalAverageLabel === labelToDelete) globalFinalAverageLabel = 'المعدل العام السنوي';
                    saveAll();
                    renderNewReportCard(sid);
                } else if (labelToDelete) {
                    alert('النص الذي أدخلته غير موجود في قائمة النصوص المخصصة.');
                }
            } else {
                saveReportCard(sid);
            }
        });
    }
}

function updateObservationCell(rowKey, score) {
    const scoreValue = parseFloat(score);
    const cell = document.querySelector(`.observation-cell[data-row="${rowKey}"]`);
    if (!cell) return;

    let observationText = '';
    if (!isNaN(scoreValue)) {
        const foundObs = scoreObservations.find(obs => scoreValue >= obs.min && scoreValue <= obs.max);
        if (foundObs) observationText = foundObs.text;
    }
    cell.textContent = observationText;
}

function updateFinalGradesTable(studentId) {
    const finalGradesHeader = document.getElementById('finalGradesHeader');
    const finalGradesBody = document.getElementById('finalGradesBody');
    if (!finalGradesHeader || !finalGradesBody) return;

    let headerHTML = '<tr>';
    let bodyHTML = '<tr>';

    const defaultOptions = ['معدل المرحلة الأولى', 'معدل المرحلة الثانية', 'المعدل العام السنوي'];
    const allOptions = [...new Set([...defaultOptions, ...customFinalAverageLabels])];

    const optionsHTML = allOptions.map(opt =>
        `<option value="${opt}" ${globalFinalAverageLabel === opt ? 'selected' : ''}>${opt}</option>`
    ).join('');

    const finalAverageDropdownHTML = `
        <select id="finalAverageLabelSelect" class="w-full bg-transparent text-center font-bold focus:outline-none p-1">${optionsHTML}<option value="custom">نص مخصص...</option><option value="delete-custom" class="text-red-500">حذف نص مخصص...</option></select>
    `;

    const studentReportData = studentReports[studentId] || {};
    let sessionAvgs = [];

    reportSessions.forEach(session => {
        headerHTML += `<th style="border: 1px solid #ddd; padding: 8px;">معدل ${session}</th>`;
        const autoAvg = parseFloat(studentReportData[session]?.behaviorAverage) || 0;
        const manualAvg = studentReportData[session]?.manualAverage;
        const displayAvg = (manualAvg !== undefined && manualAvg !== '') ? parseFloat(manualAvg) : autoAvg;
        const hasManual = (manualAvg !== undefined && manualAvg !== '');

        sessionAvgs.push({ session, autoAvg, displayAvg });

        bodyHTML += `<td style="border: 1px solid #ddd; padding: 4px; text-align:center;">
                <div style="display:flex; align-items:center; justify-content:center; gap:4px;">
                    <input type="number"
                        class="session-avg-input"
                        data-session="${session}"
                        data-student="${studentId}"
                        value="${displayAvg > 0 ? displayAvg.toFixed(2) : ''}"
                        placeholder="—"
                        min="0" max="10" step="0.01"
                        style="width:70px; text-align:center; border:1px solid ${hasManual ? '#f59e0b' : '#d1d5db'}; border-radius:6px; padding:4px 2px; font-weight:bold; color:${hasManual ? '#b45309' : '#1d4ed8'}; background:${hasManual ? '#fef3c7' : '#fff'};">
                    ${hasManual ? `<button class="session-avg-reset" data-session="${session}" data-student="${studentId}" title="إعادة الحساب التلقائي" style="background:none;border:none;cursor:pointer;font-size:14px;color:#9ca3af;">↺</button>` : ''}
                </div>
            </td>`;
    });

    const validAvgs = sessionAvgs.filter(s => s.displayAvg > 0);
    const totalSum = validAvgs.reduce((sum, s) => sum + s.displayAvg, 0);
    const manualFinalAvg = studentReportData._manualFinalAverage;
    const autoFinalAvg = validAvgs.length > 0 ? (totalSum / validAvgs.length).toFixed(2) : '-';
    const displayFinalAvg = (manualFinalAvg !== undefined && manualFinalAvg !== '') ? manualFinalAvg : autoFinalAvg;
    const hasFinalManual = (manualFinalAvg !== undefined && manualFinalAvg !== '');

    headerHTML += `<th style="border: 1px solid #ddd; padding: 0; background-color: #e0e7ff;">${finalAverageDropdownHTML}</th></tr>`;
    bodyHTML += `<td style="border: 1px solid #ddd; padding: 4px; background-color: #e0e7ff; text-align:center;">
            <div style="display:flex; align-items:center; justify-content:center; gap:4px;">
                <input type="number"
                    id="finalAvgInput"
                    data-student="${studentId}"
                    value="${displayFinalAvg !== '-' ? displayFinalAvg : ''}"
                    placeholder="—"
                    min="0" max="10" step="0.01"
                    style="width:70px; text-align:center; border:1px solid ${hasFinalManual ? '#f59e0b' : '#c7d2fe'}; border-radius:6px; padding:4px 2px; font-weight:bold; color:${hasFinalManual ? '#b45309' : '#1e3a8a'}; background:${hasFinalManual ? '#fef3c7' : '#ede9fe'};">
                ${hasFinalManual ? `<button id="finalAvgReset" data-student="${studentId}" title="إعادة الحساب التلقائي" style="background:none;border:none;cursor:pointer;font-size:14px;color:#9ca3af;">↺</button>` : ''}
            </div>
        </td></tr>`;

    finalGradesHeader.innerHTML = headerHTML;
    finalGradesBody.innerHTML = bodyHTML;

    // مستمعو أحداث التعديل اليدوي للمعدلات
    document.querySelectorAll('.session-avg-input').forEach(input => {
        input.addEventListener('change', function () {
            const sid = this.dataset.student;
            const sess = this.dataset.session;
            if (!studentReports[sid]) studentReports[sid] = {};
            if (!studentReports[sid][sess]) studentReports[sid][sess] = {};
            const val = this.value.trim();
            if (val === '') {
                delete studentReports[sid][sess].manualAverage;
            } else {
                const num = parseFloat(val);
                if (isNaN(num) || num < 0 || num > 10) {
                    alert('قيمة غير صحيحة. يجب أن تكون بين 0 و 10.');
                    this.value = '';
                    return;
                }
                studentReports[sid][sess].manualAverage = num.toFixed(2);
            }
            saveAll();
            updateFinalGradesTable(sid);
        });
    });

    document.querySelectorAll('.session-avg-reset').forEach(btn => {
        btn.addEventListener('click', function () {
            const sid = this.dataset.student;
            const sess = this.dataset.session;
            if (studentReports[sid]?.[sess]) {
                delete studentReports[sid][sess].manualAverage;
            }
            saveAll();
            updateFinalGradesTable(sid);
        });
    });

    const finalAvgInput = document.getElementById('finalAvgInput');
    if (finalAvgInput) {
        finalAvgInput.addEventListener('change', function () {
            const sid = this.dataset.student;
            if (!studentReports[sid]) studentReports[sid] = {};
            const val = this.value.trim();
            if (val === '') {
                delete studentReports[sid]._manualFinalAverage;
            } else {
                const num = parseFloat(val);
                if (isNaN(num) || num < 0 || num > 10) {
                    alert('قيمة غير صحيحة. يجب أن تكون بين 0 و 10.');
                    this.value = '';
                    return;
                }
                studentReports[sid]._manualFinalAverage = num.toFixed(2);
            }
            saveAll();
            updateFinalGradesTable(sid);
        });
    }

    const finalAvgReset = document.getElementById('finalAvgReset');
    if (finalAvgReset) {
        finalAvgReset.addEventListener('click', function () {
            const sid = this.dataset.student;
            if (studentReports[sid]) {
                delete studentReports[sid]._manualFinalAverage;
            }
            saveAll();
            updateFinalGradesTable(sid);
        });
    }
}

function fillCell(cell, value) {
    if (cell.tagName === 'SELECT') {
        if (cell.querySelector(`option[value="${value}"]`)) {
            cell.value = value;
        } else if (value) {
            cell.value = 'custom';
        }
    } else if (cell.type === 'checkbox') {
        cell.checked = !!value;
    } else if (cell.tagName === 'INPUT') {
        cell.value = value;
    } else {
        cell.textContent = value;
    }
}

function saveReportCard(studentId, customNoteUpdate = null) {
    const reportSessionSelect = document.getElementById("reportSessionSelect");
    if (!reportSessionSelect) return;
    if (!studentReports[studentId]) studentReports[studentId] = {};
    const studentReportData = studentReports[studentId];
    const selectedSession = reportSessionSelect.value;
    if (!studentReportData[selectedSession]) studentReportData[selectedSession] = {};

    const finalAverageSelect = document.getElementById('finalAverageLabelSelect');
    if (finalAverageSelect && finalAverageSelect.value !== 'custom' && finalAverageSelect.value !== 'delete-custom') {
        globalFinalAverageLabel = finalAverageSelect.value;
    }

    const reportData = studentReportData[selectedSession];

    document.querySelectorAll('#sheet .editable[data-field], #sheet .award-cb[data-field]').forEach(el => {
        const field = el.dataset.field;
        const isSessionSpecificField = ['teacher_notes_select', 'teacher_notes_custom', 'award_commendation', 'award_encouragement', 'award_honor', 'award_warning'].includes(field);
        const isNonSavableField = ['studentName', 'level', 'academicYear', 'institution'].includes(field);
        const targetObject = isSessionSpecificField ? reportData : studentReportData;

        if (isNonSavableField) return;
        else if (el.type === 'checkbox') {
            targetObject[field] = el.checked;
        } else {
            targetObject[field] = el.textContent;
        }
    });

    const teacherNoteSelect = document.querySelector('[data-field="teacher_notes_select"]');
    const teacherNoteCustom = document.querySelector('[data-field="teacher_notes_custom"]');
    if (teacherNoteSelect && teacherNoteCustom) {
        reportData['teacher_notes_select'] = teacherNoteSelect.value;
        reportData['teacher_notes_custom'] = teacherNoteCustom.value;
    }

    if (!reportData.tables) reportData.tables = {};
    document.querySelectorAll('#sheet .editable[data-row], #sheet .behavior-score, #sheet .activity-score').forEach(cell => {
        const rowKey = cell.dataset.row;
        const colKey = cell.dataset.col;
        if (!reportData.tables[rowKey]) reportData.tables[rowKey] = {};

        if (cell.tagName === 'SELECT') {
            if (cell.value === 'custom') {
                if (customNoteUpdate && customNoteUpdate.row === rowKey && customNoteUpdate.col === colKey) {
                    reportData.tables[rowKey][colKey] = customNoteUpdate.value;
                }
            } else {
                reportData.tables[rowKey][colKey] = cell.value;
            }
        } else if (cell.tagName === 'INPUT') {
            reportData.tables[rowKey][colKey] = cell.value;
        } else {
            reportData.tables[rowKey][colKey] = cell.textContent;
        }
    });

    document.querySelectorAll('.observation-cell').forEach(cell => {
        const rowKey = cell.dataset.row;
        if (!reportData.tables[rowKey]) reportData.tables[rowKey] = {};
        reportData.tables[rowKey]['notes'] = cell.textContent;
    });

    const student = students.find(s => String(s.id) === String(studentId));
    const studentDeptId = student ? student.deptId : null;
    const studentActivities = reportActivities.filter(act => {
        if (!act) return false;
        if (typeof act === 'string') return true;
        if (Array.isArray(act.deptIds)) {
            return act.deptIds.includes('all') || act.deptIds.map(String).includes(String(studentDeptId));
        }
        const dId = act.deptId || 'all';
        return dId === 'all' || String(dId) === String(studentDeptId);
    });
    const { totalScore, average } = calculateSessionAverage(false, studentActivities.length);
    reportData.behaviorTotalAssessment = totalScore > 0 ? totalScore.toFixed(2) : '';
    reportData.behaviorAverage = average > 0 ? average.toFixed(2) : '';

    const studentGender = student?.info?.['الجنس'] || 'ذكر';
    reportImagesByGender[studentGender] = [];
    document.querySelectorAll('#sheet .draggable').forEach(imgWrapper => {
        reportImagesByGender[studentGender].push({
            src: imgWrapper.querySelector('img').src,
            top: imgWrapper.style.top,
            left: imgWrapper.style.left,
            width: imgWrapper.style.width,
            height: imgWrapper.style.height,
        });
    });

    saveAll();
}

function calculateSessionAverage(updateDOM = true, numberOfActivities = 0) {
    const activityScores = document.querySelectorAll('.activity-score');
    const totalActivityScore = Array.from(activityScores).reduce((sum, input) => sum + (parseFloat(input.value) || 0), 0);

    const behaviorScores = document.querySelectorAll('.behavior-score');
    const totalBehaviorScore = Array.from(behaviorScores).reduce((sum, input) => sum + (parseFloat(input.value) || 0), 0);

    const grandTotalScore = totalActivityScore + totalBehaviorScore;
    const denominator = numberOfActivities + 1;
    const average = denominator > 0 ? (grandTotalScore / denominator) : 0;

    if (updateDOM) {
        const displayScore = Math.min(totalBehaviorScore, 10);
        const behaviorTotalAssessment = document.getElementById('behaviorTotalAssessment');
        if (behaviorTotalAssessment) behaviorTotalAssessment.textContent = displayScore.toFixed(2);
        updateObservationCell('behavior_summary', displayScore);
    }

    return { totalScore: grandTotalScore, average };
}

// مستمع تغيير الدورة في واجهة النتيجة
const reportSessionSelectEl = document.getElementById("reportSessionSelect");
if (reportSessionSelectEl) {
    reportSessionSelectEl.addEventListener("change", () => {
        if (selectedHomeStudentId) {
            renderNewReportCard(selectedHomeStudentId);
            updateFinalGradesTable(selectedHomeStudentId);
        }
    });
}
