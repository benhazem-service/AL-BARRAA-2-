// ============================================================
// === 18. نقطة الانطلاق والتنقل العام (App Bootstrap & Navigation) ===
// ============================================================

let currentDeleteCallback = null;

// عناصر التنقل الرئيسية
const homePage = document.getElementById("homePage");
const settingsPage = document.getElementById("settingsPage");
const openSettingsBtn = document.getElementById("openSettings");
const backHomeBtn = document.getElementById("backHome");

if (openSettingsBtn) {
    openSettingsBtn.onclick = () => {
        if (homePage) homePage.classList.add("hidden");
        const performancePage = document.getElementById('performancePage');
        if (performancePage) performancePage.classList.add('hidden');
        const absencePage = document.getElementById('absencePage');
        if (absencePage) absencePage.classList.add('hidden');
        if (settingsPage) settingsPage.classList.remove("hidden");

        const navHomeBtn = document.getElementById('navHomeBtn');
        const monthlyPerformanceCard = document.getElementById('monthlyPerformanceCard');
        const absenceCard = document.getElementById('absenceCard');
        if (navHomeBtn) navHomeBtn.classList.remove('active');
        if (monthlyPerformanceCard) monthlyPerformanceCard.classList.remove('active');
        if (absenceCard) absenceCard.classList.remove('active');
        if (openSettingsBtn) openSettingsBtn.classList.add('active');
        const topTitle = document.getElementById('topBarPageTitle');
        if (topTitle) topTitle.textContent = 'إعدادات النظام والسنوات';
        if (window.innerWidth < 1024) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar && !sidebar.classList.contains('translate-x-full') && typeof toggleMobileSidebar === 'function') {
                toggleMobileSidebar();
            }
        }

        const isAdmin = typeof currentSession !== 'undefined' && currentSession && currentSession.isAdmin;
        const allTabBtns = document.querySelectorAll('#settingsTabsBar .tab-btn');
        let firstVisible = null;
        allTabBtns.forEach(btn => {
            const adminOnly = btn.dataset.adminOnly === 'true';
            if (adminOnly && !isAdmin) {
                btn.classList.add('hidden');
            } else {
                btn.classList.remove('hidden');
                if (!firstVisible) firstVisible = btn;
            }
        });

        if (firstVisible) {
            allTabBtns.forEach(b => b.classList.remove('tab-active'));
            firstVisible.classList.add('tab-active');
            document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
            const targetTab = document.getElementById(firstVisible.dataset.target);
            if (targetTab) targetTab.classList.remove('hidden');
            if (firstVisible.dataset.target === 'studentsTab' && typeof renderStudents === 'function') {
                renderStudents();
            }
        }

        const fbCard = document.getElementById('adminFirebaseSettingsCard');
        if (fbCard) {
            if (isAdmin) fbCard.classList.remove('hidden');
            else fbCard.classList.add('hidden');
        }
    };
}

if (backHomeBtn) {
    backHomeBtn.onclick = () => {
        if (typeof switchToHomePage === 'function') {
            switchToHomePage();
        } else {
            if (settingsPage) settingsPage.classList.add("hidden");
            const performancePage = document.getElementById('performancePage');
            if (performancePage) performancePage.classList.add('hidden');
            if (homePage) homePage.classList.remove("hidden");

            const navHomeBtn = document.getElementById('navHomeBtn');
            const monthlyPerformanceCard = document.getElementById('monthlyPerformanceCard');
            if (navHomeBtn) navHomeBtn.classList.add('active');
            if (openSettingsBtn) openSettingsBtn.classList.remove('active');
            if (monthlyPerformanceCard) monthlyPerformanceCard.classList.remove('active');
            const topTitle = document.getElementById('topBarPageTitle');
            if (topTitle) topTitle.textContent = 'لوحة التحكم والنتائج';
        }

        const homeDeptSelect = document.getElementById("homeDeptSelect");
        const homeStudentSelect = document.getElementById("homeStudentSelect");
        const homeStudentInfo = document.getElementById("homeStudentInfo");
        const tableDeptLabel = document.getElementById("tableDeptLabel");
        const studentDisplaySection = document.getElementById("studentDisplaySection");

        try {
            if (homeDeptSelect) homeDeptSelect.value = "";
            if (homeStudentSelect) homeStudentSelect.value = "";
        } catch (e) { }

        if (homeStudentInfo) homeStudentInfo.textContent = "";
        if (tableDeptLabel) tableDeptLabel.textContent = "";
        if (studentDisplaySection) studentDisplaySection.classList.add("hidden");

        if (typeof renderHomeStudents === 'function') renderHomeStudents();
    };
}

