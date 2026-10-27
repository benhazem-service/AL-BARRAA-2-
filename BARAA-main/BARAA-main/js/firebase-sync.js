// ============================================================
// === 3. المزامنة السحابية وقاعدة البيانات (Firebase Sync) ===
// ============================================================

let lastCloudError = "";
let fsUnsubscribe = null;
let globalUnsubscribe = null;

// تحديث مؤشر حالة السحابة في الشريط العلوي
function updateCloudStatus(status, errorMsg = "") {
    const statusEl = document.getElementById('cloudStatus');
    if (!statusEl) return;

    if (errorMsg) lastCloudError = errorMsg;
    statusEl.classList.remove('hidden', 'text-yellow-600', 'text-green-600', 'text-red-600', 'text-blue-600');
    statusEl.onclick = null;
    statusEl.style.cursor = "default";

    if (status === 'saving') {
        statusEl.innerHTML = `<i data-feather="loader" class="w-3 h-3 animate-spin inline"></i> جاري الحفظ...`;
        statusEl.classList.add('text-yellow-600');
        statusEl.title = "";
    } else if (status === 'saved') {
        statusEl.innerHTML = `<i data-feather="check" class="w-3 h-3 inline"></i> تم الحفظ`;
        statusEl.classList.add('text-green-600');
        statusEl.title = "";
        setTimeout(() => statusEl.classList.add('hidden'), 3000);
    } else if (status === 'error') {
        statusEl.innerHTML = `<i data-feather="cloud-off" class="w-3 h-3 inline"></i> السحابة غير متصلة`;
        statusEl.classList.add('text-red-600');
        statusEl.style.cursor = "help";
        statusEl.title = "انقر لمزيد من التفاصيل عن الخطأ";
        statusEl.onclick = () => {
            if (lastCloudError) alert("⚠️ تفاصيل الخطأ:\n" + lastCloudError);
            else alert("⚠️ فشل الاتصال بالسحابة. تأكد من إعدادات Firebase وتفعيل Anonymous Auth.");
        };
    } else if (status === 'synced-remote') {
        statusEl.innerHTML = `<i data-feather="refresh-cw" class="w-3 h-3 inline"></i> تمت المزامنة`;
        statusEl.classList.add('text-blue-600');
        statusEl.title = "";
        setTimeout(() => statusEl.classList.add('hidden'), 3000);
    }

    if (typeof feather !== 'undefined') feather.replace();
}

// تسجيل الدخول المجهول (Anonymous) لدعم صلاحيات Firebase
async function signIn() {
    if (window.location.protocol === 'file:') {
        console.log("Firebase Auth is disabled on file://. Accessing Firestore directly using fallback cloudUserId.");
        return;
    }

    try {
        console.log("Attempting anonymous sign-in...");
        await auth.signInAnonymously();
        updateCloudStatus('synced-remote');
    } catch (error) {
        console.error("Anonymous Auth Full Error:", error);
        let msg = error.message;
        if (error.code === 'auth/operation-not-allowed') {
            msg = "خاصية Anonymous Auth معطلة في Firebase Console. يرجى تفعيلها.";
        }
        updateCloudStatus('error', msg);
    }
}

