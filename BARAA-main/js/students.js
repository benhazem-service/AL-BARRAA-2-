// ============================================================
// === 7. إدارة التلاميذ وبياناتهم (Students Management) ===
// ============================================================

let selectedHomeStudentId = null;

// عرض إحصائيات التلاميذ في لوحة التحكم
function renderStats() {
    const totalDeptsEl = document.getElementById("totalDepts");
    if (totalDeptsEl) totalDeptsEl.textContent = departments.length;
    const totalStudentsEl = document.getElementById("totalStudents");
    if (totalStudentsEl) totalStudentsEl.textContent = students.length;
}

// عرض التلاميذ في الصفحة الرئيسية حسب القسم المختار
function renderHomeStudents() {
    const homeDeptSelect = document.getElementById("homeDeptSelect");
    const homeStudentSelect = document.getElementById("homeStudentSelect");
    const homeStudentInfo = document.getElementById("homeStudentInfo");
    const homeGreeting = document.getElementById("homeGreeting");
    const studentDisplaySection = document.getElementById("studentDisplaySection");
    const homeStudentCount = document.getElementById("homeStudentCount");
    const tableDeptLabel = document.getElementById("tableDeptLabel");

    if (!homeDeptSelect || !homeStudentSelect) return;

    // استرجاع القسم المختار من التخزين
    const savedDept = appStorage.getItem("selectedHomeDept");
    if (savedDept && homeDeptSelect.querySelector(`option[value="${savedDept}"]`)) {
        homeDeptSelect.value = savedDept;
    }
    const deptId = homeDeptSelect.value;
    homeStudentSelect.innerHTML = `<option value="">-- اختر تلميذ --</option>`;
    selectedHomeStudentId = null;
    if (homeStudentInfo) homeStudentInfo.textContent = "";
    if (studentDisplaySection) studentDisplaySection.classList.add("hidden");
    if (tableDeptLabel) tableDeptLabel.textContent = "";

    if (deptId) {
        const d = departments.find(x => String(x.id) === String(deptId));
        if (d && homeGreeting) {
            homeGreeting.innerHTML = `<div class="text-2xl font-bold text-indigo-700">مرحبا بك</div>
                       <div class="mt-1 text-lg text-indigo-600">القسم: <strong>${d.name}</strong></div>`;
        } else if (homeGreeting) {
            homeGreeting.innerHTML = "";
        }
    } else if (homeGreeting) {
        homeGreeting.innerHTML = "";
    }

    if (!deptId) {
        if (homeStudentCount) homeStudentCount.textContent = "";
        return;
    }
    const filtered = students.filter(s => String(s.deptId) === String(deptId) && !s.isDroppedOut);
    if (homeStudentCount) homeStudentCount.textContent = `عدد التلاميذ في القسم: ${filtered.length}`;
    filtered.forEach(s => {
        homeStudentSelect.appendChild(new Option(s.info['الاسم الكامل (بالعربية)'], s.id));
    });

    // استرجاع التلميذ المختار من التخزين واجعله هو المختار
    const savedStudent = appStorage.getItem("selectedHomeStudent");
    if (savedStudent && homeStudentSelect.querySelector(`option[value="${savedStudent}"]`)) {
        homeStudentSelect.value = savedStudent;
        selectHomeStudent(savedStudent);
    }
}

// عرض بيانات التلميذ والنتيجة في الصفحة الرئيسية
function selectHomeStudent(id) {
    selectedHomeStudentId = id;
    const s = students.find(x => String(x.id) === String(id));
    if (!s) return;

    const deptName = departments.find(d => String(d.id) === String(s.deptId))?.name || '-';
    const homeStudentInfo = document.getElementById("homeStudentInfo");
    const tableDeptLabel = document.getElementById("tableDeptLabel");
    const studentDisplaySection = document.getElementById("studentDisplaySection");

    if (homeStudentInfo) homeStudentInfo.textContent = `التلميذ: ${s.info['الاسم الكامل (بالعربية)'] || ''} — القسم: ${deptName}`;
    if (tableDeptLabel) tableDeptLabel.textContent = `النتيجة المدرسية للتلميذ: ${s.info['الاسم الكامل (بالعربية)'] || ''}`;

    if (typeof renderNewReportCard === 'function') renderNewReportCard(id);
    if (studentDisplaySection) studentDisplaySection.classList.remove("hidden");
}

