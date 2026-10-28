// ============================================================
// === 1. إعدادات النظام والتخزين المحلي وقاعدة البيانات ===
// ============================================================

// --- مخزن IndexedDB للبيانات الضخمة والصور لحمايتها من قيود 5MB في localStorage ---
const idbManager = {
    dbName: 'BaraaAcademicDB',
    version: 1,
    storeName: 'academicStore',

    _getDB() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                return reject(new Error("IndexedDB not supported"));
            }
            const request = indexedDB.open(this.dbName, this.version);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };
            request.onsuccess = (e) => resolve(e.target.result);
            request.onerror = (e) => reject(e.target.error);
        });
    },

    async setItem(key, val) {
        try {
            const db = await this._getDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.storeName, 'readwrite');
                const store = tx.objectStore(this.storeName);
                const req = store.put(val, key);
                req.onsuccess = () => resolve(true);
                req.onerror = (e) => reject(e.target.error);
            });
        } catch (e) {
            console.warn("[IndexedDB] setItem notice:", e);
            return false;
        }
    },

    async getItem(key) {
        try {
            const db = await this._getDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.storeName, 'readonly');
                const store = tx.objectStore(this.storeName);
                const req = store.get(key);
                req.onsuccess = () => resolve(req.result);
                req.onerror = (e) => reject(e.target.error);
            });
        } catch (e) {
            console.warn("[IndexedDB] getItem notice:", e);
            return null;
        }
    },

    async removeItem(key) {
        try {
            const db = await this._getDB();
            return new Promise((resolve, reject) => {
                const tx = db.transaction(this.storeName, 'readwrite');
                const store = tx.objectStore(this.storeName);
                const req = store.delete(key);
                req.onsuccess = () => resolve(true);
                req.onerror = (e) => reject(e.target.error);
            });
        } catch (e) {
            return false;
        }
    }
};
window.idbManager = idbManager;

// --- تفريغ صور base64 لتصغير حجم البيانات للتخزين في localStorage و Firestore ---
function stripImagesFromAcademicData(rawData) {
    if (!rawData || typeof rawData !== 'object') return rawData;
    let stripped;
    try {
        stripped = JSON.parse(JSON.stringify(rawData));
    } catch (e) {
        return rawData;
    }
    for (const year in stripped) {
        const yd = stripped[year];
        if (!yd || typeof yd !== 'object') continue;

        if (yd.reportImagesByGender) {
            yd.reportImagesByGender = { 'ذكر': [], 'أنثى': [] };
        }
        if (Array.isArray(yd.students)) {
            yd.students.forEach(s => {
                if (s) {
                    if (s.photo) delete s.photo;
                    if (s.image) delete s.image;
                    if (s.info && typeof s.info === 'object') {
                        if (s.info['صورة']) delete s.info['صورة'];
                        if (s.info['الصورة']) delete s.info['الصورة'];
                    }
                }
            });
        }
        if (yd.studentReports && typeof yd.studentReports === 'object') {
            for (const sid in yd.studentReports) {
                if (yd.studentReports[sid] && yd.studentReports[sid].photo) {
                    delete yd.studentReports[sid].photo;
                }
            }
        }
    }
    return stripped;
}
window.stripImagesFromAcademicData = stripImagesFromAcademicData;