// التبديل بين تبويبات الإعدادات
document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("tab-active"));
        btn.classList.add("tab-active");
        const targetId = btn.dataset.target;
        document.querySelectorAll(".tab-content").forEach(c => c.classList.add("hidden"));
        const targetEl = document.getElementById(targetId);
        if (targetEl) targetEl.classList.remove("hidden");

        switch (targetId) {
            case 'yearsTab':
                if (typeof renderYearList === 'function') renderYearList();
                break;
            case 'deptsTab':
                if (typeof renderDepartments === 'function') renderDepartments();
                break;
            case 'studentsTab':
                if (typeof renderStudents === 'function') renderStudents();
                break;
            case 'activitiesTab':
                if (typeof renderReportActivities === 'function') renderReportActivities();
                break;
            case 'sessionsTab':
                if (typeof renderReportSessions === 'function') renderReportSessions();
                break;
            case 'observationsTab':
                if (typeof renderGeneralObservations === 'function') renderGeneralObservations();
                if (typeof renderScoreObservations === 'function') renderScoreObservations();
                break;
            case 'generalSettingsTab':
                if (typeof renderGeneralSettings === 'function') renderGeneralSettings();
                break;
            case 'performanceTab':
                if (typeof renderPerformanceSettings === 'function') renderPerformanceSettings();
                break;
        }
    });
});

// ============================================================
// === نظام حماية الحذف بالرقم السري (Deletion Security PIN) ===
// ============================================================

function getDeleteSecurityPin() {
    return localStorage.getItem('deleteSecurityPin') || '1234';
}
window.getDeleteSecurityPin = getDeleteSecurityPin;

function setDeleteSecurityPin(newPin) {
    if (!newPin || newPin.trim() === '') return false;
    const pin = newPin.trim();
    localStorage.setItem('deleteSecurityPin', pin);
    try {
        if (typeof appStorage !== 'undefined') appStorage.setItem('deleteSecurityPin', pin);
        if (typeof fs !== 'undefined') {
            fs.collection('settings').doc('global').set({ deleteSecurityPin: pin }, { merge: true }).catch(() => {});
        }
    } catch (e) { }
    return true;
}
window.setDeleteSecurityPin = setDeleteSecurityPin;

function openDeleteConfirmModal(message, callback) {
    const modalEl = document.getElementById("modalConfirm");
    const modalText = document.getElementById("modalText");
    const pinInput = document.getElementById("deletePinInput");
    const pinError = document.getElementById("modalPinError");

    if (modalText) modalText.textContent = message || "هل أنت متأكد من الحذف؟";
    if (pinInput) {
        pinInput.value = "";
        pinInput.type = "password";
    }
    if (pinError) pinError.classList.add("hidden");

    currentDeleteCallback = callback;

    if (modalEl) {
        modalEl.classList.remove("hidden");
        setTimeout(() => {
            if (pinInput) pinInput.focus();
        }, 150);
    }
}
window.openDeleteConfirmModal = openDeleteConfirmModal;

window.toggleDeletePinVisibility = function () {
    const pinInput = document.getElementById("deletePinInput");
    if (!pinInput) return;
    pinInput.type = pinInput.type === "password" ? "text" : "password";
};

window.saveNewDeletePin = function () {
    const newPin = document.getElementById('newDeletePinInput')?.value.trim();
    const confirmPin = document.getElementById('confirmDeletePinInput')?.value.trim();
    const statusMsg = document.getElementById('deletePinStatusMsg');

    if (!newPin) {
        if (statusMsg) {
            statusMsg.textContent = "❌ يرجى إدخال الرقم السري الجديد.";
            statusMsg.className = "text-xs font-bold mt-2 text-rose-600 block";
            statusMsg.classList.remove('hidden');
        }
        return;
    }
    if (newPin !== confirmPin) {
        if (statusMsg) {
            statusMsg.textContent = "❌ الرقم السري وتأكيده غير متطابقين.";
            statusMsg.className = "text-xs font-bold mt-2 text-rose-600 block";
            statusMsg.classList.remove('hidden');
        }
        return;
    }

    setDeleteSecurityPin(newPin);
    if (statusMsg) {
        statusMsg.textContent = "✅ تم حفظ وتحديث الرقم السري لعمليات الحذف بنجاح.";
        statusMsg.className = "text-xs font-bold mt-2 text-emerald-600 block";
        statusMsg.classList.remove('hidden');
    }
    const input1 = document.getElementById('newDeletePinInput');
    const input2 = document.getElementById('confirmDeletePinInput');
    if (input1) input1.value = '';
    if (input2) input2.value = '';
    setTimeout(() => {
        if (statusMsg) statusMsg.classList.add('hidden');
    }, 4000);
};