// قائمة التلاميذ في صفحة الإعدادات
function renderStudents() {
    const deptSelectForStudents = document.getElementById("deptSelectForStudents");
    const studentSearch = document.getElementById("studentSearch");
    const studentList = document.getElementById("studentList");

    if (!deptSelectForStudents || !studentList) return;

    const deptId = deptSelectForStudents.value;
    const searchTerm = studentSearch ? studentSearch.value.trim().toLowerCase() : "";

    let filtered = students.filter(s => {
        const sName = (s.info && s.info['الاسم الكامل (بالعربية)'] || '').toLowerCase();
        if (searchTerm && !sName.includes(searchTerm)) return false;

        if (deptId === "all" || !deptId) {
            return true;
        } else if (deptId === "unassigned") {
            return !s.deptId || !departments.some(d => String(d.id) === String(s.deptId));
        } else {
            return String(s.deptId) === String(deptId);
        }
    });

    studentList.innerHTML = "";
    if (filtered.length === 0) {
        studentList.innerHTML = `<p class="text-gray-500 text-center py-6 bg-white rounded-xl border border-dashed border-gray-200">لا يوجد تلاميذ في هذا القسم أو البحث</p>`;
    }

    filtered.forEach(s => {
        const li = document.createElement("li");
        li.className = "flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 hover:bg-slate-100/80 p-3 rounded-xl gap-2 transition-colors border border-gray-200/70 shadow-2xs";
        const isDropped = s.isDroppedOut ? "checked" : "";
        const studentDept = departments.find(d => String(d.id) === String(s.deptId));
        const hasValidDept = !!studentDept;

        // خيارات الأقسام لتحديد القسم مباشرة من القائمة
        let deptOptionsHtml = `<option value="" ${!hasValidDept ? 'selected' : ''}>⚠️ حدد القسم</option>`;
        departments.forEach(d => {
            const isSel = String(d.id) === String(s.deptId) ? 'selected' : '';
            deptOptionsHtml += `<option value="${d.id}" ${isSel}>${d.name}</option>`;
        });

        li.innerHTML = `
            <div class="flex items-center gap-3 flex-wrap">
                <span class="font-bold text-gray-800 text-sm">👤 ${s.info['الاسم الكامل (بالعربية)'] || 'اسم غير محدد'}</span>
                
                <!-- لائحة منسدلة لتحديد أو تغيير القسم مباشرة -->
                <div class="inline-flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-gray-200 shadow-2xs">
                    <span class="text-[11px] text-gray-500 font-medium">القسم:</span>
                    <select onchange="updateStudentDepartment('${s.id}', this.value)" title="تحديد أو تغيير قسم التلميذ"
                        class="text-xs font-bold rounded-md px-1.5 py-0.5 border-0 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer ${hasValidDept ? 'text-indigo-700 bg-indigo-50' : 'text-amber-900 bg-amber-100 font-extrabold animate-pulse'}">
                        ${deptOptionsHtml}
                    </select>
                </div>

                <label class="flex items-center gap-1 text-xs text-red-600 font-bold cursor-pointer bg-red-50 px-2 py-1 rounded-md border border-red-200 hover:bg-red-100 transition-colors" title="تحديد التلميذ كمنقطع عن الدراسة لإخفائه من النتائج">
                    <input type="checkbox" onchange="toggleDropout('${s.id}', this.checked)" ${isDropped}> منقطع
                </label>
            </div>
            <div class="flex gap-2 self-end sm:self-center shrink-0">
                <button class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-btn flex items-center gap-1" onclick="editStudent('${s.id}')">
                    <span>✏️ بطاقة التلميذ</span>
                </button>
                <button class="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-btn flex items-center gap-1" onclick="deleteStudent('${s.id}')">
                    <span>🗑️ حذف</span>
                </button>
            </div>
        `;
        studentList.appendChild(li);
    });

    const totalStudentsEl = document.getElementById("totalStudents");
    if (totalStudentsEl) totalStudentsEl.textContent = students.length;

    renderHomeStudents();
    if (selectedHomeStudentId) selectHomeStudent(selectedHomeStudentId);
}

