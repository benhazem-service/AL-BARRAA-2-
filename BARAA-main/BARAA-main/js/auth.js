// ============================================================
// === 4. نظام المصادقة وإدارة المستخدمين (Authentication & Admin) ===
// ============================================================

const ADMIN_PHONE = '0662065072';
const ADMIN_PASS_RAW = 'Benhazem@1988';

let currentSession = null;

function loadSession() {
    try {
        const s = appStorage.getItem('appSession');
        return s ? JSON.parse(s) : null;
    } catch {
        return null;
    }
}

function saveSession(session) {
    appStorage.setItem('appSession', JSON.stringify(session));
}

function clearSession() {
    // إزالة الجلسة فقط لإنهاء تسجيل الدخول دون مسح بيانات التلاميذ أو الأقسام
    localStorage.removeItem('sub_appSession');
    currentSession = null;
}

// تهيئة نظام المصادقة عند تحميل الصفحة
async function initAuth() {
    const session = loadSession();
    if (session && session.phone) {
        currentSession = session;
        onLoginSuccess(session);
    } else {
        showLoginScreen();
    }
}

function showLoginScreen() {
    const overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.classList.remove('hidden');
}

function hideLoginScreen() {
    const overlay = document.getElementById('loginOverlay');
    if (overlay) overlay.classList.add('hidden');
}

// عملية تسجيل الدخول
async function loginUser() {
    const rawPhone = document.getElementById('loginPhone').value;
    const rawPassword = document.getElementById('loginPassword').value;
    const phone = normalizePhone(rawPhone);
    const password = rawPassword ? rawPassword.trim() : '';
    const errEl = document.getElementById('loginError');
    const btnText = document.getElementById('loginBtnText');

    errEl.textContent = '';
    if (!phone || !password) {
        errEl.textContent = 'يرجى إدخال رقم الهاتف وكلمة السر.';
        return;
    }

    btnText.textContent = 'جاري التحقق...';
    document.getElementById('loginBtn').disabled = true;

    try {
        // التحقق من حساب الأدمن المضمّن
        if (phone === ADMIN_PHONE) {
            if (password === ADMIN_PASS_RAW || password.toLowerCase() === ADMIN_PASS_RAW.toLowerCase()) {
                const session = { phone: ADMIN_PHONE, name: 'المدير', isAdmin: true, levels: [], institution: '' };
                currentSession = session;
                saveSession(session);
                onLoginSuccess(session);
                return;
            } else {
                errEl.textContent = '❌ كلمة السر غير صحيحة لحساب المدير.';
                return;
            }
        }

        // التحقق من حسابات المستخدمين في Firestore
        const doc = await fs.collection('accounts').doc(phone).get();
        if (!doc.exists) {
            errEl.textContent = '❌ رقم الهاتف غير موجود.';
            return;
        }
        const data = doc.data();
        const inputHash = simpleHash(password);
        if (data.passwordHash !== inputHash) {
            errEl.textContent = '❌ كلمة السر غير صحيحة.';
            return;
        }

        const session = {
            phone: phone,
            name: data.name || phone,
            isAdmin: false,
            levels: data.levels || [],
            institution: data.institution || ''
        };
        currentSession = session;
        saveSession(session);
        onLoginSuccess(session);

    } catch (e) {
        console.error('Login error:', e);
        errEl.textContent = '❌ خطأ في الاتصال. تأكد من إعدادات Firebase.';
    } finally {
        btnText.textContent = 'تسجيل الدخول';
        document.getElementById('loginBtn').disabled = false;
    }
}

