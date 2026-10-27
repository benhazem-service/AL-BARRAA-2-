// ============================================================
// === 9. إدارة الملاحظات العامة والتلقائية (Observations) ===
// ============================================================

function renderGeneralObservations() {
    const observationList = document.getElementById('observationList');
    if (observationList && typeof renderList === 'function') {
        renderList(observationList, generalObservations, 'observation');
    }
    renderScoreObservations();
    if (typeof feather !== 'undefined') feather.replace();
}

function renderGeneralSettings() {
    const institutionNameInput = document.getElementById('institutionNameInput');
    if (institutionNameInput) {
        institutionNameInput.value = institutionName || '';
    }
}

function editObservation(index) {
    const oldName = generalObservations[index];
    const newName = prompt('تعديل الملاحظة:', oldName);
    if (newName && newName.trim() !== '' && !generalObservations.includes(newName.trim())) {
        generalObservations[index] = newName.trim();
        saveAll();
        renderGeneralObservations();
    }
}

function renderScoreObservations() {
    const scoreObservationList = document.getElementById('scoreObservationList');
    if (!scoreObservationList) return;

    scoreObservationList.innerHTML = '';
    if (scoreObservations.length === 0) {
        scoreObservationList.innerHTML = `<p class="text-gray-500 text-center">لا توجد ملاحظات حسب النقطة.</p>`;
        return;
    }
    const sortedObservations = [...scoreObservations].sort((a, b) => a.min - b.min);

    sortedObservations.forEach((obs, index) => {
        const li = document.createElement('li');
        li.className = "flex justify-between items-center bg-teal-50 p-3 rounded-lg";
        li.innerHTML = `
            <div>
                <span class="font-mono bg-white px-2 py-1 rounded"><strong>${obs.min}</strong> - <strong>${obs.max}</strong></span>
                <i data-feather="arrow-right" class="inline-block w-4 h-4 mx-2 text-gray-500"></i>
                <span class="font-medium text-teal-800">${obs.text}</span>
            </div>
            <div class="flex gap-2">
                <button class="text-red-500 hover:text-red-700" onclick="deleteScoreObservation(${index})"><i data-feather="trash-2" class="w-4 h-4"></i></button>
            </div>
        `;
        scoreObservationList.appendChild(li);
    });
    if (typeof feather !== 'undefined') feather.replace();
}

function deleteScoreObservation(index) {
    const sorted = [...scoreObservations].sort((a, b) => a.min - b.min);
    const itemToDelete = sorted[index];
    if (!itemToDelete) return;
    scoreObservations = scoreObservations.filter(obs => obs.min !== itemToDelete.min || obs.max !== itemToDelete.max || obs.text !== itemToDelete.text);
    saveAll();
    renderScoreObservations();
}

// ربط أحداث نماذج الملاحظات
const observationForm = document.getElementById('observationForm');
const observationNameInput = document.getElementById('observationName');
if (observationForm && observationNameInput) {
    observationForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = observationNameInput.value.trim();
        if (name && !generalObservations.includes(name)) {
            generalObservations.push(name);
            saveAll();
            if (typeof renderReportActivities === 'function') renderReportActivities();
            renderGeneralObservations();
            renderScoreObservations();
            observationNameInput.value = '';
        }
    });
}

const scoreObservationForm = document.getElementById('scoreObservationForm');
if (scoreObservationForm) {
    scoreObservationForm.addEventListener('submit', e => {
        e.preventDefault();
        const min = parseFloat(document.getElementById('scoreObsMin').value);
        const max = parseFloat(document.getElementById('scoreObsMax').value);
        const text = document.getElementById('scoreObsText').value.trim();

        if (isNaN(min) || isNaN(max) || !text) {
            alert("الرجاء ملء جميع الخانات بشكل صحيح.");
            return;
        }
        if (min >= max) {
            alert("يجب أن تكون النقطة الدنيا أصغر من النقطة القصوى.");
            return;
        }

        scoreObservations.push({ min, max, text });
        saveAll();
        renderScoreObservations();
        scoreObservationForm.reset();
    });
}

const instNameInput = document.getElementById('institutionNameInput');
if (instNameInput) {
    instNameInput.addEventListener('blur', () => {
        institutionName = instNameInput.value.trim();
        saveAll();
    });
}