// دالة سريعة لتغيير أو تحديد قسم التلميذ مباشرة من القائمة
window.updateStudentDepartment = function (studentId, newDeptId) {
    const s = students.find(x => String(x.id) === String(studentId));
    if (!s) return;
    s.deptId = newDeptId || "";
    saveAll();
    renderStudents();
    renderDepartments();
    renderHomeStudents();
    if (typeof renderAllStudentsList === 'function') renderAllStudentsList();
    if (typeof renderUnassignedStudentsInAdmin === 'function') renderUnassignedStudentsInAdmin();
};

function editStudent(id) {
    openStudentModal(id);
}

function deleteStudent(id) {
    const s = students.find(x => String(x.id) === String(id));
    if (!s) return;

    const modal = document.getElementById("modalConfirm");
    const modalText = document.getElementById("modalText");
    if (modalText) modalText.textContent = `هل تريد حذف "${s.info['الاسم الكامل (بالعربية)'] || ''}"؟`;

    currentDeleteCallback = () => {
        students = students.filter(x => String(x.id) !== String(id));
        delete grades[id];
        saveAll();
        renderStudents();
    };
    if (modal) modal.classList.remove("hidden");
}

function toggleDropout(id, checked) {
    const s = students.find(x => String(x.id) === String(id));
    if (s) {
        s.isDroppedOut = checked;
        saveAll();
        renderHomeStudents();
    }
}

// --- نافذة قائمة جميع التلاميذ وتجميعهم حسب الأقسام ---
function renderAllStudentsList() {
    const allStudentsList = document.getElementById('allStudentsList');
    const allStudentsSearch = document.getElementById('allStudentsSearch');
    if (!allStudentsList || !allStudentsSearch) return;

    const searchTerm = allStudentsSearch.value.toLowerCase();
    allStudentsList.innerHTML = '';

    const deptsMap = new Map(departments.map(d => [d.id, d.name]));

    const filteredStudents = students.filter(s => {
        const studentName = (s.info['الاسم الكامل (بالعربية)'] || '').toLowerCase();
        const deptName = (deptsMap.get(s.deptId) || '').toLowerCase();
        return studentName.includes(searchTerm) || deptName.includes(searchTerm);
    });

    const allStudentsCount = document.getElementById('allStudentsCount');
    if (allStudentsCount) allStudentsCount.textContent = filteredStudents.length;

    if (filteredStudents.length === 0) {
        allStudentsList.innerHTML = `<p class="text-center text-gray-500 p-4">لا يوجد تلاميذ يطابقون البحث.</p>`;
        return;
    }

    const groupedStudents = {};
    filteredStudents.forEach(student => {
        const deptId = student.deptId || 'unknown';
        if (!groupedStudents[deptId]) {
            groupedStudents[deptId] = [];
        }
        groupedStudents[deptId].push(student);
    });

    function renderGroup(title, deptStudents, isUnknown = false) {
        const headerLi = document.createElement('li');
        const headerBg = isUnknown ? 'bg-gray-200' : 'bg-indigo-100';
        const headerText = isUnknown ? 'text-gray-800' : 'text-indigo-800';
        headerLi.className = `p-2 ${headerBg} ${headerText} font-bold rounded-lg mt-3 mb-1 text-sm`;
        headerLi.textContent = `📚 ${title} (${deptStudents.length})`;
        allStudentsList.appendChild(headerLi);

        const borderCol = isUnknown ? 'border-gray-300' : 'border-indigo-300';
        deptStudents.forEach(student => {
            const li = document.createElement('li');
            li.className = `p-3 bg-gray-50 hover:bg-green-50 rounded-lg cursor-pointer flex justify-between items-center mr-2 border-r-4 ${borderCol}`;
            li.innerHTML = `<span><strong>${student.info['الاسم الكامل (بالعربية)']}</strong></span>`;
            li.onclick = () => openStudentModal(student.id);
            allStudentsList.appendChild(li);
        });
    }

    // الأقسام المسجلة
    departments.forEach(dept => {
        if (groupedStudents[dept.id]) {
            renderGroup(dept.name, groupedStudents[dept.id], false);
            delete groupedStudents[dept.id];
        }
    });

    // الأقسام غير المحددة
    for (const deptId in groupedStudents) {
        renderGroup(deptsMap.get(deptId) || 'قسم غير محدد', groupedStudents[deptId], true);
    }
}

