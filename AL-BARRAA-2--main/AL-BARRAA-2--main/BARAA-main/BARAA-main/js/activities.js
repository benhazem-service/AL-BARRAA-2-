// ============================================================
// === 8. إدارة بنود التقييم والأنشطة والسلوك (Activities & Evaluation) ===
// ============================================================

function renderReportActivities() {
    const reportActivityList = document.getElementById('reportActivityList');
    if (!reportActivityList) return;
    renderList(reportActivityList, allReportItems, 'item');
    if (typeof feather !== 'undefined') feather.replace();
}

function renderList(ulElement, items, type) {
    ulElement.innerHTML = '';
    if (items.length === 0) {
        ulElement.innerHTML = `<p class="text-gray-500 text-center">لا توجد بنود</p>`;
        return;
    }
    items.forEach((item, index) => {
        if (!item) return;
        const li = document.createElement('li');
        if (type === 'observation') {
            li.className = "flex justify-between items-center bg-gray-50 p-3 rounded-lg";
            li.innerHTML = `
                <span class="font-medium">${item}</span>
                <div class="flex gap-2">
                    <button class="text-blue-500 hover:text-blue-700" onclick="editObservation(${index})"><i data-feather="edit-2" class="w-4 h-4"></i></button>
                    <button class="text-red-500 hover:text-red-700" onclick="deleteReportItem('observation', ${index})"><i data-feather="trash-2" class="w-4 h-4"></i></button>
                </div>
            `;
        } else {
            li.className = "flex justify-between items-center bg-gray-50 p-3 rounded-lg flex-wrap sm:flex-nowrap";
            const name = item && typeof item === 'object' ? item.name : item;

            let currentDeptIds = [];
            if (item && typeof item === 'object') {
                if (Array.isArray(item.deptIds)) {
                    currentDeptIds = item.deptIds.map(String);
                } else if (item.deptId) {
                    currentDeptIds = [String(item.deptId)];
                } else {
                    currentDeptIds = ['all'];
                }
            } else {
                currentDeptIds = ['all'];
            }

            const isAllChecked = currentDeptIds.includes('all');
            const isBehavior = reportBehaviors.some(beh => beh && (typeof beh === 'object' ? beh.name : beh) === name);
            const itemType = isBehavior ? 'سلوك (نقطة)' : 'نشاط (تقدير)';
            const typeColor = isBehavior ? 'text-blue-600' : 'text-amber-600';

            let checkboxesHTML = `
                <div class="flex flex-wrap gap-2 items-center mt-2">
                    <span class="text-xs text-gray-500 font-bold ml-1">المستويات:</span>
                    <label class="inline-flex items-center gap-1 bg-white px-2 py-1 rounded border text-xs cursor-pointer hover:bg-gray-100">
                        <input type="checkbox" class="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5" 
                               ${isAllChecked ? 'checked' : ''} 
                               onchange="toggleLevelForItem('item', ${index}, 'all', this.checked)">
                        <span>كل المستويات</span>
                    </label>
            `;

            departments.forEach(d => {
                const isChecked = !isAllChecked && currentDeptIds.includes(String(d.id));
                checkboxesHTML += `
                    <label class="inline-flex items-center gap-1 bg-white px-2 py-1 rounded border text-xs cursor-pointer hover:bg-gray-100">
                        <input type="checkbox" class="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5" 
                               ${isChecked ? 'checked' : ''} 
                               onchange="toggleLevelForItem('item', ${index}, '${d.id}', this.checked)">
                        <span>${d.name}</span>
                    </label>
                `;
            });
            checkboxesHTML += `</div>`;

            li.innerHTML = `
                <div class="flex-grow">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="font-medium text-gray-800">${name}</span> 
                        <span class="text-xs font-bold ${typeColor}">[${itemType}]</span>
                    </div>
                    ${checkboxesHTML}
                </div>
                <div class="flex gap-2 self-start mt-1">
                    <button class="text-blue-500 hover:text-blue-700 p-1" onclick="editReportItem('item', ${index})"><i data-feather="edit-2" class="w-4 h-4"></i></button>
                    <button class="text-red-500 hover:text-red-700 p-1" onclick="deleteReportItem('item', ${index})"><i data-feather="trash-2" class="w-4 h-4"></i></button>
                </div>
            `;
        }
        ulElement.appendChild(li);
    });
}

window.toggleLevelForItem = function (type, index, levelId, checked) {
    const isActivity = index < reportActivities.length;
    const list = isActivity ? reportActivities : reportBehaviors;
    const listIndex = isActivity ? index : index - reportActivities.length;
    const item = list[listIndex];

    let itemObj = typeof item === 'object' && item !== null ? { ...item } : { name: item };

    let currentDeptIds = [];
    if (Array.isArray(itemObj.deptIds)) {
        currentDeptIds = [...itemObj.deptIds].map(String);
    } else if (itemObj.deptId) {
        currentDeptIds = [String(itemObj.deptId)];
    } else {
        currentDeptIds = ['all'];
    }

    if (levelId === 'all') {
        if (checked) {
            currentDeptIds = ['all'];
        } else {
            currentDeptIds = [];
        }
    } else {
        currentDeptIds = currentDeptIds.filter(id => id !== 'all');
        if (checked) {
            if (!currentDeptIds.includes(String(levelId))) {
                currentDeptIds.push(String(levelId));
            }
        } else {
            currentDeptIds = currentDeptIds.filter(id => String(id) !== String(levelId));
        }
        if (currentDeptIds.length === 0) {
            currentDeptIds = ['all'];
        }
    }

    itemObj.deptIds = currentDeptIds;
    if ('deptId' in itemObj) delete itemObj.deptId;

    list[listIndex] = itemObj;
    saveAll();
    allReportItems.splice(0, allReportItems.length, ...reportActivities, ...reportBehaviors);
    renderReportActivities();
    if (selectedHomeStudentId && typeof renderNewReportCard === 'function') renderNewReportCard(selectedHomeStudentId);
};