// بدء مزامنة وثيقة المستخدم مع Firestore في الوقت الحقيقي
function startFirestoreSync(docId) {
    if (!docId) return;
    if (fsUnsubscribe) fsUnsubscribe();
    console.log("Starting Firestore sync for docId:", docId);

    fsUnsubscribe = fs.collection('users').doc(docId).onSnapshot(async doc => {
        if (doc.exists) {
            const data = doc.data();
            if (data.lastUpdatedBy === instanceId) return;

            // حماية البيانات المحلية: حساب عدد التلاميذ والأقسام محلياً وفي السحابة
            let localStudentsCount = 0;
            let localDeptsCount = 0;
            try {
                const localAc = JSON.parse(appStorage.getItem("academicData") || "{}");
                for (const y in localAc) {
                    if (localAc[y]) {
                        if (Array.isArray(localAc[y].students)) localStudentsCount += localAc[y].students.length;
                        if (Array.isArray(localAc[y].departments)) localDeptsCount += localAc[y].departments.length;
                    }
                }
            } catch (e) { }

            let remoteStudentsCount = 0;
            let remoteDeptsCount = 0;
            if (data.academicData && typeof data.academicData === 'object') {
                for (const y in data.academicData) {
                    const yd = data.academicData[y];
                    if (yd) {
                        if (Array.isArray(yd.students)) remoteStudentsCount += yd.students.length;
                        if (Array.isArray(yd.departments)) remoteDeptsCount += yd.departments.length;
                    }
                }
            }

            // إن كان التخزين المحلي يحتوي على بيانات أكثر من السحابة، لا نسمح بمسح البيانات المحلية أبداً
            if (localStudentsCount > remoteStudentsCount || (localStudentsCount === remoteStudentsCount && localDeptsCount > remoteDeptsCount)) {
                console.log(`[Safety Shield] Local has more data (students: ${localStudentsCount}, depts: ${localDeptsCount}) than cloud (students: ${remoteStudentsCount}, depts: ${remoteDeptsCount}). Preserving local data and updating cloud.`);
                saveToFirebase();
                return;
            }

            // إن كان التخزين المحلي يحتوي على تلاميذ والسحابة فارغة، لا نسمح بمسح البيانات المحلية أبداً
            if (localStudentsCount > 0 && remoteStudentsCount === 0) {
                console.log(`[Safety Shield] Local has ${localStudentsCount} students but cloud has 0. Preserving local data and updating cloud.`);
                saveToFirebase();
                return;
            }

            const localLastUpdated = appStorage.getItem("lastUpdated");
            if (localLastUpdated && data.lastUpdated && new Date(localLastUpdated) > new Date(data.lastUpdated)) {
                console.log("Local is strictly newer. Pushing to cloud.");
                saveToFirebase();
                return;
            }
            console.log("Syncing Firestore data from remote device...");
            syncLocalData(data);
        } else {
            // وثيقة Firestore غير موجودة: إذا كان المستخدم مديراً، نبحث في وثيقة 'latest' كاحتياطي
            if (docId === '0662065072' || (typeof currentSession !== 'undefined' && currentSession && currentSession.isAdmin)) {
                try {
                    const latestDoc = await fs.collection('users').doc('latest').get();
                    if (latestDoc.exists) {
                        const lData = latestDoc.data();
                        if (lData && lData.academicData && Object.keys(lData.academicData).length > 0) {
                            console.log("Restoring admin data from Firestore 'latest' document...");
                            await saveUserData(lData);
                            syncLocalData(lData);
                            return;
                        }
                    }
                } catch (err) {
                    console.log("Error checking Firestore 'latest':", err);
                }
            }
            migrateFromRTDB(docId);
        }
    }, error => {
        console.error("Firestore Sync Error:", error);
        updateCloudStatus('error', error.message);
    });
}

// الاستماع للإعدادات العامة المشتركة
function listenToGlobalSettings() {
    if (globalUnsubscribe) globalUnsubscribe();
    console.log("Listening to global settings...");

    globalUnsubscribe = fs.collection('settings').doc('global').onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            let lastSeenGlobalYear = appStorage.getItem("lastSeenGlobalYear");
            let needsRefresh = false;

            if (data.academicYears) {
                appStorage.setItem("academicYears", JSON.stringify(data.academicYears));
                academicYears = data.academicYears;
                needsRefresh = true;
            }

            if (data.currentAcademicYear && data.currentAcademicYear !== lastSeenGlobalYear) {
                appStorage.setItem("lastSeenGlobalYear", data.currentAcademicYear);
                const userSavedYear = (typeof currentSession !== 'undefined' && currentSession && currentSession.phone)
                    ? localStorage.getItem('user_year_' + currentSession.phone)
                    : null;
                if (!userSavedYear || (currentSession && currentSession.isAdmin)) {
                    appStorage.setItem("currentAcademicYear", data.currentAcademicYear);
                    currentAcademicYear = data.currentAcademicYear;
                    needsRefresh = true;
                }
            }

            if (needsRefresh) {
                let acData = JSON.parse(appStorage.getItem("academicData") || "{}");
                let changedAcData = false;
                academicYears.forEach(year => {
                    if (!acData[year]) {
                        acData[year] = {
                            departments: [],
                            students: [],
                            subjects: [],
                            grades: {},
                            monthlyGrades: {},
                            studentReports: {},
                            reportImagesByGender: { 'ذكر': [], 'أنثى': [] }
                        };
                        changedAcData = true;
                    }
                });
                if (changedAcData) {
                    appStorage.setItem("academicData", JSON.stringify(acData));
                    academicData = acData;
                }

                try {
                    renderAcademicYears();
                    loadDataForCurrentYear();
                    refreshUI();
                } catch (e) {
                    console.error("Error refreshing UI after global settings update:", e);
                }
            }
        }
    }, error => {
        console.error("Global Settings Sync Error:", error);
    });
}