// --- إنشاء حقول بطاقة التلميذ ---
function createFieldInput(key, value = '', isCustom = false) {
    const fieldWrapper = document.createElement('div');
    fieldWrapper.className = 'flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 field-wrapper';
    fieldWrapper.dataset.key = key;

    // أيقونة السحب والإفلات
    if (key !== "الاسم الكامل (بالعربية)" && key !== "Nom et Prénom (en Français)") {
        fieldWrapper.draggable = true;
        const handle = document.createElement('span');
        handle.innerHTML = `<i data-feather="move" class="w-5 h-5 text-gray-400 cursor-move"></i>`;
        handle.className = 'drag-handle';
        fieldWrapper.appendChild(handle);
    } else {
        fieldWrapper.appendChild(document.createElement('span')).className = 'w-5 h-5';
    }

    const keyLabel = document.createElement('label');
    keyLabel.textContent = key + ':';
    keyLabel.className = 'w-1/3 text-sm font-medium text-gray-700';
    fieldWrapper.appendChild(keyLabel);

    if (key === "الجنس") {
        const genderContainer = document.createElement('div');
        genderContainer.className = 'field-value flex-grow flex items-center gap-2';
        genderContainer.dataset.key = key;
        genderContainer.dataset.value = value || "";

        const maleBtn = document.createElement('button');
        maleBtn.type = 'button';
        maleBtn.textContent = 'ذكر';
        maleBtn.dataset.gender = 'ذكر';
        maleBtn.className = 'px-4 py-2 border rounded-lg cursor-pointer transition-colors text-sm';

        const femaleBtn = document.createElement('button');
        femaleBtn.type = 'button';
        femaleBtn.textContent = 'أنثى';
        femaleBtn.dataset.gender = 'أنثى';
        femaleBtn.className = 'px-4 py-2 border rounded-lg cursor-pointer transition-colors text-sm';

        const updateSelection = (selectedValue) => {
            genderContainer.dataset.value = selectedValue;
            maleBtn.className = `px-4 py-2 border rounded-lg cursor-pointer transition-colors text-sm ${selectedValue === 'ذكر' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white'}`;
            femaleBtn.className = `px-4 py-2 border rounded-lg cursor-pointer transition-colors text-sm ${selectedValue === 'أنثى' ? 'bg-pink-400 text-white border-pink-400' : 'bg-white'}`;
        };

        maleBtn.onclick = () => updateSelection('ذكر');
        femaleBtn.onclick = () => updateSelection('أنثى');

        genderContainer.appendChild(maleBtn);
        genderContainer.appendChild(femaleBtn);
        fieldWrapper.appendChild(genderContainer);
        updateSelection(value);
    } else {
        const valueInput = document.createElement('input');
        valueInput.type = 'text';
        valueInput.value = value;
        valueInput.className = 'field-value flex-grow px-3 py-2 border rounded-lg';
        valueInput.placeholder = "القيمة";
        valueInput.dataset.key = key;
        if (key === "الاسم الكامل (بالعربية)") {
            valueInput.required = true;
            valueInput.addEventListener('blur', function () {
                const studentIdInput = document.getElementById('studentIdInput');
                if (!studentIdInput || !studentIdInput.value) {
                    lookupPastStudent(this.value.trim());
                }
            });
        }
        fieldWrapper.appendChild(valueInput);
    }

    if (key !== "الاسم الكامل (بالعربية)" && key !== "Nom et Prénom (en Français)" && key !== "الجنس") {
        const editBtn = document.createElement('button');
        editBtn.innerHTML = `<i data-feather="edit-2" class="w-4 h-4"></i>`;
        editBtn.className = 'text-blue-500 hover:text-blue-700';
        editBtn.title = 'تعديل اسم الخانة';
        editBtn.onclick = (e) => { e.preventDefault(); editCustomField(key); };

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = `<i data-feather="trash-2" class="w-4 h-4"></i>`;
        deleteBtn.className = 'text-red-500 hover:text-red-700';
        deleteBtn.title = 'حذف الخانة';
        deleteBtn.onclick = (e) => { e.preventDefault(); deleteCustomField(key); };

        fieldWrapper.appendChild(editBtn);
        fieldWrapper.appendChild(deleteBtn);
    } else {
        fieldWrapper.appendChild(document.createElement('span')).className = 'w-12';
    }

    return fieldWrapper;
}