// الإجراءات عند نجاح تسجيل الدخول
function onLoginSuccess(session) {
    hideLoginScreen();

    // عرض اسم المستخدم وزر الخروج
    const nameEl = document.getElementById('headerUserName');
    const logoutBtn = document.getElementById('logoutBtn');
    if (nameEl) {
        nameEl.textContent = '👤 ' + session.name;
        nameEl.classList.remove('hidden');
    }
    const sidebarName = document.getElementById('sidebarUserName');
    if (sidebarName) sidebarName.textContent = session.name;
    if (logoutBtn) logoutBtn.classList.remove('hidden');

    // عرض بطاقة الإدارة للأدمن
    const adminCard = document.getElementById('adminCard');
    if (adminCard) {
        if (session.isAdmin) {
            adminCard.classList.remove('hidden');
        } else {
            adminCard.classList.add('hidden');
            loadAdminSharedData();
        }
    }

    // تعيين رقم الهاتف كمعرف سحابي
    cloudUserId = session.phone;
    appStorage.setItem('cloudUserId', cloudUserId);

    // استعادة وتثبيت السنة الدراسية الخاصة بالمستخدم
    const userPinnedYear = localStorage.getItem('user_year_' + session.phone) || appStorage.getItem('currentAcademicYear');
    if (userPinnedYear && academicYears.includes(userPinnedYear)) {
        currentAcademicYear = userPinnedYear;
        appStorage.setItem('currentAcademicYear', userPinnedYear);
    }

    // إعادة تحميل البيانات والتأكد من تحديث الواجهة فوراً بحساب المستخدم
    if (typeof reloadStateFromStorage === 'function') {
        reloadStateFromStorage();
    }

    // فحص واسترجاع تلقائي إذا كانت البيانات غير موجودة للمدير
    if (session.isAdmin && typeof checkAndAutoRecoverData === 'function') {
        setTimeout(() => checkAndAutoRecoverData(), 500);
    }

    // بدء المزامنة السحابية
    if (typeof startFirestoreSync === 'function') startFirestoreSync(cloudUserId);
    if (typeof signIn === 'function') signIn();

    if (typeof feather !== 'undefined') feather.replace();
}

// تحميل بيانات المدير المشتركة (السنة الحالية والأقسام) للمشتركين
async function loadAdminSharedData() {
    try {
        const adminDoc = await fs.collection('users').doc(ADMIN_PHONE).get();
        if (adminDoc.exists) {
            const data = adminDoc.data();

            // الحفاظ على السنة المثبتة الخاصة بالمستخدم وعدم استبدالها بسنة المدير إن كان المستخدم قد اختار سنته
            const userPinnedYear = (currentSession && currentSession.phone)
                ? (localStorage.getItem('user_year_' + currentSession.phone) || appStorage.getItem('currentAcademicYear'))
                : null;

            if (userPinnedYear && academicYears.includes(userPinnedYear)) {
                currentAcademicYear = userPinnedYear;
                appStorage.setItem('currentAcademicYear', userPinnedYear);
            } else if (data.currentAcademicYear) {
                appStorage.setItem('currentAcademicYear', data.currentAcademicYear);
                currentAcademicYear = data.currentAcademicYear;
            }

            if (data.academicYears && academicYears.length === 0) {
                appStorage.setItem('academicYears', JSON.stringify(data.academicYears));
                academicYears = data.academicYears;

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
            }

            const activeYearForData = currentAcademicYear || data.currentAcademicYear;
            if (data.academicData && activeYearForData && (!departments || departments.length === 0)) {
                const adminYearData = data.academicData[activeYearForData] || data.academicData[data.currentAcademicYear] || {};
                let userDepts = adminYearData.departments || [];

                // إذا كان المستخدم له مستويات محددة، نصفي الأقسام
                if (currentSession && currentSession.levels && currentSession.levels.length > 0) {
                    userDepts = userDepts.filter(d => currentSession.levels.includes(d.id) || currentSession.levels.includes(d.name));
                }

                departments = userDepts;
            }

            if (data.institutionName && !institutionName) {
                institutionName = data.institutionName;
                appStorage.setItem("institutionName", institutionName);
            }

            renderAcademicYears();
            renderDepartments();
            renderStudents();
            renderStats();
            renderHomeStudents();
        }
    } catch (e) {
        console.error('Error loading admin shared data:', e);
    }
}

// تسجيل الخروج مع الحفاظ على السنة المثبتة لكل مستخدم
function logoutUser() {
    if (!confirm('هل تريد تسجيل الخروج؟')) return;
    if (currentAcademicYear) {
        try {
            if (currentSession && currentSession.phone) {
                localStorage.setItem('user_year_' + currentSession.phone, currentAcademicYear);
            }
            if (currentSession && currentSession.isAdmin) {
                localStorage.setItem('admin_currentAcademicYear', currentAcademicYear);
            }
            localStorage.setItem('last_selected_academic_year', currentAcademicYear);
        } catch (e) { }
    }
    clearSession();
    currentSession = null;
    location.reload();
}

// ============================================================
// === لوحة الإدارة (للأدمن فقط) ===
// ============================================================

async function openAdminPanel() {
    document.getElementById('adminModal').classList.remove('hidden');
    cancelAccountEdit();
    renderAccLevelsCheckboxes();
    renderUnassignedStudentsInAdmin();
    await loadAccountsList();
    if (typeof feather !== 'undefined') feather.replace();
}