// مراقبة حالة المصادقة السحابية
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        console.log("Logged in anonymously as:", user.uid);
        // إذا كان هناك جلسة هاتف نشطة (مثل حساب المدير أو مشترك)، نحافظ على رقم الهاتف كمعرف
        if (typeof currentSession !== 'undefined' && currentSession && currentSession.phone) {
            cloudUserId = currentSession.phone;
        } else {
            cloudUserId = user.uid;
            appStorage.setItem("cloudUserId", user.uid);
        }
        startFirestoreSync(cloudUserId);
        listenToGlobalSettings();
    } else {
        currentUser = null;
        console.log("Not logged in. Using fallback cloudUserId:", cloudUserId);
        startFirestoreSync(cloudUserId);
        listenToGlobalSettings();
        signIn();
    }
});

// استيراد النسخة الاحتياطية من Realtime Database عند أول تشغيل
async function migrateFromRTDB(docId) {
    try {
        let snapshot = await db.ref('backup/' + docId).once('value');
        let data = snapshot.val();

        // لحساب المدير: إن لم نجد backup/docId، نبحث في backup/latest
        if (!data && (docId === '0662065072' || (typeof currentSession !== 'undefined' && currentSession && currentSession.isAdmin))) {
            console.log("Checking backup/latest for Admin backup in RTDB...");
            try {
                const latestSnap = await db.ref('backup/latest').once('value');
                data = latestSnap.val();
            } catch (err) {
                console.log("RTDB backup/latest read error:", err);
            }
        }

        if (data) {
            console.log("Migrating data from RTDB to Firestore...");
            await saveUserData(data);
            syncLocalData(data);
        } else {
            console.log("No previous backup found for this user in RTDB.");
            const localAcademicData = appStorage.getItem("academicData");
            if (localAcademicData && localAcademicData !== "{}" && localAcademicData !== "[]") {
                console.log("Local storage has data. Triggering save to cloud.");
                saveToFirebase();
            } else {
                console.log("No remote or local data found. Standing by for data entry or recovery.");
            }
        }
    } catch (e) {
        console.error("Migration Error:", e);
    }
}

// تطبيق البيانات المستلمة من السحابة على التخزين المحلي والواجهة
function syncLocalData(data) {
    let localDataChanged = false;
    let localAcademicData = JSON.parse(appStorage.getItem("academicData") || "{}");

    if (data.academicData) {
        Object.keys(data.academicData).forEach(year => {
            if (!localAcademicData[year]) localAcademicData[year] = {};
            const cloudYear = data.academicData[year];
            const localYear = localAcademicData[year];

            ['departments', 'students', 'subjects', 'grades', 'monthlyGrades', 'studentReports', 'reportActivities', 'reportBehaviors', 'generalObservations', 'reportSessions', 'absences', 'scoreObservations', 'customFinalAverageLabels', 'globalFinalAverageLabel'].forEach(key => {
                if (cloudYear[key] !== undefined) {
                    // حماية البيانات: لا نسمح أبداً بمصفوفة سحابية فارغة بمسح بيانات محلية موجودة ومكتملة!
                    if (Array.isArray(localYear[key]) && localYear[key].length > 0 && Array.isArray(cloudYear[key]) && cloudYear[key].length === 0) {
                        console.log(`[Sync Shield] Preserved local non-empty '${key}' (${localYear[key].length} items) against empty cloud array.`);
                        return;
                    }
                    localYear[key] = cloudYear[key];
                }
            });

            if (localYear.students && cloudYear.students) {
                const cloudStudentsMap = new Map((cloudYear.students || []).map(s => [s.id, s]));
                localYear.students.forEach(ls => {
                    const cs = cloudStudentsMap.get(ls.id);
                    if (cs && cs.info && !cs.info['صورة'] && ls.info && ls.info['صورة']) {
                        cs.info['صورة'] = ls.info['صورة'];
                    }
                });
            }

            if (!cloudYear.reportImagesByGender && localYear.reportImagesByGender) {
                // الحفاظ على الصور المحلية
            } else if (cloudYear.reportImagesByGender) {
                localYear.reportImagesByGender = cloudYear.reportImagesByGender;
            }
        });

        appStorage.setItem("academicData", JSON.stringify(localAcademicData));
        academicData = localAcademicData;
        localDataChanged = true;
    }

    if (data.academicYears) {
        const mergedYears = Array.from(new Set([...(academicYears || []), ...(data.academicYears || [])]));
        appStorage.setItem("academicYears", JSON.stringify(mergedYears));
        academicYears = mergedYears;
        localDataChanged = true;
    }

    if (data.studentFields) {
        appStorage.setItem("studentFields", JSON.stringify(data.studentFields));
        studentFields = data.studentFields;
        localDataChanged = true;
    }

    if (data.currentAcademicYear) {
        const userSavedYear = (typeof currentSession !== 'undefined' && currentSession && currentSession.phone)
            ? localStorage.getItem('user_year_' + currentSession.phone)
            : null;
        if (!userSavedYear || data.currentAcademicYear === userSavedYear) {
            appStorage.setItem("currentAcademicYear", data.currentAcademicYear);
            currentAcademicYear = data.currentAcademicYear;
            localDataChanged = true;
        }
    }

    if (data.institutionName !== undefined) {
        appStorage.setItem("institutionName", data.institutionName);
        institutionName = data.institutionName;
        localDataChanged = true;
    }

    if (data.lastUpdated) {
        appStorage.setItem("lastUpdated", data.lastUpdated);
    }

    if (localDataChanged) {
        loadDataForCurrentYear();
        refreshUI();
    } else {
        refreshUI();
    }
    updateCloudStatus('synced-remote');
}