// البحث عن بيانات التلميذ في السنوات الدراسية السابقة وجلبها
function lookupPastStudent(name) {
    if (!name) return;
    const pastYears = academicYears
        .filter(y => y !== currentAcademicYear)
        .sort((a, b) => b.localeCompare(a));

    const studentImagePreview = document.getElementById('studentImagePreview');
    const studentFieldsContainer = document.getElementById('studentFieldsContainer');

    for (const year of pastYears) {
        const yearData = academicData[year];
        if (yearData && yearData.students) {
            const foundStudent = yearData.students.find(s => {
                const sName = s.info && s.info['الاسم الكامل (بالعربية)'];
                return sName && sName.trim() === name;
            });

            if (foundStudent) {
                const confirmImport = confirm(`تم العثور على التلميذ(ة) "${name}" مسجلاً في السنة الدراسية السابقة ${year}.\nهل تريد جلب معلوماته وصورته تلقائياً؟`);
                if (confirmImport) {
                    const studentInfo = foundStudent.info || {};
                    if (studentImagePreview) {
                        studentImagePreview.src = studentInfo['صورة'] || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
                    }

                    if (studentFieldsContainer) {
                        studentFieldsContainer.querySelectorAll('.field-wrapper').forEach(wrapper => {
                            const fieldKey = wrapper.dataset.key;
                            const fieldElement = wrapper.querySelector('.field-value');

                            if (fieldKey && fieldKey !== 'الاسم الكامل (بالعربية)') {
                                const val = studentInfo[fieldKey] || '';
                                if (fieldKey === 'الجنس') {
                                    fieldElement.dataset.value = val;
                                    const maleBtn = fieldElement.querySelector('[data-gender="ذكر"]');
                                    const femaleBtn = fieldElement.querySelector('[data-gender="أنثى"]');
                                    if (maleBtn && femaleBtn) {
                                        maleBtn.className = `px-4 py-2 border rounded-lg cursor-pointer transition-colors text-sm ${val === 'ذكر' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white'}`;
                                        femaleBtn.className = `px-4 py-2 border rounded-lg cursor-pointer transition-colors text-sm ${val === 'أنثى' ? 'bg-pink-400 text-white border-pink-400' : 'bg-white'}`;
                                    }
                                } else if (fieldElement) {
                                    fieldElement.value = val;
                                }
                            }
                        });
                    }

                    alert(`موافق: تم جلب معلومات التلميذ(ة) وصورته بنجاح من السنة الدراسية ${year}. ✅`);
                }
                break;
            }
        }
    }
}

