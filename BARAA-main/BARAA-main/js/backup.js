// ============================================================
// === 17. تصدير واستيراد البيانات والنسخ الاحتياطي (Backup) ===
// ============================================================

const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');

if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        const exportModal = document.getElementById('exportModal');
        if (exportModal) exportModal.classList.remove('hidden');
    });
}

if (importBtn) {
    importBtn.addEventListener('click', () => {
        const importModal = document.getElementById('importModal');
        if (importModal) importModal.classList.remove('hidden');
    });
}

window.exportAll = function () {
    if (typeof saveAll === 'function') {
        saveAll();
    }

    const dataToExport = {
        academicYears: JSON.parse(appStorage.getItem("academicYears") || "[]"),
        academicData: JSON.parse(appStorage.getItem("academicData") || "{}"),
        currentAcademicYear: appStorage.getItem("currentAcademicYear"),
        institutionName: appStorage.getItem("institutionName") || "",
        studentFields: JSON.parse(appStorage.getItem("studentFields") || "null"),
        migration_v3_complete: appStorage.getItem("migration_v3_complete") || "false"
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `full_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    const exportModal = document.getElementById('exportModal');
    if (exportModal) exportModal.classList.add('hidden');
};

window.exportImages = function () {
    const academicDataStr = appStorage.getItem("academicData");
    if (!academicDataStr) return alert("لا توجد بيانات لتصديرها.");

    const acData = JSON.parse(academicDataStr);
    const imagesExport = { type: 'images_only', years: {} };

    for (const year in acData) {
        imagesExport.years[year] = {
            studentImages: {},
            reportImagesByGender: acData[year].reportImagesByGender || { 'ذكر': [], 'أنثى': [] }
        };
        if (acData[year].students) {
            acData[year].students.forEach(s => {
                const name = s.info && s.info['الاسم الكامل (بالعربية)'];
                if (name && s.info && s.info['صورة']) {
                    imagesExport.years[year].studentImages[name] = s.info['صورة'];
                }
            });
        }
    }

    const dataStr = JSON.stringify(imagesExport, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `images_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    const exportModal = document.getElementById('exportModal');
    if (exportModal) exportModal.classList.add('hidden');
};

window.importAll = async function (e) {
    const importModal = document.getElementById('importModal');
    if (importModal) importModal.classList.add('hidden');
    return window.handleRecoveryFile(e);
};

window.importImages = async function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const imported = JSON.parse(event.target.result);
            if (imported.type !== 'images_only') {
                alert("هذا الملف ليس ملف صور فقط. يرجى استخدام 'استيراد كل البيانات'.");
                return;
            }

            const acData = JSON.parse(appStorage.getItem("academicData") || "{}");
            let importedCount = 0;

            for (const year in imported.years) {
                if (acData[year]) {
                    if (imported.years[year].reportImagesByGender) {
                        acData[year].reportImagesByGender = imported.years[year].reportImagesByGender;
                    }

                    if (imported.years[year].studentImages && acData[year].students) {
                        acData[year].students.forEach(s => {
                            const name = s.info && s.info['الاسم الكامل (بالعربية)'];
                            if (name && imported.years[year].studentImages[name]) {
                                s.info['صورة'] = imported.years[year].studentImages[name];
                                importedCount++;
                            }
                        });
                    }
                }
            }

            appStorage.setItem("academicData", JSON.stringify(acData));
            alert(`تم استيراد الصور بنجاح! تم ربط ${importedCount} صورة تلاميذ.`);
            window.location.reload();

        } catch (err) {
            alert("خطأ في قراءة الملف.");
            console.error(err);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
    const importModal = document.getElementById('importModal');
    if (importModal) importModal.classList.add('hidden');
};

// ============================================================
// === أداة الفحص الذكي واسترجاع البيانات السابقة والمفقودة ===
// ============================================================

function openDataRecoveryModal() {
    const modal = document.getElementById('dataRecoveryModal');
    if (modal) {
        modal.classList.remove('hidden');
        if (typeof toggleMobileSidebar === 'function' && window.innerWidth < 1024) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar && !sidebar.classList.contains('translate-x-full')) {
                toggleMobileSidebar();
            }
        }
        if (typeof window.scanAllDataSources === 'function') {
            window.scanAllDataSources();
        }
    }
}
window.openDataRecoveryModal = openDataRecoveryModal;
window._openDataRecoveryModalImpl = openDataRecoveryModal;

