// Get DOM elements
const promptInput = document.getElementById('promptInput');
const generateBtn = document.getElementById('generateBtn');
const btnText = document.querySelector('.btn-text');
const btnLoader = document.querySelector('.btn-loader');
const resultSection = document.getElementById('resultSection');
const resultContent = document.getElementById('resultContent');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const copyBtn = document.getElementById('copyBtn');

// Event listeners
generateBtn.addEventListener('click', generateFormFields);
copyBtn.addEventListener('click', copyToClipboard);

// Allow Enter + Shift to generate
promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.shiftKey) {
        e.preventDefault();
        generateFormFields();
    }
});

/**
 * Main function to generate form fields
 */
async function generateFormFields() {
    const prompt = promptInput.value.trim();
    
    // Validation
    if (!prompt) {
        showError('Please enter a description for your form');
        return;
    }
    
    // Hide previous results/errors
    hideError();
    hideResult();
    
    // Show loading state
    setLoading(true);
    
    try {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: prompt })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showResult(data.fields);
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
 * Set loading state for the button
 */
function setLoading(isLoading) {
    generateBtn.disabled = isLoading;
    
    if (isLoading) {
        btnText.style.display = 'none';
        btnLoader.style.display = 'inline';
    } else {
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

/**
 * Display the generated result
 */
function showResult(fields) {
    resultContent.textContent = fields;
    resultSection.style.display = 'block';
    
    // Smooth scroll to result
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Hide the result section
 */
function hideResult() {
    resultSection.style.display = 'none';
}

/**
 * Display an error message
 */
function showError(message) {
    errorMessage.textContent = message;
    errorSection.style.display = 'block';
    
    // Smooth scroll to error
    errorSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Hide the error section
 */
function hideError() {
    errorSection.style.display = 'none';
}

/**
 * Copy result to clipboard
 */
async function copyToClipboard() {
    const text = resultContent.textContent;
    
    try {
        await navigator.clipboard.writeText(text);
        
        // Visual feedback
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅ Copied!';
        copyBtn.style.background = '#4caf50';
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