// فتح مودال إضافة أو تعديل تلميذ
function openStudentModal(studentId = null) {
    const studentModal = document.getElementById('studentModal');
    const studentModalTitle = document.getElementById('studentModalTitle');
    const studentFieldsContainer = document.getElementById('studentFieldsContainer');
    const studentIdInput = document.getElementById('studentIdInput');
    const studentImageInput = document.getElementById('studentImageInput');
    const studentImagePreview = document.getElementById('studentImagePreview');
    const printCardBtn = document.getElementById('printCardBtn');

    if (!studentModal || !studentFieldsContainer) return;

    studentFieldsContainer.innerHTML = '';
    studentIdInput.value = studentId || '';
    if (studentImageInput) studentImageInput.value = '';
    if (studentImagePreview) studentImagePreview.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    if (printCardBtn) printCardBtn.classList.add('hidden');

    if (studentId) {
        studentModalTitle.innerHTML = `تعديل بطاقة التلميذ <span class="text-sm font-normal text-gray-500">(${currentAcademicYear})</span>`;
        const student = students.find(s => String(s.id) === String(studentId));
        const studentInfo = student ? (student.info || {}) : {};
        if (studentInfo['صورة'] && studentImagePreview) studentImagePreview.src = studentInfo['صورة'];
        if (printCardBtn) printCardBtn.classList.remove('hidden');
    } else {
        studentModalTitle.innerHTML = `إضافة تلميذ جديد <span class="text-sm font-normal text-gray-500">(${currentAcademicYear})</span>`;
    }

    // تهيئة وتحديد القسم في بطاقة التلميذ
    const studentModalDeptSelect = document.getElementById('studentModalDeptSelect');
    if (studentModalDeptSelect) {
        studentModalDeptSelect.innerHTML = '<option value="">-- اختر القسم --</option>';
        departments.forEach(d => {
            studentModalDeptSelect.appendChild(new Option(d.name, d.id));
        });

        if (studentId) {
            const student = students.find(s => String(s.id) === String(studentId));
            if (student && student.deptId) {
                studentModalDeptSelect.value = student.deptId;
            } else {
                studentModalDeptSelect.value = "";
            }
        } else {
            const deptSelectForStudents = document.getElementById('deptSelectForStudents');
            const currentFilter = deptSelectForStudents ? deptSelectForStudents.value : "";
            if (currentFilter && currentFilter !== 'all' && currentFilter !== 'unassigned') {
                studentModalDeptSelect.value = currentFilter;
            } else if (departments.length > 0) {
                studentModalDeptSelect.value = departments[0].id;
            }
        }
    }

    const studentInfo = studentId ? (students.find(s => String(s.id) === String(studentId))?.info || {}) : {};
    if (!studentFields) {
        studentFields = ["الاسم الكامل (بالعربية)", "Nom et Prénom (en Français)", "الجنس", "تاريخ الازدياد", "مكان الازدياد", "هاتف ولي الأمر"];
    }
    studentFields.forEach(field => {
        studentFieldsContainer.appendChild(createFieldInput(field, studentInfo[field] || ''));
    });

    studentModal.classList.remove('hidden');
    setupDragAndDrop();
    if (typeof feather !== 'undefined') feather.replace();
}

function editCustomField(oldFieldName) {
    const newFieldName = prompt(`تعديل اسم الخانة "${oldFieldName}":`, oldFieldName);
    if (newFieldName && newFieldName.trim() !== "" && newFieldName.trim() !== oldFieldName) {
        const trimmedName = newFieldName.trim();
        if (studentFields.includes(trimmedName)) {
            return alert("هذا الاسم موجود بالفعل.");
        }

        const fieldIndex = studentFields.indexOf(oldFieldName);
        if (fieldIndex > -1) studentFields[fieldIndex] = trimmedName;

        students.forEach(student => {
            if (student.info && student.info.hasOwnProperty(oldFieldName)) {
                student.info[trimmedName] = student.info[oldFieldName];
                delete student.info[oldFieldName];
            }
        });

        saveAll();
        const studentIdInput = document.getElementById('studentIdInput');
        openStudentModal(studentIdInput ? studentIdInput.value : null);
    }
}

function deleteCustomField(fieldName) {
    if (confirm(`هل أنت متأكد من حذف الخانة "${fieldName}"؟ سيتم حذفها من جميع التلاميذ.`)) {
        studentFields = studentFields.filter(f => f !== fieldName);
        students.forEach(student => {
            if (student.info) delete student.info[fieldName];
        });
        saveAll();
        const studentIdInput = document.getElementById('studentIdInput');
        openStudentModal(studentIdInput ? studentIdInput.value : null);
    }
}

function setupDragAndDrop() {
    const container = document.getElementById('studentFieldsContainer');
    if (!container) return;
    let draggedItem = null;

    container.querySelectorAll('.field-wrapper[draggable="true"]').forEach(item => {
        item.addEventListener('dragstart', () => {
            draggedItem = item;
            setTimeout(() => item.style.opacity = '0.5', 0);
        });

        item.addEventListener('dragend', () => {
            setTimeout(() => {
                draggedItem.style.opacity = '1';
                draggedItem = null;
            }, 0);
        });
    });

    container.addEventListener('dragover', e => {
        e.preventDefault();
        const afterElement = getDragAfterElement(container, e.clientY);
        if (afterElement == null) {
            container.appendChild(draggedItem);
        } else {
            container.insertBefore(draggedItem, afterElement);
        }
    });

    container.addEventListener('drop', () => {
        const newOrder = [];
        container.querySelectorAll('.field-wrapper').forEach(item => {
            if (item.dataset.key) {
                newOrder.push(item.dataset.key);
            }
        });
        studentFields = newOrder;
        saveAll();
    });

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.field-wrapper:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
            else return closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
}