function closeDataRecoveryModal() {
    const modal = document.getElementById('dataRecoveryModal');
    if (modal) modal.classList.add('hidden');
}
window.closeDataRecoveryModal = closeDataRecoveryModal;
window._closeDataRecoveryModalImpl = closeDataRecoveryModal;

window.handleRecoveryFile = function (e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (event) {
        try {
            const parsed = JSON.parse(event.target.result);
            if (!parsed || typeof parsed !== 'object') {
                alert("الملف المختار غير صالح أو تالف.");
                return;
            }

            if (parsed.type === 'images_only') {
                alert("هذا الملف يحتوي على صور فقط. يرجى استخدام 'استيراد الصور فقط'.");
                return;
            }

            let acData = {};
            let acYears = [];
            let instName = "";
            let fields = null;

            if (parsed.academicData && typeof parsed.academicData === 'object') {
                acData = parsed.academicData;
                acYears = Array.isArray(parsed.academicYears) ? parsed.academicYears : Object.keys(acData);
                instName = parsed.institutionName || "";
                fields = parsed.studentFields || null;
            } else {
                const keys = Object.keys(parsed);
                const looksLikeYears = keys.some(k => k.includes('/') || (parsed[k] && (parsed[k].students || parsed[k].departments)));
                if (looksLikeYears) {
                    acData = parsed;
                    acYears = keys;
                } else if (Array.isArray(parsed.students) || Array.isArray(parsed.departments)) {
                    const defaultY = "2024/2025";
                    acData = { [defaultY]: parsed };
                    acYears = [defaultY];
                }
            }

            let totalStudents = 0;
            let totalDepts = 0;
            for (const y in acData) {
                const yd = acData[y];
                if (yd) {
                    if (Array.isArray(yd.students)) totalStudents += yd.students.length;
                    if (Array.isArray(yd.departments)) totalDepts += yd.departments.length;
                }
            }

            if (totalStudents === 0 && totalDepts === 0) {
                alert("لم يتم العثور على بيانات تلاميذ أو أقسام داخل ملف النسخة الاحتياطية.");
                return;
            }

            const candidate = {
                title: `ملف احتياطي محلي: ${file.name}`,
                sourceDescription: `تم الرفع من جهازك — الحجم: ${Math.round(file.size / 1024)} كيلوبايت`,
                type: 'academicData',
                data: acData,
                years: acYears,
                totalStudents: totalStudents,
                totalDepts: totalDepts,
                institutionName: instName,
                studentFields: fields
            };

            // إظهار بطاقة النسخة المرفوعة في نافذة الاسترجاع
            window._recoveryCandidates = window._recoveryCandidates || [];
            window._recoveryCandidates.unshift(candidate);
            window.renderRecoveryList(window._recoveryCandidates);

            const confirmMsg = `هل تريد استرجاع وتثبيت البيانات من هذا الملف؟\n\nالملف: ${file.name}\nعدد التلاميذ: ${totalStudents}\nعدد الأقسام: ${totalDepts}`;
            if (confirm(confirmMsg)) {
                await window.applyRestoredData(candidate);
            }

        } catch (err) {
            console.error("Error reading recovery file:", err);
            alert("خطأ أثناء قراءة الملف: " + err.message);
        }
    };
    reader.onloadend = function () {
        try { if (e.target) e.target.value = ''; } catch(err){}
    };
    reader.readAsText(file);
};