// دالة حفظ الوثيقة في Firestore
async function saveUserData(data) {
    const targetDocId = (typeof currentSession !== 'undefined' && currentSession && currentSession.phone)
        ? currentSession.phone
        : (cloudUserId || (currentUser ? currentUser.uid : 'default'));

    if (!targetDocId) {
        console.warn("Save failed: No persistent cloudUserId or UID available.");
        updateCloudStatus('error');
        return;
    }
    try {
        updateCloudStatus('saving');
        await fs.collection('users').doc(targetDocId).set(data);
        updateCloudStatus('saved');
    } catch (error) {
        console.error("Firestore Save Error:", error);
        updateCloudStatus('error', error.message);
        if (error.code === 'permission-denied') {
            console.error("Firestore Permission Denied. Check your Security Rules.");
        }
    }
}

// دالة مساعدة لتأخير التنفيذ (Debounce)
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// تفريغ الصور قبل الرفع للسحابة لتوفير استهلاك مساحة Firestore
if (typeof stripImagesFromAcademicData !== 'function') {
    window.stripImagesFromAcademicData = function (rawData) {
        if (!rawData || typeof rawData !== 'object') return rawData;
        const stripped = JSON.parse(JSON.stringify(rawData));
        for (const year in stripped) {
            if (stripped[year].reportImagesByGender) {
                delete stripped[year].reportImagesByGender;
            }
            if (stripped[year].students && Array.isArray(stripped[year].students)) {
                stripped[year].students = stripped[year].students.map(s => {
                    const clean = { ...s };
                    if (clean.info && clean.info['صورة']) {
                        clean.info = { ...clean.info };
                        delete clean.info['صورة'];
                    }
                    return clean;
                });
            }
        }
        return stripped;
    };
}

// دالة حفظ البيانات كاملة في السحابة (Firestore + RTDB كنسخ احتياطي)
function saveToFirebase() {
    const rawAcademicData = JSON.parse(appStorage.getItem("academicData") || "{}");
    const dataToSave = {
        academicData: stripImagesFromAcademicData(rawAcademicData),
        academicYears: JSON.parse(appStorage.getItem("academicYears") || "[]"),
        studentFields: JSON.parse(appStorage.getItem("studentFields") || "[]"),
        currentAcademicYear: appStorage.getItem("currentAcademicYear"),
        institutionName: appStorage.getItem("institutionName"),
        lastUpdated: new Date().toISOString(),
        lastUpdatedBy: instanceId
    };

    appStorage.setItem("lastUpdated", dataToSave.lastUpdated);

    // الحفظ في Firestore كأساس
    saveUserData(dataToSave);

    // الحفظ في Realtime Database كنسخ احتياطي
    const targetDocId = (typeof currentSession !== 'undefined' && currentSession && currentSession.phone)
        ? currentSession.phone
        : (cloudUserId || (currentUser ? currentUser.uid : 'default'));

    db.ref('backup/' + targetDocId).set(dataToSave)
        .then(() => {
            updateCloudStatus('saved');
        })
        .catch((error) => {
            console.error("Firebase Auto-Save Error:", error);
            updateCloudStatus('error', error.message);
        });
}

// حفظ تلقائي مؤجل بعد ثانيتين من آخر تعديل
const autoSaveToFirebase = debounce(() => saveToFirebase(), 2000);