function editReportItem(type, index) {
    if (type === 'item') {
        const isActivity = index < reportActivities.length;
        const list = isActivity ? reportActivities : reportBehaviors;
        const listIndex = isActivity ? index : index - reportActivities.length;
        const oldItem = list[listIndex];
        const oldName = oldItem && typeof oldItem === 'object' ? oldItem.name : oldItem;

        const newName = prompt('تعديل اسم البند:', oldName);
        if (newName !== null && newName.trim() !== '') {
            const trimmedName = newName.trim();
            if (typeof oldItem === 'object' && oldItem !== null) {
                oldItem.name = trimmedName;
            } else {
                list[listIndex] = { name: trimmedName, deptIds: ['all'] };
            }
            saveAll();
            allReportItems.splice(0, allReportItems.length, ...reportActivities, ...reportBehaviors);
            renderReportActivities();
            if (selectedHomeStudentId && typeof renderNewReportCard === 'function') renderNewReportCard(selectedHomeStudentId);
        }
    }
}

function deleteReportItem(type, index) {
    const isActivity = index < reportActivities.length;
    const itemName = (type === 'observation')
        ? (generalObservations[index] || 'هذه الملاحظة')
        : (isActivity ? (reportActivities[index]?.name || reportActivities[index]) : (reportBehaviors[index - reportActivities.length]?.name || reportBehaviors[index - reportActivities.length]));

    const performItemDelete = () => {
        if (type === 'observation') {
            generalObservations.splice(index, 1);
        } else {
            const list = isActivity ? reportActivities : reportBehaviors;
            const listIndex = isActivity ? index : index - reportActivities.length;
            list.splice(listIndex, 1);
        }

        saveAll();
        allReportItems.splice(0, allReportItems.length, ...reportActivities, ...reportBehaviors);
        if (type === 'observation') {
            if (typeof renderGeneralObservations === 'function') renderGeneralObservations();
        } else {
            renderReportActivities();
            if (selectedHomeStudentId && typeof renderNewReportCard === 'function') renderNewReportCard(selectedHomeStudentId);
        }
    };

    if (typeof openDeleteConfirmModal === 'function') {
        openDeleteConfirmModal(`هل أنت متأكد من حذف البند "${itemName || ''}"؟`, performItemDelete);
    } else {
        if (confirm('هل أنت متأكد من حذف هذا البند؟')) {
            performItemDelete();
        }
    }
}

// ربط أحداث إضافة الأنشطة والسلوك
const reportActivityForm = document.getElementById('reportActivityForm');
const reportActivityNameInput = document.getElementById('reportActivityName');
const addItemTypeModal = document.getElementById('addItemTypeModal');
const addActivityTypeBtn = document.getElementById('addActivityTypeBtn');
const addBehaviorTypeBtn = document.getElementById('addBehaviorTypeBtn');

if (reportActivityForm) {
    reportActivityForm.addEventListener('submit', e => {
        e.preventDefault();
        if (addItemTypeModal) addItemTypeModal.classList.remove('hidden');
    });
}

if (addActivityTypeBtn) {
    addActivityTypeBtn.onclick = () => {
        const name = reportActivityNameInput ? reportActivityNameInput.value.trim() : "";
        const deptSelect = document.getElementById("reportActivityDept");
        const deptId = deptSelect ? deptSelect.value : 'all';

        if (name) {
            const isDuplicate = reportActivities.some(act =>
                act && (typeof act === 'object' ? act.name : act) === name
            );
            if (!isDuplicate) {
                reportActivities.push({ name, deptIds: [deptId] });
                saveAll();
                allReportItems.splice(0, allReportItems.length, ...reportActivities, ...reportBehaviors);
                renderReportActivities();
                if (selectedHomeStudentId && typeof renderNewReportCard === 'function') renderNewReportCard(selectedHomeStudentId);
                if (reportActivityNameInput) reportActivityNameInput.value = '';
            } else {
                alert("هذا البند موجود بالفعل.");
            }
        }
        if (addItemTypeModal) addItemTypeModal.classList.add('hidden');
    };
}

if (addBehaviorTypeBtn) {
    addBehaviorTypeBtn.onclick = () => {
        const name = reportActivityNameInput ? reportActivityNameInput.value.trim() : "";
        const deptSelect = document.getElementById("reportActivityDept");
        const deptId = deptSelect ? deptSelect.value : 'all';

        if (name) {
            const isDuplicate = reportBehaviors.some(beh =>
                beh && (typeof beh === 'object' ? beh.name : beh) === name
            );
            if (!isDuplicate) {
                reportBehaviors.push({ name, deptIds: [deptId] });
                saveAll();
                allReportItems.splice(0, allReportItems.length, ...reportActivities, ...reportBehaviors);
                renderReportActivities();
                if (selectedHomeStudentId && typeof renderNewReportCard === 'function') renderNewReportCard(selectedHomeStudentId);
                if (reportActivityNameInput) reportActivityNameInput.value = '';
            } else {
                alert("هذا البند موجود بالفعل.");
            }
        }
        if (addItemTypeModal) addItemTypeModal.classList.add('hidden');
    };
}