// عرض وإدارة التلاميذ غير المحددة أقسامهم في لوحة إدارة الحسابات
function renderUnassignedStudentsInAdmin() {
    const listEl = document.getElementById('adminUnassignedList');
    const badgeEl = document.getElementById('adminUnassignedBadge');
    if (!listEl) return;

    const unassigned = (Array.isArray(students))
        ? students.filter(s => !s.deptId || !departments.some(d => String(d.id) === String(s.deptId)))
        : [];

    if (badgeEl) {
        badgeEl.textContent = `${unassigned.length} تلميذ`;
        badgeEl.className = unassigned.length > 0
            ? 'text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-200 text-amber-900 animate-pulse'
            : 'text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800';
    }

    if (unassigned.length === 0) {
        listEl.innerHTML = `
            <div class="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center text-xs font-bold text-emerald-700 flex items-center justify-center gap-2">
                <span>✅</span>
                <span>جميع التلاميذ (${students.length}) محددة أقسامهم بنجاح. لا توجد أي حالات غير معينة.</span>
            </div>
        `;
        return;
    }

    let deptOpts = '<option value="">-- اختر القسم المناسب --</option>';
    departments.forEach(d => {
        deptOpts += `<option value="${d.id}">${d.name}</option>`;
    });

    listEl.innerHTML = unassigned.map(s => {
        const studentName = (s.info && s.info['الاسم الكامل (بالعربية)']) || 'اسم غير محدد';
        return `
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-amber-200 rounded-lg p-2.5 gap-2 text-xs shadow-2xs">
                <span class="font-bold text-gray-800 flex items-center gap-1.5">
                    <span>👤</span>
                    <span>${studentName}</span>
                </span>
                <div class="flex items-center gap-2 w-full sm:w-auto">
                    <select onchange="assignStudentDeptFromAdmin('${s.id}', this.value)" title="تحديد قسم التلميذ"
                        class="flex-grow sm:flex-grow-0 border border-amber-300 rounded-lg px-2.5 py-1.5 bg-amber-50 font-bold text-amber-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 cursor-pointer">
                        ${deptOpts}
                    </select>
                </div>
            </div>
        `;
    }).join('');
}
window.renderUnassignedStudentsInAdmin = renderUnassignedStudentsInAdmin;

// تعيين قسم للتلميذ مباشرة من لوحة إدارة المستخدمين
window.assignStudentDeptFromAdmin = function (studentId, deptId) {
    if (!deptId) return;
    const s = students.find(x => String(x.id) === String(studentId));
    if (!s) return;
    s.deptId = deptId;
    saveAll();
    renderUnassignedStudentsInAdmin();
    if (typeof renderStudents === 'function') renderStudents();
    if (typeof renderDepartments === 'function') renderDepartments();
    if (typeof renderHomeStudents === 'function') renderHomeStudents();
    if (typeof renderAllStudentsList === 'function') renderAllStudentsList();
};

function renderAccLevelsCheckboxes(selectedLevels = []) {
    const container = document.getElementById('accLevelsCheckboxes');
    if (!container) return;
    container.innerHTML = '';
    if (departments.length === 0) {
        container.innerHTML = '<span class="text-gray-400 text-xs">لا توجد أقسام مسجلة حالياً.</span>';
        return;
    }
    departments.forEach(dept => {
        const isChecked = selectedLevels.includes(dept.id) || selectedLevels.includes(dept.name);
        const label = document.createElement('label');
        label.className = 'inline-flex items-center gap-1.5 text-xs bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-lg cursor-pointer hover:bg-indigo-100';
        label.innerHTML = `
            <input type="checkbox" value="${dept.id}" class="acc-level-cb accent-indigo-600" ${isChecked ? 'checked' : ''}>
            <span>${dept.name}</span>
        `;
        container.appendChild(label);
    });
}