window.scanAllDataSources = async function () {
    const listEl = document.getElementById('recoveryList');
    if (listEl) {
        listEl.innerHTML = '<div class="text-center py-8"><p class="text-indigo-600 font-bold animate-pulse">⏳ جاري فحص جميع مصادر التخزين المحلية والسحابية...</p><p class="text-gray-400 text-xs mt-1">يتم مسح ذاكرة المتصفح، النسخ الاحتياطية، والسحابة</p></div>';
    }

    const candidates = [];
    const seenSignatures = new Set();

    // 0. النسخة المعتمدة المدمجة بالنظام (49 تلميذاً و 3 أقسام لسنة 2025/2026)
    if (typeof window !== 'undefined' && window.__EMBEDDED_BACKUP_RECOVERY__) {
        const emb = window.__EMBEDDED_BACKUP_RECOVERY__;
        if (emb && emb.academicData) {
            let totalStudents = 0;
            let totalDepts = 0;
            const years = Array.isArray(emb.academicYears) ? emb.academicYears : Object.keys(emb.academicData);
            years.forEach(y => {
                const yd = emb.academicData[y];
                if (yd) {
                    if (Array.isArray(yd.students)) totalStudents += yd.students.length;
                    if (Array.isArray(yd.departments)) totalDepts += yd.departments.length;
                }
            });
            if (totalStudents > 0 || totalDepts > 0) {
                const sig = `embedded_${totalStudents}_${totalDepts}`;
                seenSignatures.add(sig);
                candidates.push({
                    title: `⭐ النسخة المعتمدة المدمجة (49 تلميذاً و 3 أقسام)`,
                    sourceDescription: `النسخة الأصلية المرفقة بالنظام مع صور التلاميذ لجميع الأقسام لسنة 2025/2026`,
                    type: 'fullObject',
                    key: 'embedded_master',
                    years: years,
                    totalStudents: totalStudents,
                    totalDepts: totalDepts,
                    data: emb,
                    rawSize: JSON.stringify(emb).length
                });
            }
        }
    }

    // 1. مسح شامل لجميع مفاتيح localStorage
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            const raw = localStorage.getItem(key);
            if (!raw || raw.length < 5) continue;

            try {
                let parsed = JSON.parse(raw);
                if (!parsed) continue;

                // أ) كائن كامل للنظام (Full Backup)
                if (parsed.academicData && typeof parsed.academicData === 'object') {
                    let totalStudents = 0;
                    let totalDepts = 0;
                    const years = Array.isArray(parsed.academicYears) ? parsed.academicYears : Object.keys(parsed.academicData);
                    years.forEach(y => {
                        const yd = parsed.academicData[y];
                        if (yd) {
                            if (Array.isArray(yd.students)) totalStudents += yd.students.length;
                            if (Array.isArray(yd.departments)) totalDepts += yd.departments.length;
                        }
                    });
                    if (totalStudents > 0 || totalDepts > 0) {
                        const sig = `full_${totalStudents}_${totalDepts}_${years.join('-')}`;
                        if (!seenSignatures.has(sig)) {
                            seenSignatures.add(sig);
                            candidates.push({
                                title: `نسخة احتياطية كاملة (${key})`,
                                sourceDescription: `مفتاح: ${key} — الحجم: ${Math.round(raw.length / 1024)} كيلوبايت`,
                                type: 'fullObject',
                                key: key,
                                years: years,
                                totalStudents: totalStudents,
                                totalDepts: totalDepts,
                                data: parsed,
                                rawSize: raw.length
                            });
                        }
                    }
                }
                // ب) كائن academicData (سنوات متعددة أو بنية مسطحة)
                else if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                    let totalStudents = 0;
                    let totalDepts = 0;
                    let years = [];
                    let isAcData = false;

                    const keys = Object.keys(parsed);
                    const looksLikeYears = keys.some(k => k.includes('/') || (parsed[k] && (parsed[k].students || parsed[k].departments)));

                    if (looksLikeYears) {
                        years = keys;
                        years.forEach(y => {
                            const yd = parsed[y];
                            if (yd) {
                                if (Array.isArray(yd.students)) totalStudents += yd.students.length;
                                if (Array.isArray(yd.departments)) totalDepts += yd.departments.length;
                            }
                        });
                        if (totalStudents > 0 || totalDepts > 0) isAcData = true;
                    } else if (Array.isArray(parsed.students) || Array.isArray(parsed.departments)) {
                        const defaultY = "2024/2025";
                        years = [defaultY];
                        if (Array.isArray(parsed.students)) totalStudents = parsed.students.length;
                        if (Array.isArray(parsed.departments)) totalDepts = parsed.departments.length;
                        parsed = { [defaultY]: parsed };
                        isAcData = true;
                    }

                    if (isAcData) {
                        const sig = `ac_${totalStudents}_${totalDepts}_${years.join('-')}`;
                        if (!seenSignatures.has(sig)) {
                            seenSignatures.add(sig);
                            candidates.push({
                                title: `بيانات دراسية سابقة: ${key}`,
                                sourceDescription: key === 'academicData' ? 'بيانات النظام الأصلي (بدون بادئة حساب)' : `ذاكرة المتصفح: ${key}`,
                                type: 'academicData',
                                key: key,
                                years: years,
                                totalStudents: totalStudents,
                                totalDepts: totalDepts,
                                data: parsed,
                                rawSize: raw.length
                            });
                        }
                    }
                }
                // ج) مصفوفة تلاميذ مباشرة
                else if (Array.isArray(parsed) && parsed.length > 0 && (key.includes('students') || key.includes('تلاميذ'))) {
                    const isStudentList = parsed.some(item => item && (item.info || item.deptId || item.name));
                    if (isStudentList) {
                        const defaultY = "2024/2025";
                        let depts = [];
                        try {
                            depts = JSON.parse(localStorage.getItem('departments') || localStorage.getItem('sub_departments') || "[]");
                        } catch (e) { }
                        const wrappedData = {
                            [defaultY]: {
                                students: parsed,
                                departments: depts
                            }
                        };
                        const sig = `students_${parsed.length}`;
                        if (!seenSignatures.has(sig)) {
                            seenSignatures.add(sig);
                            candidates.push({
                                title: `قائمة تلاميذ سابقة (${key})`,
                                sourceDescription: `مصفوفة تلاميذ مباشرة من ${key}`,
                                type: 'academicData',
                                key: key,
                                years: [defaultY],
                                totalStudents: parsed.length,
                                totalDepts: depts.length,
                                data: wrappedData,
                                rawSize: raw.length
                            });
                        }
                    }
                }
            } catch (e) { }
        }
    } catch (e) {
        console.error("Error scanning localStorage:", e);
    }

    // عرض المرشحين المحليين فوراً وبدون أي تأخير (خلال 1 ميلي ثانية)
    candidates.sort((a, b) => (b.totalStudents - a.totalStudents) || (b.totalDepts - a.totalDepts) || (b.rawSize - a.rawSize));
    window._recoveryCandidates = candidates.slice();
    window.renderRecoveryList(window._recoveryCandidates);

    // 2. فحص سحابة Firestore و RTDB و IndexedDB في الخلفية مع مهلة سريعة (1.5 ثانية فقط)
    const backgroundTasks = [];

    if (typeof fs !== 'undefined') {
        const docIdsToCheck = ['0662065072', 'latest'];
        if (typeof cloudUserId !== 'undefined' && cloudUserId && !docIdsToCheck.includes(cloudUserId)) {
            docIdsToCheck.push(cloudUserId);
        }
        for (const docId of docIdsToCheck) {
            backgroundTasks.push((async () => {
                try {
                    const getDocPromise = fs.collection('users').doc(docId).get();
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500));
                    const doc = await Promise.race([getDocPromise, timeoutPromise]);
                    if (doc && doc.exists) {
                        const cData = doc.data();
                        if (cData && cData.academicData && typeof cData.academicData === 'object') {
                            let totalStudents = 0;
                            let totalDepts = 0;
                            const years = Array.isArray(cData.academicYears) ? cData.academicYears : Object.keys(cData.academicData);
                            years.forEach(y => {
                                const yd = cData.academicData[y];
                                if (yd) {
                                    if (Array.isArray(yd.students)) totalStudents += yd.students.length;
                                    if (Array.isArray(yd.departments)) totalDepts += yd.departments.length;
                                }
                            });
                            if (totalStudents > 0 || totalDepts > 0) {
                                const sig = `fs_${totalStudents}_${totalDepts}`;
                                if (!seenSignatures.has(sig)) {
                                    seenSignatures.add(sig);
                                    candidates.push({
                                        title: `سحابة Firestore (وثيقة: users/${docId})`,
                                        sourceDescription: `تاريخ السحابة: ${cData.lastUpdated || 'غير معروف'}`,
                                        type: 'fullObject',
                                        key: `firestore_${docId}`,
                                        years: years,
                                        totalStudents: totalStudents,
                                        totalDepts: totalDepts,
                                        data: cData,
                                        rawSize: JSON.stringify(cData).length
                                    });
                                }
                            }
                        }
                    }
                } catch (e) { }
            })());
        }
    }

    if (typeof db !== 'undefined') {
        const rtdbPaths = ['backup/0662065072', 'backup/latest'];
        for (const p of rtdbPaths) {
            backgroundTasks.push((async () => {
                try {
                    const getRtdbPromise = db.ref(p).once('value');
                    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500));
                    const snap = await Promise.race([getRtdbPromise, timeoutPromise]);
                    if (snap && snap.val) {
                        const rData = snap.val();
                        if (rData && rData.academicData && typeof rData.academicData === 'object') {
                            let totalStudents = 0;
                            let totalDepts = 0;
                            const years = Array.isArray(rData.academicYears) ? rData.academicYears : Object.keys(rData.academicData);
                            years.forEach(y => {
                                const yd = rData.academicData[y];
                                if (yd) {
                                    if (Array.isArray(yd.students)) totalStudents += yd.students.length;
                                    if (Array.isArray(yd.departments)) totalDepts += yd.departments.length;
                                }
                            });
                            if (totalStudents > 0 || totalDepts > 0) {
                                const sig = `rtdb_${totalStudents}_${totalDepts}`;
                                if (!seenSignatures.has(sig)) {
                                    seenSignatures.add(sig);
                                    candidates.push({
                                        title: `قاعدة بيانات RTDB (${p})`,
                                        sourceDescription: `نسخة سحابية من Realtime Database`,
                                        type: 'fullObject',
                                        key: `rtdb_${p}`,
                                        years: years,
                                        totalStudents: totalStudents,
                                        totalDepts: totalDepts,
                                        data: rData,
                                        rawSize: JSON.stringify(rData).length
                                    });
                                }
                            }
                        }
                    }
                } catch (e) { }
            })());
        }
    }

    if (typeof idbManager !== 'undefined') {
        const idbKeys = ['academicData_full', 'sub_0662065072_academicData', 'academicData'];
        for (const ik of idbKeys) {
            backgroundTasks.push((async () => {
                try {
                    const idbVal = await idbManager.getItem(ik);
                    if (idbVal && typeof idbVal === 'object') {
                        let stCount = 0;
                        let deptCount = 0;
                        const years = Object.keys(idbVal);
                        years.forEach(y => {
                            const yd = idbVal[y];
                            if (yd) {
                                if (Array.isArray(yd.students)) stCount += yd.students.length;
                                if (Array.isArray(yd.departments)) deptCount += yd.departments.length;
                            }
                        });
                        if (stCount > 0 || deptCount > 0) {
                            const sig = `idb_${stCount}_${deptCount}`;
                            if (!seenSignatures.has(sig)) {
                                seenSignatures.add(sig);
                                candidates.push({
                                    title: `ذاكرة المتصفح المتطورة IndexedDB (${ik})`,
                                    sourceDescription: `نسخة كاملة غير مقيدة محفوظة بذاكرة المتصفح`,
                                    type: 'academicData',
                                    key: `idb_${ik}`,
                                    years: years,
                                    totalStudents: stCount,
                                    totalDepts: deptCount,
                                    data: idbVal,
                                    rawSize: JSON.stringify(idbVal).length
                                });
                            }
                        }
                    }
                } catch (e) { }
            })());
        }
    }

    // تحديث القائمة تلقائياً فور انتهاء أي فحص سحابي في الخلفية
    Promise.allSettled(backgroundTasks).then(() => {
        candidates.sort((a, b) => (b.totalStudents - a.totalStudents) || (b.totalDepts - a.totalDepts) || (b.rawSize - a.rawSize));
        window._recoveryCandidates = candidates.slice();
        window.renderRecoveryList(window._recoveryCandidates);
    });
};