window.saveAdminDeletePin = function () {
    const newPin = document.getElementById('adminDeletePinInput')?.value.trim();
    const confirmPin = document.getElementById('adminConfirmDeletePinInput')?.value.trim();
    const statusMsg = document.getElementById('adminDeletePinStatus');

    if (!newPin) {
        if (statusMsg) {
            statusMsg.textContent = "❌ يرجى إدخال الرقم السري الجديد.";
            statusMsg.className = "text-xs font-bold mt-2 text-rose-600 block";
            statusMsg.classList.remove('hidden');
        }
        return;
    }
    if (newPin !== confirmPin) {
        if (statusMsg) {
            statusMsg.textContent = "❌ الرقم السري وتأكيده غير متطابقين.";
            statusMsg.className = "text-xs font-bold mt-2 text-rose-600 block";
            statusMsg.classList.remove('hidden');
        }
        return;
    }

    setDeleteSecurityPin(newPin);
    if (statusMsg) {
        statusMsg.textContent = "✅ تم حفظ وتحديث الرقم السري بنجاح.";
        statusMsg.className = "text-xs font-bold mt-2 text-emerald-600 block";
        statusMsg.classList.remove('hidden');
    }
    const input1 = document.getElementById('adminDeletePinInput');
    const input2 = document.getElementById('adminConfirmDeletePinInput');
    if (input1) input1.value = '';
    if (input2) input2.value = '';
    setTimeout(() => {
        if (statusMsg) statusMsg.classList.add('hidden');
    }, 4000);
};

window.goToChangePinSettings = function () {
    const modal = document.getElementById("modalConfirm");
    if (modal) modal.classList.add("hidden");
    const openSettingsBtn = document.getElementById("openSettings");
    if (openSettingsBtn) openSettingsBtn.click();
    const generalTabBtn = document.querySelector('#settingsTabsBar .tab-btn[data-target="generalSettingsTab"]');
    if (generalTabBtn) generalTabBtn.click();
    setTimeout(() => {
        const input = document.getElementById('newDeletePinInput');
        if (input) {
            input.scrollIntoView({ behavior: 'smooth', block: 'center' });
            input.focus();
        }
    }, 250);
};

// مودال التأكيد مع فحص الرقم السري
const modal = document.getElementById("modalConfirm");
const modalCancel = document.getElementById("modalCancel");
const modalConfirmBtn = document.getElementById("modalConfirmBtn");
const deletePinInput = document.getElementById("deletePinInput");

if (modalCancel && modal) {
    modalCancel.onclick = () => {
        modal.classList.add("hidden");
        currentDeleteCallback = null;
        if (deletePinInput) deletePinInput.value = "";
    };
}

function executeVerifiedDelete() {
    const pinInput = document.getElementById("deletePinInput");
    const pinError = document.getElementById("modalPinError");
    const pinErrorText = document.getElementById("modalPinErrorText");
    const enteredPin = pinInput ? pinInput.value.trim() : "";
    const expectedPin = getDeleteSecurityPin();

    // دعم كلمة سر المدير كاستثناء إضافي إن رغب الأدمن
    const isAdminOverride = (typeof ADMIN_PASS_RAW !== 'undefined' && typeof currentSession !== 'undefined' && currentSession && currentSession.isAdmin && enteredPin === ADMIN_PASS_RAW);

    if (!enteredPin) {
        if (pinError && pinErrorText) {
            pinErrorText.textContent = "يرجى إدخال الرقم السري لتأكيد الحذف.";
            pinError.classList.remove("hidden");
        }
        if (pinInput) pinInput.focus();
        return;
    }

    if (enteredPin !== expectedPin && !isAdminOverride) {
        if (pinError && pinErrorText) {
            pinErrorText.textContent = "❌ الرقم السري غير صحيح! لا يمكن إتمام عملية الحذف.";
            pinError.classList.remove("hidden");
        }
        if (pinInput) {
            pinInput.value = "";
            pinInput.focus();
        }
        return;
    }

    // الرقم السري صحيح: تنفيذ عملية الحذف
    if (modal) modal.classList.add("hidden");
    if (pinInput) pinInput.value = "";
    if (pinError) pinError.classList.add("hidden");

    const cb = currentDeleteCallback;
    currentDeleteCallback = null;
    if (typeof cb === 'function') {
        cb();
    }
}

if (modalConfirmBtn) {
    modalConfirmBtn.onclick = executeVerifiedDelete;
}

if (deletePinInput) {
    deletePinInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            executeVerifiedDelete();
        }
    });
}

// تهيئة أيقونات Feather
if (typeof feather !== 'undefined') {
    feather.replace();
}

// تشغيل نظام المصادقة وتحميل الصفحة
document.addEventListener("DOMContentLoaded", () => {
    if (typeof initAuth === 'function') {
        initAuth();
    }
    if (typeof refreshUI === 'function') {
        refreshUI();
    }
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
});
