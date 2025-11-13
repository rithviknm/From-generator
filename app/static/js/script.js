// Get DOM elements
const promptInput = document.getElementById('promptInput');
const generateBtn = document.getElementById('generateBtn');
const btnText = generateBtn.querySelector('.btn-text');
const btnLoader = generateBtn.querySelector('.loader');
const resultSection = document.getElementById('resultSection');
const fieldsContainer = document.getElementById('fieldsContainer');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const copyBtn = document.getElementById('copyBtn');
const selectAllBtn = document.getElementById('selectAllBtn');
const deselectAllBtn = document.getElementById('deselectAllBtn');
const toggleRawBtn = document.getElementById('toggleRawBtn');
const rawResponse = document.getElementById('rawResponse');
const editModal = document.getElementById('editModal');
const addFieldModal = document.getElementById('addFieldModal');
const initialQuestionsModal = document.getElementById('initialQuestionsModal');
const mainInputSection = document.getElementById('mainInputSection');
const skipQuestionsBtn = document.getElementById('skipQuestionsBtn');
const startCreatingBtn = document.getElementById('startCreatingBtn');
const addFieldBtn = document.getElementById('addFieldBtn');
const formContext = document.getElementById('formContext');
const contextTitle = document.getElementById('contextTitle');
const previewModal = document.getElementById('previewModal');
const previewBtn = document.getElementById('previewBtn');
const themeSwitcher = document.getElementById('themeSwitcher');
const formPreviewContainer = document.getElementById('formPreviewContainer');
const finalizeBtn = document.getElementById('finalizeBtn');


// Store fields data and form context
let fieldsData = [];
let currentEditIndex = null;
let formContextData = {
    title: '',
    purpose: '',
    targetAudience: ''
};
let draggedElement = null;

// Event listeners
generateBtn.addEventListener('click', generateFormFields);
copyBtn.addEventListener('click', copySelectedFields);
selectAllBtn.addEventListener('click', selectAllFields);
deselectAllBtn.addEventListener('click', deselectAllFields);
toggleRawBtn.addEventListener('click', toggleRawResponse);
startCreatingBtn.addEventListener('click', handleInitialQuestions);
skipQuestionsBtn.addEventListener('click', skipInitialQuestions);
addFieldBtn.addEventListener('click', openAddFieldModal);
previewBtn.addEventListener('click', openPreviewModal);
themeSwitcher.addEventListener('change', applyTheme);
finalizeBtn.addEventListener('click', finalizeForm);

// Allow Enter + Shift to generate
promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        generateFormFields();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    createFlyingForms();

    // Show form creation interface if logged in
    if (typeof window.isAuthenticated !== 'undefined' && window.isAuthenticated) {
        // Show the initial questions modal for logged-in users
        document.getElementById('initialQuestionsModal').style.display = 'flex';
    } else {
        // Hide/disable generation features for non-authenticated users
        document.getElementById('mainInputSection').style.display = 'none';
        document.getElementById('initialQuestionsModal').style.display = 'none';
    }
});

function createFlyingForms() {
    const container = document.querySelector('.animation-container');
    if (!container) return;

    const icons = ['📝', '📋', '📄', '🖋️', '🗒️', '📑'];
    const formCount = 20;

    for (let i = 0; i < formCount; i++) {
        const form = document.createElement('div');
        form.classList.add('form-icon');
        
        const size = Math.random() * 80 + 20; // 20px to 100px
        form.style.width = `${size}px`;
        form.style.height = `${size}px`;
        
        form.style.left = `${Math.random() * 100}%`;
        
        const animationDuration = Math.random() * 15 + 10; // 10s to 25s
        form.style.animationDuration = `${animationDuration}s`;
        
        const animationDelay = Math.random() * 10; // 0s to 10s
        form.style.animationDelay = `${animationDelay}s`;
        
        form.innerHTML = icons[Math.floor(Math.random() * icons.length)];
        
        container.appendChild(form);
    }
}

/**
 * Handle initial questions
 */