window.renderRecoveryList = function (candidates) {
    const listEl = document.getElementById('recoveryList');
    if (!listEl) return;

    if (!candidates || candidates.length === 0) {
        listEl.innerHTML = `
            <div class="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
                <p class="text-amber-800 font-bold mb-1">⚠️ لم يتم العثور على أي نسخ بيانات سابقة تلقائياً في ذاكرة هذا المتصفح.</p>
                <p class="text-amber-700 text-xs">إذا كان لديك ملف نسخ احتياطي بصيغة JSON تم تصديره سابقاً، يرجى الضغط على زر <strong>"📁 اختيار ملف النسخة الاحتياطية"</strong> في الأعلى لاستعادته وتثبيته فوراً.</p>
            </div>
        `;
        return;
    }

    try {
        listEl.innerHTML = candidates.map((cand, idx) => {
            const isRich = cand.totalStudents > 0;
            const borderClass = isRich ? 'border-emerald-300 bg-emerald-50/70' : 'border-slate-200 bg-slate-50';
            const yearsArr = Array.isArray(cand.years) ? cand.years : (cand.years ? [String(cand.years)] : []);
            const yearsStr = yearsArr.length ? yearsArr.join('، ') : 'غير محددة';

            return `
                <div class="border ${borderClass} rounded-xl p-4 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div class="space-y-1 text-right">
                        <div class="flex items-center gap-2">
                            <span class="font-bold text-slate-800 text-sm md:text-base">${cand.title}</span>
                            ${isRich ? '<span class="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">موصى به ⭐</span>' : ''}
                        </div>
                        <p class="text-xs text-slate-500">${cand.sourceDescription}</p>
                        <div class="flex flex-wrap gap-2 text-xs pt-1">
                            <span class="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-lg font-medium">📅 السنوات: ${yearsStr}</span>
                            <span class="bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-lg font-medium">🏫 الأقسام: ${cand.totalDepts || 0}</span>
                            <span class="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-lg font-bold">👨‍🎓 التلاميذ: ${cand.totalStudents || 0}</span>
                        </div>
                    </div>
                    <button type="button" onclick="restoreFromCandidateIndex(${idx})"
                        class="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-btn shrink-0 w-full md:w-auto justify-center cursor-pointer">
                        ✅ استرجاع وتثبيت لحسابي
                    </button>
                </div>
            `;
        }).join('');
    } catch (renderErr) {
        console.error("Error in renderRecoveryList:", renderErr);
        listEl.innerHTML = `<div class="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm">حدث خطأ أثناء عرض النسخ: ${renderErr.message}</div>`;
    }
};