// --- مدير التخزين المحلي مع دعم جلسات المستخدمين المتعددة والاسترجاع التلقائي ---
const appStorage = {
    _getPrefix: () => {
        try {
            const session = JSON.parse(localStorage.getItem("sub_appSession") || "null");
            if (session && session.phone) return "sub_" + session.phone + "_";
        } catch (e) { }
        return "sub_" + (localStorage.getItem("sub_cloudUserId") || "default") + "_";
    },
    getItem: (k) => {
        if (k === 'appSession' || k === 'cloudUserId' || k === 'firebaseDatabaseURL' || k === 'lastSeenGlobalYear') {
            return localStorage.getItem("sub_" + k);
        }

        // إذا كان المفتاح هو السنة الدراسية الحالية، نتحقق أولاً من التثبيت المخصص للمستخدم
        if (k === 'currentAcademicYear') {
            try {
                const session = JSON.parse(localStorage.getItem("sub_appSession") || "null");
                if (session && session.phone) {
                    const pinned = localStorage.getItem("user_year_" + session.phone);
                    if (pinned && pinned !== 'null' && pinned !== 'undefined' && pinned.trim() !== '') {
                        return pinned;
                    }
                }
            } catch (e) { }
        }

        const pfxKey = appStorage._getPrefix() + k;
        let val = localStorage.getItem(pfxKey);

        // إذا كان المفتاح academicData، نتحقق من احتوائه على تلاميذ أو أقسام حقيقية
        if (k === 'academicData') {
            let hasRealContent = false;
            if (val && val !== '{}' && val !== '[]' && val !== 'null' && val.trim() !== '') {
                try {
                    const parsed = JSON.parse(val);
                    for (const y in parsed) {
                        const yd = parsed[y];
                        if (yd && ((Array.isArray(yd.students) && yd.students.length > 0) || (Array.isArray(yd.departments) && yd.departments.length > 0))) {
                            hasRealContent = true;
                            break;
                        }
                    }
                } catch (e) { }
            }
            if (hasRealContent) {
                return val;
            }
            // إذا كان val فارغاً أو به 0 تلاميذ و 0 أقسام، نبحث في المخازن الأخرى
            val = null;
        } else {
            if (val && val !== '{}' && val !== '[]' && val !== 'null' && val.trim() !== '') {
                return val;
            }
        }

        // استرجاع احتياطي تلقائي للبيانات الأساسية إن لم توجد تحت البادئة الحالية
        const CORE_DATA_KEYS = ['academicData', 'academicYears', 'currentAcademicYear', 'studentFields', 'institutionName', 'departments', 'students'];
        if (CORE_DATA_KEYS.includes(k)) {
            // للمشترك الفرعي (غير الأدمن): نمنع استعارة بيانات المشرف لضمان استقلالية الحساب ومطابقته للسحابة
            try {
                const s = JSON.parse(localStorage.getItem("sub_appSession") || "null");
                if (s && !s.isAdmin) {
                    return val;
                }
            } catch (e) { }

            const candidateKeys = [
                'sub_0662065072_' + k,
                'sub_default_' + k,
                k // بدون أي بادئة (النظام الأصلي)
            ];

            try {
                for (let i = 0; i < localStorage.length; i++) {
                    const lk = localStorage.key(i);
                    if (lk && (lk === k || lk.endsWith('_' + k)) && !candidateKeys.includes(lk)) {
                        candidateKeys.push(lk);
                    }
                }
            } catch (e) { }

            let bestVal = null;
            let bestScore = -1;

            for (const candKey of candidateKeys) {
                if (candKey === pfxKey) continue;
                try {
                    const cVal = localStorage.getItem(candKey);
                    if (cVal && cVal !== '{}' && cVal !== '[]' && cVal !== 'null' && cVal.trim() !== '') {
                        if (k === 'academicData') {
                            let sCount = 0;
                            let dCount = 0;
                            try {
                                const parsed = JSON.parse(cVal);
                                for (const y in parsed) {
                                    if (parsed[y]) {
                                        if (Array.isArray(parsed[y].students)) sCount += parsed[y].students.length;
                                        if (Array.isArray(parsed[y].departments)) dCount += parsed[y].departments.length;
                                    }
                                }
                            } catch (e) { }
                            const score = (sCount * 100) + dCount;
                            if (score > bestScore) {
                                bestScore = score;
                                bestVal = cVal;
                            }
                        } else {
                            if (cVal.length > bestScore) {
                                bestScore = cVal.length;
                                bestVal = cVal;
                            }
                        }
                    }
                } catch (e) { }
            }

            if (bestVal) {
                console.log(`[Auto-Recovery] Found '${k}' in candidate key, restoring to '${pfxKey}'`);
                try {
                    localStorage.setItem(pfxKey, bestVal);
                } catch (e) {
                    if (k === 'academicData') {
                        try {
                            const parsed = JSON.parse(bestVal);
                            const stripped = stripImagesFromAcademicData(parsed);
                            localStorage.setItem(pfxKey, JSON.stringify(stripped));
                        } catch (e2) { }
                    }
                }
                return bestVal;
            }
        }

        return val;
    },
    setItem: (k, v) => {
        if (k === 'appSession' || k === 'cloudUserId' || k === 'firebaseDatabaseURL' || k === 'lastSeenGlobalYear') {
            return localStorage.setItem("sub_" + k, v);
        }
        const fullKey = appStorage._getPrefix() + k;
        try {
            localStorage.setItem(fullKey, v);
            if (k === 'academicData' && typeof idbManager !== 'undefined') {
                try { idbManager.setItem(fullKey, JSON.parse(v)); } catch (e) { }
            }
        } catch (e) {
            if (k === 'academicData') {
                console.warn(`[appStorage] Quota exceeded on setItem('${fullKey}'). Applying fallback...`, e);
                try {
                    // 1. حفظ في IndexedDB أولاً
                    if (typeof idbManager !== 'undefined') {
                        try { idbManager.setItem(fullKey, JSON.parse(v)); } catch (errIdb) { }
                    }
                    // 2. تنظيف النسخ المكررة غير النشطة في localStorage
                    const cleanupKeys = ['academicData', 'sub_default_academicData', 'sub_academicData'];
                    cleanupKeys.forEach(dk => {
                        if (dk !== fullKey) {
                            try { localStorage.removeItem(dk); } catch (errR) { }
                        }
                    });
                    // محاولة حفظ النسخة الكاملة بعد تنظيف المفاتيح القديمة
                    try {
                        localStorage.removeItem(fullKey);
                        localStorage.setItem(fullKey, v);
                        console.log(`[appStorage] Saved full '${fullKey}' after cleaning stale keys.`);
                        return;
                    } catch (e2) { }

                    // 3. تجريد صور base64 من نسخة التخزين المحلي لضمان نجاح الحفظ دائماً
                    const parsed = JSON.parse(v);
                    const stripped = stripImagesFromAcademicData(parsed);
                    localStorage.removeItem(fullKey);
                    localStorage.setItem(fullKey, JSON.stringify(stripped));
                    console.log(`[appStorage] Saved lightweight '${fullKey}' without images to localStorage.`);
                    return;
                } catch (fallbackErr) {
                    console.error(`[appStorage] Fallback save failed for '${fullKey}':`, fallbackErr);
                }
            } else {
                // معالجة آمنة لأي مفاتيح أخرى عند امتلاء مساحة التخزين
                try {
                    console.warn(`[appStorage] Quota exceeded on setItem('${fullKey}'). Freeing space...`);
                    const cleanupKeys = ['academicData', 'sub_default_academicData', 'sub_academicData'];
                    cleanupKeys.forEach(dk => {
                        if (dk !== fullKey) {
                            try { localStorage.removeItem(dk); } catch (errR) { }
                        }
                    });
                    localStorage.setItem(fullKey, v);
                    return;
                } catch (cleanupErr) {
                    console.error(`[appStorage] Failed to save '${fullKey}' even after cleanup:`, cleanupErr);
                }
            }
        }
    },
    removeItem: (k) => {
        if (k === 'appSession' || k === 'cloudUserId' || k === 'firebaseDatabaseURL' || k === 'lastSeenGlobalYear') {
            return localStorage.removeItem("sub_" + k);
        }
        localStorage.removeItem(appStorage._getPrefix() + k);
    }
};