function handleInitialQuestions() {
    formContextData.title = document.getElementById('formTitle').value.trim();
    formContextData.purpose = document.getElementById('formPurpose').value.trim();
    formContextData.targetAudience = document.getElementById('targetAudience').value.trim();
    
    // Close modal and show main input
    initialQuestionsModal.style.display = 'none';
    mainInputSection.style.display = 'block';
    
    // Display context if provided
    if (formContextData.title || formContextData.purpose || formContextData.targetAudience) {
        formContext.style.display = 'block';
        const contextParts = [];
        if (formContextData.title) contextParts.push(`📋 ${formContextData.title}`);
        if (formContextData.purpose) contextParts.push(`🎯 ${formContextData.purpose}`);
        if (formContextData.targetAudience) contextParts.push(`👥 ${formContextData.targetAudience}`);
        contextTitle.textContent = contextParts.join(' • ');
    }
}

function skipInitialQuestions() {
    initialQuestionsModal.style.display = 'none';
    mainInputSection.style.display = 'block';
}

/**
 * Main function to generate form fields
 */
async function generateFormFields() {
    const prompt = typeof promptInput.value === 'string' ? promptInput.value.trim() : '';
    
    if (!prompt) {
        showError('Please enter a description for your form');
        return;
    }
    
    hideError();
    hideResult();
    setLoading(true);
    
    try {
        // Build enhanced prompt with context
        let enhancedPrompt = prompt;
        if (formContextData.title) enhancedPrompt = `Form Title: ${formContextData.title}\n${enhancedPrompt}`;
        if (formContextData.purpose) enhancedPrompt += `\nPurpose: ${formContextData.purpose}`;
        if (formContextData.targetAudience) enhancedPrompt += `\nTarget Audience: ${formContextData.targetAudience}`;
        
        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: enhancedPrompt })
        });
        
        let data;
        try {
            data = await response.json();
        } catch(jsonErr) {
            const fallbackText = await response.text();
            showError('Internal server error: ' + fallbackText);
            setLoading(false);
            return;
        }

        if (data.success) {
            parseAndDisplayFields(data.fields, data.raw_response);
        } else {
            showError(data.error || 'An error occurred while generating fields');
        }
        
    } catch (error) {
        showError('Network error: ' + error.message);
    } finally {
        setLoading(false);
    }
}

/**
 * Parse the response and display fields
 */