window.restoreFromCandidateIndex = async function (idx) {
    try {
        const candidate = window._recoveryCandidates && window._recoveryCandidates[idx];
        if (!candidate) return alert("البيانات المختارة غير صالحة.");

        const yearsArr = Array.isArray(candidate.years) ? candidate.years : (candidate.years ? [String(candidate.years)] : []);
        const yearsStr = yearsArr.length ? yearsArr.join('، ') : 'غير محددة';
        const confirmMsg = `هل أنت متأكد من استرجاع وتثبيت هذه البيانات لحساب المدير؟\n\nالمصدر: ${candidate.title}\nالسنوات: ${yearsStr}\nعدد التلاميذ: ${candidate.totalStudents || 0}\nعدد الأقسام: ${candidate.totalDepts || 0}\n\nسيتم تحديث النظام وإعادة تشغيل الصفحة فوراً بالبيانات المسترجعة.`;
        if (!confirm(confirmMsg)) return;

        await window.applyRestoredData(candidate);
    } catch (e) {
        console.error("Error in restoreFromCandidateIndex:", e);
        alert("حدث خطأ أثناء الاسترجاع: " + e.message);
    }
};

function restoreFromCandidateIndex(idx) {
    return window.restoreFromCandidateIndex(idx);
}

window.applyRestoredData = async function (candidate) {
    try {
        let newAcData = {};
        let newAcYears = [];
        let newCurYear = "";
        let newInstName = "";
        let newFields = null;

        let rawCandidateData = candidate.data;
        if (typeof rawCandidateData === 'string') {
            try { rawCandidateData = JSON.parse(rawCandidateData); } catch (e) { }
        }

        if (candidate.type === 'academicData') {
            newAcData = rawCandidateData || {};
            newAcYears = (candidate.years && candidate.years.length) ? candidate.years : Object.keys(newAcData);
            newInstName = candidate.institutionName || appStorage.getItem("institutionName") || "";
            try { newFields = candidate.studentFields || JSON.parse(appStorage.getItem("studentFields") || "null"); } catch (e) { }
        } else if (candidate.type === 'fullObject') {
            newAcData = (rawCandidateData && rawCandidateData.academicData) ? rawCandidateData.academicData : (rawCandidateData || {});
            newAcYears = (rawCandidateData && rawCandidateData.academicYears) || candidate.years || Object.keys(newAcData);
            newInstName = (rawCandidateData && rawCandidateData.institutionName) || "";
            newFields = (rawCandidateData && rawCandidateData.studentFields) || null;
        }

        if (typeof newAcData === 'string') {
            try { newAcData = JSON.parse(newAcData); } catch (e) { }
        }
        if (typeof newAcYears === 'string') {
            try { newAcYears = JSON.parse(newAcYears); } catch (e) { newAcYears = [newAcYears]; }
        }

        if (!newAcYears || !Array.isArray(newAcYears) || newAcYears.length === 0) {
            newAcYears = Object.keys(newAcData);
            if (newAcYears.length === 0) newAcYears = ["2025/2026"];
        }

        // اختيار السنة التي تحتوي على أكبر عدد من التلاميذ والأقسام تلقائياً
        let bestYear = "";
        let maxScore = -1;
        newAcYears.forEach(y => {
            const yd = newAcData[y];
            const sCount = (yd && Array.isArray(yd.students)) ? yd.students.length : 0;
            const dCount = (yd && Array.isArray(yd.departments)) ? yd.departments.length : 0;
            const score = (sCount * 100) + dCount;
            if (score > maxScore) {
                maxScore = score;
                bestYear = y;
            }
        });
        if (!bestYear && newAcYears.length > 0) {
            bestYear = newAcYears.includes("2025/2026") ? "2025/2026" : newAcYears[0];
        }
        newCurYear = bestYear;

        const now = new Date().toISOString();
        const activePfx = (typeof appStorage !== 'undefined' && appStorage._getPrefix) ? appStorage._getPrefix() : 'sub_0662065072_';
        const targetAcKey = activePfx + "academicData";

        // 1. أرشفة وحفظ نسخة كاملة وغير مقيدة في IndexedDB
        if (typeof idbManager !== 'undefined') {
            try {
                await idbManager.setItem(targetAcKey, newAcData);
                await idbManager.setItem('sub_0662065072_academicData', newAcData);
                await idbManager.setItem('sub_default_academicData', newAcData);
                await idbManager.setItem('academicData_full', newAcData);
                console.log("[IndexedDB] Full restored data safely archived to IndexedDB.");
            } catch (idbErr) {
                console.warn("[IndexedDB] Archive notice:", idbErr);
            }
        }

        // 2. تجريد صور base64 لحفظ نسخة خفيفة في localStorage دون تجاوز الحصة أبداً (~25 كيلوبايت)
        const strippedAcData = (typeof stripImagesFromAcademicData === 'function')
            ? stripImagesFromAcademicData(newAcData)
            : newAcData;
        const strippedStr = JSON.stringify(strippedAcData);
        const yearsStr = JSON.stringify(newAcYears);
        const fieldsStr = newFields ? JSON.stringify(newFields) : "null";

        // 3. تثبيت البيانات في localStorage لجميع البادئات الأساسية لضمان ظهورها مهما كانت حالة تسجيل الدخول
        const prefixesToPopulate = [activePfx, 'sub_0662065072_', 'sub_default_', ''];
        prefixesToPopulate.forEach(pfx => {
            try {
                localStorage.setItem(pfx + "academicData", strippedStr);
                localStorage.setItem(pfx + "academicYears", yearsStr);
                localStorage.setItem(pfx + "currentAcademicYear", newCurYear);
                if (newInstName) localStorage.setItem(pfx + "institutionName", newInstName);
                if (newFields) localStorage.setItem(pfx + "studentFields", fieldsStr);
                localStorage.setItem(pfx + "lastUpdated", now);
            } catch (storageErr) {
                console.warn(`[Restore] Error writing keys for prefix '${pfx}':`, storageErr);
            }
        });

        // 4. تحديث المتغيرات العامة في الذاكرة الحالية فوراً (تحتوي على البيانات كاملة مع الصور)
        academicData = newAcData;
        academicYears = newAcYears;
        currentAcademicYear = newCurYear;
        if (newInstName) institutionName = newInstName;
        if (newFields) studentFields = newFields;

        if (typeof loadDataForCurrentYear === 'function') {
            try { loadDataForCurrentYear(); } catch(e){}
        }
        if (typeof refreshUI === 'function') {
            try { refreshUI(); } catch(e){}
        }

        // 5. حفظ البيانات في السحابة مع انتظار انتهاء العملية لضمان عدم فقدانها عند إعادة التحميل
        const dataToSave = {
            academicData: strippedAcData,
            academicYears: newAcYears,
            currentAcademicYear: newCurYear,
            studentFields: newFields || [],
            institutionName: newInstName || '',
            lastUpdated: now,
            lastUpdatedBy: (typeof instanceId !== 'undefined') ? instanceId : 'restore_direct'
        };

        if (typeof saveUserData === 'function') {
            try {
                await saveUserData(dataToSave);
                console.log("[Restore] Successfully synced restored data to Firestore.");
            } catch (fsErr) {
                console.warn("[Restore] Firestore sync warning:", fsErr);
            }
        }

        if (typeof db !== 'undefined') {
            try {
                const targetDocId = (typeof currentSession !== 'undefined' && currentSession && currentSession.phone)
                    ? currentSession.phone
                    : '0662065072';
                await db.ref('backup/' + targetDocId).set(dataToSave);
                await db.ref('backup/latest').set(dataToSave);
                console.log("[Restore] Successfully synced restored data to RTDB.");
            } catch (rtdbErr) {
                console.warn("[Restore] RTDB sync warning:", rtdbErr);
            }
        }

        alert(`🎉 تم استرجاع وتثبيت البيانات بنجاح!\nتم استعادة ${candidate.totalStudents} تلميذاً و ${candidate.totalDepts} قسماً للسنة الدراسية (${newCurYear}).\nسيتم تحديث الصفحة الآن لتطبيق البيانات كاملة.`);
        window.location.reload();

    } catch (err) {
        console.error("Critical error in applyRestoredData:", err);
        alert("حدث خطأ أثناء استرجاع البيانات: " + err.message);
    }
};