// معرف جلسة فريد لمنع تكرار التحديثات الذاتية
const instanceId = Date.now().toString() + Math.random().toString().slice(2, 6);

// --- وظيفة ضغط الصور لتقليل الحجم ---
async function compressImage(file, maxWidth = 600, quality = 0.6) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// دالة hash بسيطة لتشفير كلمة السر
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'h' + Math.abs(hash).toString(36);
}

// تنظيف وتوحيد أرقام الهواتف (الأرقام العربية، المسافات، المفتاح الدولي)
function normalizePhone(phone) {
    if (!phone) return '';
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    let cleaned = phone.toString().trim();
    arabicDigits.forEach((d, idx) => {
        cleaned = cleaned.split(d).join(idx.toString());
    });
    cleaned = cleaned.replace(/[\s\-\.\(\)]/g, '');
    if (cleaned.startsWith('+212')) cleaned = '0' + cleaned.slice(4);
    else if (cleaned.startsWith('00212')) cleaned = '0' + cleaned.slice(5);
    else if (cleaned.startsWith('212') && cleaned.length >= 10) cleaned = '0' + cleaned.slice(3);
    return cleaned;
}

// --- إعدادات Firebase ---
const defaultDbUrl = "https://ustad-bilal-default-rtdb.firebaseio.com";
let savedDatabaseURL = appStorage.getItem("firebaseDatabaseURL") || defaultDbUrl;

const firebaseConfig = {
    apiKey: "AIzaSyCy2livge5Mfjl1-fcYAtDY38dsSiXMm8g",
    authDomain: "ustad-bilal.firebaseapp.com",
    databaseURL: savedDatabaseURL,
    projectId: "ustad-bilal",
    storageBucket: "ustad-bilal.firebasestorage.app",
    messagingSenderId: "861185596180",
    appId: "1:861185596180:web:93b7f3311294808d9a0001",
    measurementId: "G-8QWMYCCPKW"
};

// تهيئة Firebase
if (!firebase.apps.length) {
    try {
        const app = firebase.initializeApp(firebaseConfig);
        firebase.analytics();
    } catch (e) {
        console.error("Firebase Init Error", e);
    }
} else {
    firebase.app();
}

// تحديث رابط قاعدة البيانات
function updateFirebaseConfig(newUrl) {
    if (!newUrl) return;
    appStorage.setItem("firebaseDatabaseURL", newUrl);
    alert("تم حفظ الرابط. سيتم إعادة تحميل الصفحة لتطبيق التغييرات.");
    location.reload();
}

const saveFbBtn = document.getElementById('saveFirebaseConfig');
if (saveFbBtn) {
    saveFbBtn.addEventListener('click', () => {
        const url = document.getElementById('firebaseDbUrlInput').value.trim();
        if (url) updateFirebaseConfig(url);
    });
}

const fbDbUrlInput = document.getElementById('firebaseDbUrlInput');
if (fbDbUrlInput) {
    fbDbUrlInput.value = savedDatabaseURL;
}

const db = firebase.database();
const auth = firebase.auth();
const fs = firebase.firestore();

let currentUser = null;