// ربط أحداث التلاميذ
const homeDeptSelectEl = document.getElementById("homeDeptSelect");
if (homeDeptSelectEl) {
    homeDeptSelectEl.addEventListener("change", function () {
        appStorage.setItem("selectedHomeDept", homeDeptSelectEl.value);
        renderHomeStudents();
    });
}

const homeStudentSelectEl = document.getElementById("homeStudentSelect");
if (homeStudentSelectEl) {
    homeStudentSelectEl.addEventListener("change", function () {
        appStorage.setItem("selectedHomeStudent", homeStudentSelectEl.value);
        const val = homeStudentSelectEl.value;
        if (!val) {
            selectedHomeStudentId = null;
            const homeStudentInfo = document.getElementById("homeStudentInfo");
            const studentDisplaySection = document.getElementById("studentDisplaySection");
            const tableDeptLabel = document.getElementById("tableDeptLabel");
            if (homeStudentInfo) homeStudentInfo.textContent = "";
            if (studentDisplaySection) studentDisplaySection.classList.add("hidden");
            if (tableDeptLabel) tableDeptLabel.textContent = "";
            return;
        }
        selectHomeStudent(val);
    });
}

const clearSelectionBtn = document.getElementById("clearSelection");
if (clearSelectionBtn) {
    clearSelectionBtn.addEventListener("click", () => {
        const homeStudentSelect = document.getElementById("homeStudentSelect");
        if (homeStudentSelect) homeStudentSelect.value = "";
        appStorage.removeItem("selectedHomeStudent");
        selectedHomeStudentId = null;
        const homeStudentInfo = document.getElementById("homeStudentInfo");
        const studentDisplaySection = document.getElementById("studentDisplaySection");
        const tableDeptLabel = document.getElementById("tableDeptLabel");
        if (homeStudentInfo) homeStudentInfo.textContent = "";
        if (studentDisplaySection) studentDisplaySection.classList.add("hidden");
        if (tableDeptLabel) tableDeptLabel.textContent = "";
    });
}

const deptSelectForStudentsEl = document.getElementById("deptSelectForStudents");
if (deptSelectForStudentsEl) {
    deptSelectForStudentsEl.addEventListener("change", function () {
        appStorage.setItem("selectedDeptForStudents", deptSelectForStudentsEl.value);
        renderStudents();
    });
}

const studentSearchEl = document.getElementById("studentSearch");
if (studentSearchEl) {
    studentSearchEl.addEventListener("input", renderStudents);
}

const addStudentBtnEl = document.getElementById('addStudentBtn');
if (addStudentBtnEl) {
    addStudentBtnEl.onclick = () => openStudentModal();
}

const studentModalCancelBtn = document.getElementById('studentModalCancel');
if (studentModalCancelBtn) {
    studentModalCancelBtn.onclick = () => document.getElementById('studentModal').classList.add('hidden');
}

const addNewFieldBtnEl = document.getElementById('addNewFieldBtn');
if (addNewFieldBtnEl) {
    addNewFieldBtnEl.onclick = () => {
        const newFieldName = prompt("أدخل اسم الخانة الجديدة (ستتم إضافتها لجميع التلاميذ):");
        if (newFieldName && newFieldName.trim() !== "") {
            const trimmedName = newFieldName.trim();
            if (studentFields.includes(trimmedName)) {
                return alert("هذه الخانة موجودة بالفعل.");
            }
            studentFields.push(trimmedName);
            saveAll();
            const studentIdInput = document.getElementById('studentIdInput');
            openStudentModal(studentIdInput ? studentIdInput.value : null);
        }
    };
}

const deleteImageBtnEl = document.getElementById('deleteImageBtn');
if (deleteImageBtnEl) {
    deleteImageBtnEl.onclick = function (e) {
        e.preventDefault();
        if (confirm("هل أنت متأكد من حذف صورة التلميذ؟")) {
            const studentIdInput = document.getElementById('studentIdInput');
            const studentId = studentIdInput ? studentIdInput.value : null;
            if (studentId) {
                const student = students.find(s => String(s.id) === String(studentId));
                if (student && student.info) {
                    delete student.info['صورة'];
                    saveAll();
                }
            }
            const studentImagePreview = document.getElementById('studentImagePreview');
            if (studentImagePreview) studentImagePreview.src = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
        }
    };
}