async function loadAccountsList() {
    const listEl = document.getElementById('accountsList');
    if (!listEl) return;
    listEl.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">جاري التحميل...</p>';
    try {
        const snap = await fs.collection('accounts').get();
        if (snap.empty) {
            listEl.innerHTML = '<p class="text-gray-400 text-sm text-center py-4">لا توجد حسابات بعد. أضف أول حساب أعلاه.</p>';
            return;
        }
        listEl.innerHTML = '';
        snap.forEach(doc => {
            const acc = doc.data();
            const phone = doc.id;
            const item = document.createElement('div');
            item.className = 'flex justify-between items-center bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm';
            
            // مستويات وأقسام الحساب
            const levelsBadges = (acc.levels && acc.levels.length > 0)
                ? acc.levels.map(lid => {
                    const dName = departments.find(d => String(d.id) === String(lid) || d.name === lid)?.name || lid;
                    return `<span class="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-md">${dName}</span>`;
                }).join(' ')
                : '<span class="text-gray-400 text-[10px]">كل الأقسام</span>';

            item.innerHTML = `
                <div>
                    <div class="flex items-center gap-2">
                        <span class="font-bold text-gray-800">${acc.name || 'بدون اسم'}</span>
                        <span class="text-gray-500 text-xs font-mono">(${phone})</span>
                    </div>
                    ${acc.institution ? `<span class="text-indigo-600 text-xs block mt-0.5">🏫 ${acc.institution}</span>` : ''}
                    <div class="mt-1 flex flex-wrap gap-1 items-center">
                        <span class="text-[11px] text-gray-500 font-medium">الأقسام:</span>
                        ${levelsBadges}
                    </div>
                </div>
                <div class="flex gap-2 shrink-0">
                    <button onclick="editAccount('${phone}')" class="text-indigo-600 hover:text-indigo-800 text-xs bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg font-bold">✏️ تعديل</button>
                    <button onclick="deleteAccount('${phone}')" class="text-red-600 hover:text-red-800 text-xs bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg font-bold">🗑️ حذف</button>
                </div>
            `;
            listEl.appendChild(item);
        });
    } catch (e) {
        listEl.innerHTML = '<p class="text-red-500 text-sm text-center py-4">خطأ في تحميل الحسابات: ' + e.message + '</p>';
    }
}

async function editAccount(phone) {
    try {
        const doc = await fs.collection('accounts').doc(phone).get();
        if (!doc.exists) return;
        const data = doc.data();
        document.getElementById('accName').value = data.name || '';
        document.getElementById('accPhone').value = phone;
        document.getElementById('accPhone').disabled = true;
        document.getElementById('accPassword').value = '';
        document.getElementById('accPassword').placeholder = 'اتركه فارغاً للإبقاء على كلمة السر الحالية';
        document.getElementById('accInstitution').value = data.institution || '';
        document.getElementById('accEditingPhone').value = phone;
        document.getElementById('accountFormTitle').textContent = '✏️ تعديل حساب: ' + (data.name || phone);
        document.getElementById('accCancelBtn').classList.remove('hidden');
        renderAccLevelsCheckboxes(data.levels || []);
    } catch (e) {
        alert('❌ خطأ: ' + e.message);
    }
}

function cancelAccountEdit() {
    document.getElementById('accName').value = '';
    document.getElementById('accPhone').value = '';
    document.getElementById('accPhone').disabled = false;
    document.getElementById('accPassword').value = '';
    document.getElementById('accPassword').placeholder = 'كلمة السر';
    document.getElementById('accInstitution').value = '';
    document.getElementById('accEditingPhone').value = '';
    document.getElementById('accountFormTitle').textContent = '➕ إضافة حساب جديد';
    document.getElementById('accCancelBtn').classList.add('hidden');
    renderAccLevelsCheckboxes();
}

async function saveAccount() {
    const name = document.getElementById('accName').value.trim();
    const phone = normalizePhone(document.getElementById('accPhone').value);
    const password = document.getElementById('accPassword').value;
    const institution = document.getElementById('accInstitution').value.trim();
    const editingPhone = document.getElementById('accEditingPhone').value;
    const selectedLevels = Array.from(document.querySelectorAll('.acc-level-cb:checked')).map(cb => cb.value);

    if (!phone) {
        alert('❌ يرجى إدخال رقم الهاتف.');
        return;
    }
    if (!editingPhone && !password) {
        alert('❌ يرجى إدخال كلمة السر للحساب الجديد.');
        return;
    }

    const accountData = {
        name: name,
        institution: institution,
        levels: selectedLevels,
        updatedAt: new Date().toISOString()
    };
    if (password) {
        accountData.passwordHash = simpleHash(password);
    }

    try {
        await fs.collection('accounts').doc(phone).set(accountData, { merge: true });
        alert('✅ تم حفظ الحساب بنجاح.');
        cancelAccountEdit();
        await loadAccountsList();
    } catch (e) {
        alert('❌ خطأ: ' + e.message);
    }
}

async function deleteAccount(phone) {
    if (!confirm('هل أنت متأكد من حذف الحساب (' + phone + ')؟')) return;
    try {
        await fs.collection('accounts').doc(phone).delete();
        alert('✅ تم حذف الحساب.');
        await loadAccountsList();
    } catch (e) {
        alert('❌ خطأ: ' + e.message);
    }
}

// ربط أزرار الدخول
const loginBtn = document.getElementById('loginBtn');
if (loginBtn) loginBtn.addEventListener('click', loginUser);

const loginPassInput = document.getElementById('loginPassword');
if (loginPassInput) {
    loginPassInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') loginUser();
    });
}
