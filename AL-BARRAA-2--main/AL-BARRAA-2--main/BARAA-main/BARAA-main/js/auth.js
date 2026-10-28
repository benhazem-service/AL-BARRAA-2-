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
    if (typeof updateMyDeptsUI === 'function') updateMyDeptsUI();
}

// تهيئة نظام المصادقة عند تحميل الصفحة
async function initAuth() {
    const session = loadSession();
    if (session && session.phone) {
        if (!session.isAdmin) {
            const savedLevels = localStorage.getItem("sub_" + session.phone + "_levels");
            if (savedLevels) {
                try {
                    const parsed = JSON.parse(savedLevels);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        session.levels = parsed;
                    }
                } catch (e) { }
            }
        }
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

    // تحديث أزرار وتسميات الأقسام الخاصة بالمشترك
    if (typeof updateMyDeptsUI === 'function') updateMyDeptsUI();

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

    // إذا كان الحساب لمشترك، نقوم بتفريغ الذاكرة من أي بيانات قديمة للمدير لتفادي التداخل بين الأجهزة
    if (!session.isAdmin) {
        const subDataStr = localStorage.getItem('sub_' + session.phone + '_academicData');
        if (subDataStr) {
            try { academicData = JSON.parse(subDataStr); } catch (e) { academicData = {}; }
        } else {
            academicData = {};
        }
        departments = [];
        students = [];
    }

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

    // تم إلغاء الاسترجاع التلقائي القسري لمنع مسح مبالغ الواجبات المسجلة حديثاً وحلقات التحديث

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

            if (data.academicData) {
                // حفظ نسخة من بيانات المؤسسة الكاملة لاختيار الأقسام منها في أي وقت
                window.schoolMasterAcademicData = data.academicData;
                try {
                    localStorage.setItem("schoolMasterAcademicData", JSON.stringify(data.academicData));
                } catch (e) { }

                // استرجاع أحدث المستويات المحفوظة للمشترك
                if (currentSession && currentSession.phone) {
                    const savedLevels = localStorage.getItem("sub_" + currentSession.phone + "_levels");
                    if (savedLevels) {
                        try {
                            const parsed = JSON.parse(savedLevels);
                            if (Array.isArray(parsed) && parsed.length > 0) {
                                currentSession.levels = parsed;
                            }
                        } catch (e) { }
                    }
                }

                const userLevels = (currentSession && currentSession.levels && currentSession.levels.length > 0)
                    ? currentSession.levels
                    : null;

                // تحديث جميع السنوات المتوفرة لدى المدير في academicData للمشترك
                Object.keys(data.academicData).forEach(year => {
                    const adminYearData = data.academicData[year] || {};
                    let userDepts = Array.isArray(adminYearData.departments) ? [...adminYearData.departments] : [];
                    let userStudents = Array.isArray(adminYearData.students) ? [...adminYearData.students] : [];

                    // إذا كان المستخدم له مستويات محددة، نصفي الأقسام والتلاميذ
                    if (userLevels) {
                        userDepts = userDepts.filter(d => userLevels.includes(String(d.id)) || userLevels.includes(d.name));
                        const allowedDeptIds = new Set(userDepts.map(d => String(d.id)));
                        userStudents = userStudents.filter(s => allowedDeptIds.has(String(s.deptId)));
                    }

                    // إذا كان التخزين المحلي يحتوي بالفعل على أقسام وتلاميذ أكثر من التصفية (كأن تم استيراد نسخة)، نحافظ على البيانات المحلية ونوسع المستويات
                    const localYearStudents = (academicData[year] && Array.isArray(academicData[year].students)) ? academicData[year].students : [];
                    const localYearDepts = (academicData[year] && Array.isArray(academicData[year].departments)) ? academicData[year].departments : [];

                    if (localYearStudents.length > userStudents.length || localYearDepts.length > userDepts.length) {
                        console.log(`[Auth Shield] Preserving local academicData for ${year} (${localYearDepts.length} depts, ${localYearStudents.length} students) against smaller filtered data (${userDepts.length} depts, ${userStudents.length} students).`);
                        // مزامنة مستويات الجلسة مع كافة الأقسام المحلية لضمان عدم حجبها
                        if (currentSession && !currentSession.isAdmin) {
                            if (!Array.isArray(currentSession.levels)) currentSession.levels = [];
                            localYearDepts.forEach(d => {
                                if (d && d.id && !currentSession.levels.includes(String(d.id))) currentSession.levels.push(String(d.id));
                                if (d && d.name && !currentSession.levels.includes(d.name)) currentSession.levels.push(d.name);
                            });
                            try {
                                localStorage.setItem("sub_" + currentSession.phone + "_levels", JSON.stringify(currentSession.levels));
                            } catch(e){}
                        }
                    } else {
                        if (!academicData[year]) {
                            academicData[year] = {
                                ...adminYearData,
                                departments: userDepts,
                                students: userStudents
                            };
                        } else {
                            academicData[year].departments = userDepts;
                            academicData[year].students = userStudents;
                            if (adminYearData.subjects && (!academicData[year].subjects || academicData[year].subjects.length === 0)) {
                                academicData[year].subjects = adminYearData.subjects;
                            }
                        }
                    }
                });

                appStorage.setItem("academicData", JSON.stringify(academicData));

                const activeYearForData = currentAcademicYear || data.currentAcademicYear;
                if (academicData[activeYearForData]) {
                    departments = academicData[activeYearForData].departments || [];
                    students = academicData[activeYearForData].students || [];
                }
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
            if (typeof updateMyDeptsUI === 'function') updateMyDeptsUI();

            // إذا كان مشتركاً جديداً ولم يسبق له تحديد أقسام، نعرض له نافذة تحديد الأقسام مباشرة
            if (currentSession && !currentSession.isAdmin) {
                const subLevels = currentSession.levels || [];
                if (subLevels.length === 0) {
                    setTimeout(() => {
                        if (typeof openMyDepartmentsModal === 'function') {
                            openMyDepartmentsModal();
                        }
                    }, 600);
                }
            }
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
        const isChecked = selectedLevels.includes(String(dept.id)) || selectedLevels.includes(dept.name);
        const label = document.createElement('label');
        label.className = 'inline-flex items-center gap-1.5 text-xs bg-indigo-50 border border-indigo-200 px-2 py-1 rounded-lg cursor-pointer hover:bg-indigo-100';
        label.innerHTML = `
            <input type="checkbox" value="${dept.id}" data-name="${dept.name}" class="acc-level-cb accent-indigo-600" ${isChecked ? 'checked' : ''}>
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
    const selectedLevels = [];
    document.querySelectorAll('.acc-level-cb:checked').forEach(cb => {
        if (cb.value) selectedLevels.push(cb.value);
        const dName = cb.dataset.name || cb.getAttribute('data-name');
        if (dName && !selectedLevels.includes(dName)) {
            selectedLevels.push(dName);
        }
    });

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
    const performAccountDelete = async () => {
        try {
            await fs.collection('accounts').doc(phone).delete();
            alert('✅ تم حذف الحساب بنجاح.');
            await loadAccountsList();
        } catch (e) {
            alert('❌ خطأ: ' + e.message);
        }
    };

    if (typeof openDeleteConfirmModal === 'function') {
        openDeleteConfirmModal(`هل أنت متأكد من حذف الحساب (${phone})؟`, performAccountDelete);
    } else {
        if (!confirm('هل أنت متأكد من حذف الحساب (' + phone + ')؟')) return;
        performAccountDelete();
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

// ============================================================
// === إدارة وتحديد الأقسام الخاصة بكل مشترك (Subscriber Depts) ===
// ============================================================

function openMyDepartmentsModal() {
    const modal = document.getElementById('myDepartmentsModal');
    if (!modal) return;
    
    const yearSpan = document.getElementById('myDeptsModalYear');
    if (yearSpan) yearSpan.textContent = currentAcademicYear || '-';

    renderMyDepartmentsCheckboxes();
    modal.classList.remove('hidden');
}
window.openMyDepartmentsModal = openMyDepartmentsModal;

function closeMyDepartmentsModal() {
    const modal = document.getElementById('myDepartmentsModal');
    if (modal) modal.classList.add('hidden');
}
window.closeMyDepartmentsModal = closeMyDepartmentsModal;

function renderMyDepartmentsCheckboxes() {
    const listEl = document.getElementById('myDeptsCheckboxesList');
    if (!listEl) return;

    let masterData = window.schoolMasterAcademicData;
    if (!masterData) {
        try {
            masterData = JSON.parse(localStorage.getItem("schoolMasterAcademicData") || "null");
        } catch(e) {}
    }

    const availableDeptsMap = new Map();
    // 1. أقسام المؤسسة المشتركة للسنة الحالية
    if (masterData && masterData[currentAcademicYear] && Array.isArray(masterData[currentAcademicYear].departments)) {
        masterData[currentAcademicYear].departments.forEach(d => {
            availableDeptsMap.set(String(d.id), { id: d.id, name: d.name, source: 'master' });
        });
    }
    // 2. أي أقسام موجودة محلياً بالذاكرة
    if (Array.isArray(departments)) {
        departments.forEach(d => {
            if (!availableDeptsMap.has(String(d.id))) {
                const existsByName = Array.from(availableDeptsMap.values()).some(x => x.name === d.name);
                if (!existsByName) {
                    availableDeptsMap.set(String(d.id), { id: d.id, name: d.name, source: 'local' });
                }
            }
        });
    }

    const allDepts = Array.from(availableDeptsMap.values());
    if (allDepts.length === 0) {
        listEl.innerHTML = '<p class="text-gray-400 text-xs text-center py-4">لا توجد أقسام مسجلة في هذه السنة بعد. يمكنك إضافة قسم جديد في الأسفل.</p>';
        updateMyDeptsSelectionCount();
        return;
    }

    const currentLevels = (currentSession && Array.isArray(currentSession.levels)) ? currentSession.levels : [];
    const hasAssigned = currentLevels.length > 0;

    // حساب عدد التلاميذ لكل قسم
    const studentCountByDept = {};
    const masterStudents = (masterData && masterData[currentAcademicYear] && Array.isArray(masterData[currentAcademicYear].students))
        ? masterData[currentAcademicYear].students
        : students;
    if (Array.isArray(masterStudents)) {
        masterStudents.forEach(s => {
            const dId = String(s.deptId);
            studentCountByDept[dId] = (studentCountByDept[dId] || 0) + 1;
        });
    }

    listEl.innerHTML = '';
    allDepts.forEach(d => {
        const isChecked = hasAssigned
            ? (currentLevels.includes(String(d.id)) || currentLevels.includes(d.name))
            : true;
        const count = studentCountByDept[String(d.id)] || 0;

        const row = document.createElement('label');
        row.className = `flex justify-between items-center p-2.5 rounded-xl border cursor-pointer transition-colors ${
            isChecked ? 'bg-indigo-50/70 border-indigo-200' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
        }`;
        row.innerHTML = `
            <div class="flex items-center gap-2.5">
                <input type="checkbox" value="${d.id}" data-name="${d.name}" class="my-dept-cb accent-indigo-600 w-4 h-4 cursor-pointer" ${isChecked ? 'checked' : ''} onchange="onMyDeptCbChange(this)">
                <span class="font-bold text-xs text-gray-800">📚 ${d.name}</span>
            </div>
            <span class="text-[11px] font-semibold text-gray-500 bg-white px-2 py-0.5 rounded-md border border-gray-200">${count} تلميذ</span>
        `;
        listEl.appendChild(row);
    });

    updateMyDeptsSelectionCount();
}
window.renderMyDepartmentsCheckboxes = renderMyDepartmentsCheckboxes;

function onMyDeptCbChange(cb) {
    const parent = cb.closest('label');
    if (parent) {
        if (cb.checked) {
            parent.className = 'flex justify-between items-center p-2.5 rounded-xl border cursor-pointer transition-colors bg-indigo-50/70 border-indigo-200';
        } else {
            parent.className = 'flex justify-between items-center p-2.5 rounded-xl border cursor-pointer transition-colors bg-gray-50 border-gray-200 hover:bg-gray-100';
        }
    }
    updateMyDeptsSelectionCount();
}
window.onMyDeptCbChange = onMyDeptCbChange;

function selectAllMyDepts(select) {
    document.querySelectorAll('.my-dept-cb').forEach(cb => {
        cb.checked = select;
        onMyDeptCbChange(cb);
    });
}
window.selectAllMyDepts = selectAllMyDepts;

function updateMyDeptsSelectionCount() {
    const countEl = document.getElementById('myDeptsSelectedCount');
    if (!countEl) return;
    const checked = document.querySelectorAll('.my-dept-cb:checked').length;
    countEl.textContent = `${checked} قسم محدد`;
}
window.updateMyDeptsSelectionCount = updateMyDeptsSelectionCount;

function quickAddMyDept() {
    const input = document.getElementById('myDeptsNewName');
    if (!input) return;
    const name = input.value.trim();
    if (!name) {
        alert('الرجاء إدخال اسم القسم.');
        return;
    }

    const newId = String(Date.now());
    const newDept = { id: newId, name: name };

    if (!departments.some(d => d.name === name || String(d.id) === newId)) {
        departments.push(newDept);
    }

    let masterData = window.schoolMasterAcademicData;
    if (!masterData) {
        try { masterData = JSON.parse(localStorage.getItem("schoolMasterAcademicData") || "{}"); } catch(e) { masterData = {}; }
    }
    if (!masterData[currentAcademicYear]) masterData[currentAcademicYear] = { departments: [], students: [] };
    if (!Array.isArray(masterData[currentAcademicYear].departments)) masterData[currentAcademicYear].departments = [];
    masterData[currentAcademicYear].departments.push(newDept);
    window.schoolMasterAcademicData = masterData;
    try { localStorage.setItem("schoolMasterAcademicData", JSON.stringify(masterData)); } catch(e) {}

    input.value = '';
    renderMyDepartmentsCheckboxes();

    const newCb = document.querySelector(`.my-dept-cb[value="${newId}"]`);
    if (newCb) {
        newCb.checked = true;
        onMyDeptCbChange(newCb);
    }
}
window.quickAddMyDept = quickAddMyDept;

async function saveMyDepartmentsSelection() {
    const checkedBoxes = Array.from(document.querySelectorAll('.my-dept-cb:checked'));
    if (checkedBoxes.length === 0) {
        const proceed = confirm('لم تختر أي قسم! هل تريد اعتماد "جميع الأقسام" في حسابك؟');
        if (!proceed) return;
    }

    const selectedLevels = [];
    checkedBoxes.forEach(cb => {
        if (cb.value) selectedLevels.push(cb.value);
        const dName = cb.dataset.name || cb.getAttribute('data-name');
        if (dName && !selectedLevels.includes(dName)) {
            selectedLevels.push(dName);
        }
    });

    await applySubscriberLevels(selectedLevels);
    closeMyDepartmentsModal();

    const deptsCount = departments.length;
    alert(`✅ تم حفظ وتطبيق أقسامك الخاصة بنجاح (${deptsCount} أقسام).\nستظهر الآن هذه الأقسام وتلاميذها فقط في حسابك ومن أي جهاز!`);
}
window.saveMyDepartmentsSelection = saveMyDepartmentsSelection;

async function applySubscriberLevels(newLevels) {
    if (!currentSession || currentSession.isAdmin) return;

    currentSession.levels = Array.isArray(newLevels) ? newLevels : [];
    appStorage.setItem("currentSession", JSON.stringify(currentSession));
    if (currentSession.phone) {
        localStorage.setItem("sub_" + currentSession.phone + "_levels", JSON.stringify(currentSession.levels));
    }

    if (typeof fs !== 'undefined' && currentSession.phone) {
        try {
            await fs.collection('accounts').doc(currentSession.phone).set({
                levels: currentSession.levels,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            await fs.collection('users').doc(currentSession.phone).set({
                levels: currentSession.levels,
                lastUpdated: new Date().toISOString()
            }, { merge: true });
        } catch (e) {
            console.warn("Firestore save levels warning:", e);
        }
    }

    let masterData = window.schoolMasterAcademicData;
    if (!masterData) {
        try { masterData = JSON.parse(localStorage.getItem("schoolMasterAcademicData") || "null"); } catch(e) {}
    }

    if (masterData) {
        const allowedSet = new Set(currentSession.levels.map(String));
        Object.values(masterData).forEach(yd => {
            (yd.departments || []).forEach(d => {
                if (allowedSet.has(String(d.id))) allowedSet.add(d.name);
                if (allowedSet.has(d.name)) allowedSet.add(String(d.id));
            });
        });

        Object.keys(masterData).forEach(year => {
            const mYear = masterData[year] || {};
            let yearDepts = Array.isArray(mYear.departments) ? [...mYear.departments] : [];
            let yearStudents = Array.isArray(mYear.students) ? [...mYear.students] : [];

            if (allowedSet.size > 0) {
                yearDepts = yearDepts.filter(d => allowedSet.has(String(d.id)) || allowedSet.has(d.name));
                const allowedDeptIds = new Set(yearDepts.map(d => String(d.id)));
                yearStudents = yearStudents.filter(s => allowedDeptIds.has(String(s.deptId)));
            }

            if (!academicData[year]) {
                academicData[year] = {
                    ...mYear,
                    departments: yearDepts,
                    students: yearStudents
                };
            } else {
                academicData[year].departments = yearDepts;
                academicData[year].students = yearStudents;
                if (mYear.subjects && (!academicData[year].subjects || academicData[year].subjects.length === 0)) {
                    academicData[year].subjects = mYear.subjects;
                }
            }
        });

        if (academicData[currentAcademicYear]) {
            departments = academicData[currentAcademicYear].departments || [];
            students = academicData[currentAcademicYear].students || [];
        }
    }

    saveAll();
    refreshUI();
    updateMyDeptsUI();
}
window.applySubscriberLevels = applySubscriberLevels;

function updateMyDeptsUI() {
    const isSub = (typeof currentSession !== 'undefined' && currentSession && !currentSession.isAdmin);
    const sidebarBtn = document.getElementById('myDeptsSidebarBtn');
    const headerBtn = document.getElementById('myDeptsHeaderBtn');
    const settingsCard = document.getElementById('subscriberDeptsSettingsCard');
    const noticeEl = document.getElementById('deptsTabSubscriberNotice');
    const badge = document.getElementById('myDeptsCountBadge');
    const summary = document.getElementById('headerDeptsSummary');
    const currentLabel = document.getElementById('subscriberCurrentDeptsLabel');

    if (isSub) {
        if (sidebarBtn) sidebarBtn.classList.remove('hidden');
        if (headerBtn) headerBtn.classList.remove('hidden');
        if (settingsCard) settingsCard.classList.remove('hidden');
        if (noticeEl) noticeEl.classList.remove('hidden');

        const count = departments.length;
        if (badge) badge.textContent = count;
        
        let labelText = 'كل الأقسام';
        if (currentSession.levels && currentSession.levels.length > 0) {
            labelText = `${count} قسم`;
        }
        if (summary) summary.textContent = labelText;
        if (currentLabel) {
            if (departments.length > 0) {
                currentLabel.textContent = departments.map(d => d.name).join('، ');
            } else {
                currentLabel.textContent = 'لا توجد أقسام مسجلة';
            }
        }
    } else {
        if (sidebarBtn) sidebarBtn.classList.add('hidden');
        if (headerBtn) headerBtn.classList.add('hidden');
        if (settingsCard) settingsCard.classList.add('hidden');
        if (noticeEl) noticeEl.classList.add('hidden');
    }
}
window.updateMyDeptsUI = updateMyDeptsUI;