function parseAndDisplayFields(fields, rawText) {
    // If fields is already an array (from structured backend), use directly
    if (Array.isArray(fields)) {
        fieldsData = fields;
    } else if (typeof fields === 'string') {
        fieldsData = parseFields(fields);
    } else {
        showError('Unexpected response format from server.');
        return;
    }
    ensureFieldsSelected(); // always
    if (!fieldsData || fieldsData.length === 0) {
        showError('No fields could be parsed from the response');
        return;
    }
    displayFields();
    rawResponse.textContent = typeof rawText === 'string' ? rawText : '';
    resultSection.style.display = 'block';
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Parse fields from text
 */
function parseFields(text) {
    if (typeof text !== 'string') return [];
    const fields = [];
    const lines = text.trim().split('\n');
    
    for (let line of lines) {
        line = line.trim();
        
        // Skip empty lines
        if (!line) continue;
        
        // Check if line starts with a number
        const match = line.match(/^(\d+)\.\s*(.+)$/);
        if (!match) continue;
        
        const fieldText = match[2];
        const parts = fieldText.split(',').map(p => p.trim());
        
        if (parts.length < 3) continue;
        
        const field = {
            number: match[1],
            label: parts[0] || '',
            description: parts[1] || '',
            dataType: parts[2] || '',
            validation: parts[3] || '',
            enumValues: '',
            selected: true
        };
        
        // Extract enumerated values if present
        const enumMatch = fieldText.match(/\[(.*?)\]/);
        if (enumMatch) {
            field.enumValues = enumMatch[1];
            // Clean up validation to remove enum values
            if (field.validation) {
                field.validation = field.validation.replace(/\[.*?\]/, '').trim();
            }
        }
        
        fields.push(field);
    }
    
    return fields;
}

/**
 * Open the preview modal and render the form
 */
function openPreviewModal() {
    previewModal.style.display = 'flex';
    renderFormPreview();
}

/**
 * Close the preview modal
 */
function closePreviewModal() {
    previewModal.style.display = 'none';
}

/**
 * Render the form preview
 */
function renderFormPreview() {
    ensureFieldsSelected();
    // Sync JS: recalc selected from DOM checkboxes (fixes stale JS/UI mismatch)
    const checkboxes = document.querySelectorAll('.field-item input[type="checkbox"]');
    checkboxes.forEach((cb, idx) => {
        if (fieldsData[idx]) fieldsData[idx].selected = cb.checked;
    });

    console.log('fieldsData:', fieldsData);
    const selectedFields = fieldsData.filter(f => !!f.selected);
    console.log('selectedFields:', selectedFields);

    formPreviewContainer.innerHTML = '';
    if (selectedFields.length === 0) {
        formPreviewContainer.innerHTML = '<p>No fields selected for the form.</p>';
        return;
    }
    const form = document.createElement('form');
    selectedFields.forEach(field => {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';
        const label = document.createElement('label');
        label.textContent = field.label;
        formGroup.appendChild(label);
        let inputElement;
        switch (field.dataType && field.dataType.toLowerCase()) {
            case 'select':
                inputElement = document.createElement('select');
                const options = (field.enumValues || '').split(',').map(opt => opt.trim());
                options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt;
                    option.textContent = opt;
                    inputElement.appendChild(option);
                });
                break;
            case 'textarea':
                inputElement = document.createElement('textarea');
                break;
            default:
                inputElement = document.createElement('input');
                inputElement.type = field.dataType ? field.dataType.toLowerCase() : 'text';
        }
        inputElement.className = 'form-control';
        inputElement.placeholder = field.description || '';
        if (field.validation && field.validation.includes('required')) {
            inputElement.required = true;
        }
        formGroup.appendChild(inputElement);
        form.appendChild(formGroup);
    });
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'btn btn-primary';
    submitButton.textContent = 'Submit';
    form.appendChild(submitButton);
    formPreviewContainer.appendChild(form);
    applyTheme();
}

/**
 * Apply the selected theme to the preview
 */
function applyTheme() {
    const selectedTheme = themeSwitcher.value;
    formPreviewContainer.className = 'form-preview-container'; // Reset classes
    formPreviewContainer.classList.add(selectedTheme);
}

/**
 * Finalize the form and get a shareable URL
 */
async function finalizeForm() {
    const selectedFields = fieldsData.filter(f => f.selected);
    const theme = themeSwitcher.value;
    const title = formContextData.title || 'My New Form';

    if (selectedFields.length === 0) {
        alert('Please select at least one field to finalize the form.');
        return;
    }

    try {
        const response = await fetch('/finalize_form', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fields: selectedFields,
                theme: theme,
                title: title
            })
        });

        const data = await response.json();

        if (data.success) {
            const url = data.url;
            formPreviewContainer.innerHTML = `
                <h2>Form created successfully!</h2>
                <p>Share this URL with others:</p>
                <input type="text" class="form-control" value="${url}" readonly>
                <button class="btn btn-secondary" onclick="copyToClipboard('${url}')">Copy URL</button>
            `;
            finalizeBtn.style.display = 'none';
        } else {
            alert('Error finalizing form: ' + data.error);
        }
    } catch (error) {
        alert('An error occurred while finalizing the form.');
        console.error(error);
    }
}


/**
 * Display all fields
 */
function displayFields() {
    ensureFieldsSelected(); // safety!
    fieldsContainer.innerHTML = '';
    
    fieldsData.forEach((field, index) => {
        const fieldElement = createFieldElement(field, index);
        fieldsContainer.appendChild(fieldElement);
    });
    
    // Re-initialize drag and drop
    initializeDragAndDrop();
}

/**
 * Create a field element with simplified display
 */