const studentImageInputEl = document.getElementById('studentImageInput');
if (studentImageInputEl) {
    studentImageInputEl.addEventListener('change', async function () {
        if (this.files && this.files[0]) {
            const compressedBase64 = await compressImage(this.files[0], 300, 0.7);
            const studentImagePreview = document.getElementById('studentImagePreview');
            if (studentImagePreview) studentImagePreview.src = compressedBase64;
        }
    });
}

const studentDetailFormEl = document.getElementById('studentDetailForm');
if (studentDetailFormEl) {
    studentDetailFormEl.addEventListener('submit', (e) => {
        e.preventDefault();
        const studentIdInput = document.getElementById('studentIdInput');
        const studentId = studentIdInput ? studentIdInput.value : null;

        // قراءة القسم المختار من بطاقة التلميذ مباشرة
        const studentModalDeptSelect = document.getElementById('studentModalDeptSelect');
        let deptId = studentModalDeptSelect ? studentModalDeptSelect.value : "";

        // كخيار احتياطي إذا لم يُحدد في البطاقة نأخذ من فلتر الأقسام
        if (!deptId) {
            const deptSelectForStudents = document.getElementById('deptSelectForStudents');
            const filterVal = deptSelectForStudents ? deptSelectForStudents.value : "";
            if (filterVal && filterVal !== 'all' && filterVal !== 'unassigned') {
                deptId = filterVal;
            }
        }

        if (!deptId) return alert('الرجاء اختيار قسم للتلميذ.');

        const newInfo = {};
        const studentFieldsContainer = document.getElementById('studentFieldsContainer');
        if (studentFieldsContainer) {
            studentFieldsContainer.querySelectorAll('.field-wrapper').forEach(wrapper => {
                const key = wrapper.dataset.key;
                const fieldElement = wrapper.querySelector('.field-value');
                if (key === 'الجنس') {
                    newInfo[key] = fieldElement.dataset.value || '';
                } else if (key && fieldElement) {
                    newInfo[key] = fieldElement.value.trim();
                }
            });
        }

        if (!newInfo['الاسم الكامل (بالعربية)']) return alert('الرجاء إدخال الاسم الكامل (بالعربية) للتلميذ.');

        const studentImagePreview = document.getElementById('studentImagePreview');
        if (studentImagePreview) {
            if (studentImagePreview.src.startsWith('data:image') || (!studentImagePreview.src.includes('flaticon.com') && studentImagePreview.src !== '')) {
                newInfo['صورة'] = studentImagePreview.src;
            } else if (studentImagePreview.src.includes('flaticon.com')) {
                delete newInfo['صورة'];
            } else {
                const student = studentId ? students.find(s => String(s.id) === String(studentId)) : null;
                if (student && student.info && student.info['صورة']) newInfo['صورة'] = student.info['صورة'];
            }
        }

        if (studentId) {
            const student = students.find(s => String(s.id) === String(studentId));
            if (student) {
                student.info = newInfo;
                student.deptId = deptId;
            }
        } else {
            students.push({ id: String(Date.now()), deptId, info: newInfo });
        }

        saveAll();
        renderStudents();
        renderDepartments();
        renderHomeStudents();
        if (typeof renderAllStudentsList === 'function') renderAllStudentsList();
        if (typeof renderUnassignedStudentsInAdmin === 'function') renderUnassignedStudentsInAdmin();
        document.getElementById('studentModal').classList.add('hidden');
    });
}

// فتح وإغلاق نافذة قائمة جميع التلاميذ
const totalStudentsCard = document.getElementById('totalStudentsCard');
if (totalStudentsCard) {
    totalStudentsCard.onclick = () => {
        renderAllStudentsList();
        document.getElementById('allStudentsModal').classList.remove('hidden');
    };
}

const allStudentsModalClose = document.getElementById('allStudentsModalClose');
if (allStudentsModalClose) {
    allStudentsModalClose.onclick = () => {
        document.getElementById('allStudentsModal').classList.add('hidden');
    };
}

const allStudentsSearch = document.getElementById('allStudentsSearch');
if (allStudentsSearch) {
    allStudentsSearch.addEventListener('input', renderAllStudentsList);
}