window.checkAndAutoRecoverData = async function () {
    let currentTotalStudents = 0;
    if (academicData && typeof academicData === 'object') {
        Object.values(academicData).forEach(yd => {
            if (yd && Array.isArray(yd.students)) currentTotalStudents += yd.students.length;
        });
    }

    if (currentTotalStudents === 0) {
        console.log("[Auto-Recovery] Current session has 0 students. Scanning for previous data...");

        // 1. فحص النسخة المعتمدة المدمجة أولاً (أسرع وأضمن خيار)
        if (typeof window !== 'undefined' && window.__EMBEDDED_BACKUP_RECOVERY__) {
            const emb = window.__EMBEDDED_BACKUP_RECOVERY__;
            if (emb && emb.academicData) {
                let stCount = 0;
                let deptCount = 0;
                const years = Array.isArray(emb.academicYears) ? emb.academicYears : Object.keys(emb.academicData);
                years.forEach(y => {
                    const yd = emb.academicData[y];
                    if (yd) {
                        if (Array.isArray(yd.students)) stCount += yd.students.length;
                        if (Array.isArray(yd.departments)) deptCount += yd.departments.length;
                    }
                });
                if (stCount > 0) {
                    console.log(`[Auto-Recovery] Auto-restoring from embedded master backup (${stCount} students)...`);
                    await window.applyRestoredData({
                        type: 'fullObject',
                        data: emb,
                        years: years,
                        totalStudents: stCount,
                        totalDepts: deptCount,
                        title: 'النسخة المعتمدة المدمجة بالنظام'
                    });
                    return true;
                }
            }
        }

        // 2. فحص IndexedDB
        if (typeof idbManager !== 'undefined') {
            const idbKeys = ['academicData_full', 'sub_0662065072_academicData', 'academicData'];
            for (const ik of idbKeys) {
                try {
                    const idbVal = await idbManager.getItem(ik);
                    if (idbVal && typeof idbVal === 'object') {
                        let stCount = 0;
                        let deptCount = 0;
                        const years = Object.keys(idbVal);
                        years.forEach(y => {
                            if (idbVal[y]) {
                                if (Array.isArray(idbVal[y].students)) stCount += idbVal[y].students.length;
                                if (Array.isArray(idbVal[y].departments)) deptCount += idbVal[y].departments.length;
                            }
                        });
                        if (stCount > 0) {
                            console.log(`[Auto-Recovery] Auto-restoring from IndexedDB '${ik}' (${stCount} students)...`);
                            await window.applyRestoredData({
                                type: 'academicData',
                                data: idbVal,
                                years: years,
                                totalStudents: stCount,
                                totalDepts: deptCount,
                                title: `IndexedDB (${ik})`
                            });
                            return true;
                        }
                    }
                } catch (e) { }
            }
        }

        // 3. فحص مفاتيح localStorage السابقة
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;
            const raw = localStorage.getItem(key);
            if (!raw || raw.length < 50) continue;

            try {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') {
                    let stCount = 0;
                    let deptCount = 0;
                    let years = [];
                    let targetData = parsed;

                    if (parsed.academicData) {
                        targetData = parsed.academicData;
                        years = parsed.academicYears || Object.keys(targetData);
                    } else {
                        years = Object.keys(parsed);
                    }

                    years.forEach(y => {
                        if (targetData[y]) {
                            if (Array.isArray(targetData[y].students)) stCount += targetData[y].students.length;
                            if (Array.isArray(targetData[y].departments)) deptCount += targetData[y].departments.length;
                        }
                    });

                    if (stCount > 0) {
                        console.log(`[Auto-Recovery] Found previous data in '${key}' with ${stCount} students. Restoring...`);
                        await window.applyRestoredData({
                            type: 'academicData',
                            data: targetData,
                            years: years,
                            totalStudents: stCount,
                            totalDepts: deptCount,
                            title: key
                        });
                        return true;
                    }
                }
            } catch (e) { }
        }
    }
    return false;
};