function createFieldElement(field, index) {
    if (typeof field.selected === 'undefined') field.selected = true;
    const div = document.createElement('div');
    div.className = 'field-item' + (field.selected ? ' selected' : '');
    div.dataset.index = index;
    div.draggable = true;
    
    div.innerHTML = `
        <div class="field-header">
            <div class="field-checkbox">
                <input type="checkbox" ${field.selected ? 'checked' : ''} 
                       onchange="toggleFieldSelection(${index})">
                <span class="field-number">${field.number}.</span>
                <span class="field-label">${escapeHtml(field.label)}</span>
            </div>
            <div class="field-actions">
                <button class="toggle-details" onclick="toggleFieldDetails(${index})">ℹ️ Details</button>
                <button class="btn-edit" onclick="openEditModal(${index})">✏️ Edit</button>
                <button class="btn-delete" onclick="deleteField(${index})">🗑️</button>
            </div>
        </div>
        <div class="field-details" id="details-${index}">
            <div class="field-detail"><strong>Description:</strong> ${escapeHtml(field.description)}</div>
            <div class="field-detail"><strong>Data Type:</strong> ${escapeHtml(field.dataType)}</div>
            ${field.validation ? `<div class="field-detail"><strong>Validation:</strong> ${escapeHtml(field.validation)}</div>` : ''}
            ${field.enumValues ? `<div class="field-detail"><strong>Options:</strong> ${escapeHtml(field.enumValues)}</div>` : ''}
        </div>
    `;
    
    return div;
}

/**
 * Initialize drag and drop
 */
function initializeDragAndDrop() {
    const fieldItems = document.querySelectorAll('.field-item');
    
    fieldItems.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
    });
}

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    
    const dragging = document.querySelector('.dragging');
    const container = document.querySelector('.fields-container');
    const afterElement = getDragAfterElement(container, e.clientY);
    
    if (afterElement == null) {
        container.appendChild(dragging);
    } else {
        container.insertBefore(dragging, afterElement);
    }
    
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    if (draggedElement !== this) {
        const draggedIndex = parseInt(draggedElement.dataset.index);
        const targetIndex = parseInt(this.dataset.index);
        
        // Swap in array
        const draggedData = fieldsData[draggedIndex];
        fieldsData.splice(draggedIndex, 1);
        fieldsData.splice(targetIndex, 0, draggedData);
        
        // Renumber all fields
        fieldsData.forEach((field, idx) => {
            field.number = (idx + 1).toString();
        });
        
        // Re-display with new order
        displayFields();
    }
    
    return false;
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    draggedElement = null;
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.field-item:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/**
 * Toggle field details visibility
 */
function toggleFieldDetails(index) {
    const fieldElement = document.querySelector(`[data-index="${index}"]`);
    fieldElement.classList.toggle('expanded');
    
    const button = fieldElement.querySelector('.toggle-details');
    if (fieldElement.classList.contains('expanded')) {
        button.textContent = 'ℹ️ Hide Details';
    } else {
        button.textContent = 'ℹ️ Details';
    }
}

/**
 * Toggle field selection
 */
function toggleFieldSelection(index) {
    fieldsData[index].selected = !fieldsData[index].selected;
    displayFields();
}

/**
 * Select all fields
 */
function selectAllFields() {
    fieldsData.forEach(field => field.selected = true);
    displayFields();
}

/**
 * Deselect all fields
 */
function deselectAllFields() {
    fieldsData.forEach(field => field.selected = false);
    displayFields();
}

/**
 * Open edit modal
 */
function openEditModal(index) {
    currentEditIndex = index;
    const field = fieldsData[index];
    
    document.getElementById('editLabel').value = field.label;
    document.getElementById('editDescription').value = field.description;
    document.getElementById('editDataType').value = field.dataType;
    document.getElementById('editValidation').value = field.validation;
    document.getElementById('editEnum').value = field.enumValues;
    
    editModal.style.display = 'flex';
}

/**
 * Close edit modal
 */
function closeEditModal() {
    editModal.style.display = 'none';
    currentEditIndex = null;
}

/**
 * Save edited field
 */
function saveEdit() {
    if (currentEditIndex === null) return;
    
    const label = document.getElementById('editLabel').value.trim();
    if (!label) {
        alert('Field label is required');
        return;
    }
    
    const field = fieldsData[currentEditIndex];
    field.label = label;
    field.description = document.getElementById('editDescription').value.trim();
    field.dataType = document.getElementById('editDataType').value.trim();
    field.validation = document.getElementById('editValidation').value.trim();
    field.enumValues = document.getElementById('editEnum').value.trim();
    
    displayFields();
    closeEditModal();
}

