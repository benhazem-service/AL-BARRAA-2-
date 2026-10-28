// ============================================================
// === 12. إدارة الصور الملحقة بالنتيجة (Report Card Images) ===
// ============================================================

let imagesVisible = true;

function createDraggableImage(src, initialPos = {}) {
    const page = document.getElementById("sheet");
    if (!page) return;

    const imgWrapper = document.createElement("div");
    imgWrapper.className = "draggable";
    const image = document.createElement("img");
    image.src = src;
    image.style.width = "100%";
    image.style.height = "100%";
    image.style.display = "block";
    image.style.borderRadius = "6px";
    imgWrapper.appendChild(image);

    const handle = document.createElement("div");
    handle.className = "resize-handle";
    imgWrapper.appendChild(handle);

    // إضافة زر الحذف
    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = `&times;`;
    deleteBtn.title = "حذف الصورة (نقرة مزدوجة للحذف السريع)";
    deleteBtn.className = "delete-image-btn absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-lg leading-none z-10 hidden";

    imgWrapper.addEventListener('mouseenter', () => deleteBtn.classList.remove('hidden'));
    imgWrapper.addEventListener('mouseleave', () => {
        if (!imgWrapper.classList.contains('active')) {
            deleteBtn.classList.add('hidden');
        }
    });

    deleteBtn.onclick = (e) => {
        e.stopPropagation();
        const performImgDelete = () => {
            imgWrapper.remove();
            if (typeof saveReportCard === 'function') saveReportCard(selectedHomeStudentId);
        };
        if (typeof openDeleteConfirmModal === 'function') {
            openDeleteConfirmModal("هل أنت متأكد من حذف هذه الصورة؟", performImgDelete);
        } else {
            if (confirm("هل تريد حذف هذه الصورة؟")) {
                performImgDelete();
            }
        }
    };
    imgWrapper.appendChild(deleteBtn);

    imgWrapper.style.top = initialPos.top || "80px";
    imgWrapper.style.left = initialPos.left || "80px";
    imgWrapper.style.width = initialPos.width || "100px";
    imgWrapper.style.height = initialPos.height || "auto";
    page.appendChild(imgWrapper);

    let isDragging = false, isResizing = false;
    let offsetX, offsetY, startX, startY, startWidth, startHeight;

    imgWrapper.addEventListener("mousedown", e => {
        if (page.classList.contains('images-locked')) return;
        if (e.detail > 1) {
            e.preventDefault();
            return;
        }
        if (e.target === handle) return;
        isDragging = true;
        imgWrapper.classList.add("active");
        deleteBtn.classList.remove('hidden');
        offsetX = e.clientX - imgWrapper.getBoundingClientRect().left;
        offsetY = e.clientY - imgWrapper.getBoundingClientRect().top;
    });

    imgWrapper.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        const performImgDelete = () => {
            imgWrapper.remove();
            if (typeof saveReportCard === 'function') saveReportCard(selectedHomeStudentId);
        };
        if (typeof openDeleteConfirmModal === 'function') {
            openDeleteConfirmModal("هل أنت متأكد من حذف هذه الصورة؟", performImgDelete);
        } else {
            if (confirm("هل أنت متأكد من حذف هذه الصورة؟")) {
                performImgDelete();
            }
        }
    });

    handle.addEventListener("mousedown", e => {
        e.stopPropagation();
        if (page.classList.contains('images-locked')) return;
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = parseInt(window.getComputedStyle(imgWrapper).width);
        startHeight = parseInt(window.getComputedStyle(imgWrapper).height);
    });

    document.addEventListener("mousemove", e => {
        if (isDragging) {
            const rect = page.getBoundingClientRect();
            let leftPx = e.clientX - rect.left - offsetX;
            let topPx = e.clientY - rect.top - offsetY;

            imgWrapper.style.left = (leftPx / rect.width * 100) + "%";
            imgWrapper.style.top = (topPx / rect.height * 100) + "%";
        } else if (isResizing) {
            const rect = page.getBoundingClientRect();
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            let newWidthPx = startWidth + dx;
            let newHeightPx = startHeight + dy;

            imgWrapper.style.width = (newWidthPx / rect.width * 100) + "%";
            imgWrapper.style.height = (newHeightPx / rect.height * 100) + "%";
        }
    });

    document.addEventListener("mouseup", () => {
        if (isDragging || isResizing) {
            if (typeof saveReportCard === 'function') saveReportCard(selectedHomeStudentId);
        }
        isDragging = false;
        isResizing = false;
        imgWrapper.classList.remove("active");
        if (!imgWrapper.matches(':hover')) {
            deleteBtn.classList.add('hidden');
        }
    });
}

// تطبيق حالة قفل الصور المحفوظة
function applyImageLockState() {
    const sheetContainer = document.getElementById('sheet');
    const toggleLockImagesBtn = document.getElementById('toggleLockImagesBtn');
    if (!sheetContainer || !toggleLockImagesBtn) return;

    const isLocked = appStorage.getItem('imagesLockedState') === 'true';
    if (isLocked) {
        sheetContainer.classList.add('images-locked');
    } else {
        sheetContainer.classList.remove('images-locked');
    }
    toggleLockImagesBtn.innerHTML = isLocked ? '✏️ تحرير الصور' : '🔒 تثبيت الصور';
    toggleLockImagesBtn.classList.toggle('bg-yellow-500', !isLocked);
    toggleLockImagesBtn.classList.toggle('bg-blue-500', isLocked);
}

// إخفاء وإظهار الصور
function toggleImagesVisibility() {
    imagesVisible = !imagesVisible;
    const sheet = document.getElementById('sheet');
    const btn = document.getElementById('toggleShowImagesBtn');
    if (!sheet) return;

    if (imagesVisible) {
        sheet.classList.remove('hide-images');
        if (btn) {
            btn.innerHTML = '👁 إخفاء الصور';
            btn.classList.replace('bg-gray-400', 'bg-gray-500');
            btn.classList.replace('hover:bg-gray-500', 'hover:bg-gray-600');
        }
    } else {
        sheet.classList.add('hide-images');
        if (btn) {
            btn.innerHTML = '👁 إظهار الصور';
            btn.classList.replace('bg-gray-500', 'bg-gray-400');
            btn.classList.replace('hover:bg-gray-600', 'hover:bg-gray-500');
        }
    }
}

// ربط أحداث الصور
const imageInputEl = document.getElementById("imageInput");
if (imageInputEl) {
    imageInputEl.addEventListener("change", async e => {
        const file = e.target.files[0];
        if (!file) return;
        const compressedBase64 = await compressImage(file, 600, 0.6);
        createDraggableImage(compressedBase64);
        if (typeof saveReportCard === 'function') saveReportCard(selectedHomeStudentId);
        e.target.value = '';
    });
}

const toggleLockImagesBtn = document.getElementById('toggleLockImagesBtn');
if (toggleLockImagesBtn) {
    toggleLockImagesBtn.addEventListener('click', () => {
        const sheetContainer = document.getElementById('sheet');
        if (sheetContainer) {
            sheetContainer.classList.toggle('images-locked');
            const isLocked = sheetContainer.classList.contains('images-locked');
            appStorage.setItem('imagesLockedState', isLocked);
            applyImageLockState();
        }
    });
}

// تطبيق حالة القفل الأولية
applyImageLockState();
