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
        if (settingsPage) settingsPage.classList.remove("hidden");

        const navHomeBtn = document.getElementById('navHomeBtn');
        if (navHomeBtn) navHomeBtn.classList.remove('active');
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
    };
}

if (backHomeBtn) {
    backHomeBtn.onclick = () => {
        if (settingsPage) settingsPage.classList.add("hidden");
        if (homePage) homePage.classList.remove("hidden");

        const navHomeBtn = document.getElementById('navHomeBtn');
        if (navHomeBtn) navHomeBtn.classList.add('active');
        if (openSettingsBtn) openSettingsBtn.classList.remove('active');
        const topTitle = document.getElementById('topBarPageTitle');
        if (topTitle) topTitle.textContent = 'لوحة التحكم والنتائج';

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
        }
    });
});

// مودال التأكيد العام
const modal = document.getElementById("modalConfirm");
const modalCancel = document.getElementById("modalCancel");
const modalConfirmBtn = document.getElementById("modalConfirmBtn");

if (modalCancel && modal) {
    modalCancel.onclick = () => {
        modal.classList.add("hidden");
        currentDeleteCallback = null;
    };
}

if (modalConfirmBtn && modal) {
    modalConfirmBtn.onclick = () => {
        if (currentDeleteCallback) currentDeleteCallback();
        modal.classList.add("hidden");
    };
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