/**
 * Delete a field
 */
function deleteField(index) {
    if (confirm('Are you sure you want to delete this field?')) {
        fieldsData.splice(index, 1);
        // Renumber fields
        fieldsData.forEach((field, idx) => {
            field.number = (idx + 1).toString();
        });
        displayFields();
    }
}

/**
 * Open add field modal
 */
function openAddFieldModal() {
    // Clear fields
    document.getElementById('addFieldLabel').value = '';
    document.getElementById('addFieldDescription').value = '';
    document.getElementById('addFieldDataType').value = 'text';
    document.getElementById('addFieldValidation').value = '';
    document.getElementById('addFieldEnum').value = '';
    
    addFieldModal.style.display = 'flex';
}

/**
 * Close add field modal
 */
function closeAddFieldModal() {
    addFieldModal.style.display = 'none';
}

/**
 * Save new field
 */
function saveNewField() {
    const label = document.getElementById('addFieldLabel').value.trim();
    if (!label) {
        alert('Field label is required');
        return;
    }
    
    const newField = {
        number: (fieldsData.length + 1).toString(),
        label: label,
        description: document.getElementById('addFieldDescription').value.trim(),
        dataType: document.getElementById('addFieldDataType').value.trim(),
        validation: document.getElementById('addFieldValidation').value.trim(),
        enumValues: document.getElementById('addFieldEnum').value.trim(),
        selected: true
    };
    
    fieldsData.push(newField);
    displayFields();
    closeAddFieldModal();
}

/**
 * Copy selected fields to clipboard
 */
function copySelectedFields() {
    const selectedFields = fieldsData.filter(f => f.selected);
    
    if (selectedFields.length === 0) {
        showError('No fields selected to copy');
        return;
    }
    
    let text = '';
    selectedFields.forEach(field => {
        text += `${field.number}. ${field.label}, ${field.description}, ${field.dataType}`;
        if (field.validation) text += `, ${field.validation}`;
        if (field.enumValues) text += `, [${field.enumValues}]`;
        text += '\n';
    });
    
    copyToClipboard(text);
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Copied!';
        copyBtn.style.background = '#10b981';
        copyBtn.style.color = 'white';
        
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = '';
            copyBtn.style.color = '';
        }, 2000);
        
    } catch (error) {
        showError('Failed to copy to clipboard');
    }
}

/**
 * Toggle raw response display
 */
function toggleRawResponse() {
    if (rawResponse.style.display === 'none') {
        rawResponse.style.display = 'block';
        toggleRawBtn.textContent = 'Hide Raw Response';
    } else {
        rawResponse.style.display = 'none';
        toggleRawBtn.textContent = 'Show Raw Response';
    }
}

/**
 * Set loading state
 */
function setLoading(isLoading) {
    generateBtn.disabled = isLoading;
    
    if (isLoading) {
        btnText.style.display = 'none';
        btnLoader.style.display = 'block';
    } else {
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

/**
 * Show result section
 */
function showResult() {
    resultSection.style.display = 'block';
}

/**
 * Hide result section
 */
function hideResult() {
    resultSection.style.display = 'none';
    fieldsData = [];
}

/**
 * Show error message
 */
function showError(message) {
    errorMessage.textContent = message;
    errorSection.style.display = 'block';
    errorSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Hide error section
 */
function hideError() {
    errorSection.style.display = 'none';
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Guarantee all fields have a 'selected' property where appropriate
function ensureFieldsSelected() {
    fieldsData.forEach(f => {
        if (typeof f.selected === 'undefined') f.selected = true;
    });
}

// Close modals when clicking outside
editModal.addEventListener('click', (e) => {
    if (e.target === editModal) {
        closeEditModal();
    }
});

addFieldModal.addEventListener('click', (e) => {
    if (e.target === addFieldModal) {
        closeAddFieldModal();
    }
});
