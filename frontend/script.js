const API_BASE = 'http://127.0.0.1:5000';

// Auth State
let isLoggedIn = false;
let isSignUpMode = false;

// Elements
const authOverlay = document.getElementById('authOverlay');
const mainAppContent = document.getElementById('mainAppContent');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const authForm = document.getElementById('authForm');
const nameGroup = document.getElementById('nameGroup');
const authName = document.getElementById('authName');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authSwitchText = document.getElementById('authSwitchText');
const authSwitchLink = document.getElementById('authSwitchLink');
const totalUsersStat = document.getElementById('totalUsersStat');

const loadingOverlay = document.getElementById('loadingOverlay');
const dropZone = document.getElementById('dropZone');
const imageInput = document.getElementById('imageInput');
const previewContainer = document.getElementById('previewContainer');
const imagePreview = document.getElementById('imagePreview');
const extractTextBtn = document.getElementById('extractTextBtn');
const cameraBtn = document.getElementById('cameraBtn');
const videoContainer = document.getElementById('videoContainer');
const cameraStream = document.getElementById('cameraStream');
const cameraCanvas = document.getElementById('cameraCanvas');
const captureBtn = document.getElementById('captureBtn');

const inputText = document.getElementById('inputText');
const targetLanguage = document.getElementById('targetLanguage');
const translateBtn = document.getElementById('translateBtn');
const outputText = document.getElementById('outputText');
const charCountIn = document.getElementById('charCountIn');
const charCountOut = document.getElementById('charCountOut');
const detectLangBtn = document.getElementById('detectLangBtn');
const detectedLangBadge = document.getElementById('detectedLangBadge');
const micBtn = document.getElementById('micBtn');
const listenBtn = document.getElementById('listenBtn');
const refreshStatsBtn = document.getElementById('refreshStatsBtn');

let currentImageFile = null;
let cameraActive = false;

// Helpers
function showLoading(msg) {
    loadingOverlay.querySelector('p').textContent = msg || 'Processing with AI...';
    loadingOverlay.classList.remove('hidden');
}
function hideLoading() { loadingOverlay.classList.add('hidden'); }
function scrollToSection(id) { document.getElementById(id).scrollIntoView({ behavior: 'smooth' }); }
function showToast(message, type='success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.getElementById('toastContainer').appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Drag & Drop
dropZone.addEventListener('click', () => imageInput.click());
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault(); dropZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleImage(e.dataTransfer.files[0]);
});
imageInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleImage(e.target.files[0]);
});

function handleImage(file) {
    if (!file.type.startsWith('image/')) return showToast("Please upload an image.", "error");
    currentImageFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.src = e.target.result;
        dropZone.classList.add('hidden');
        previewContainer.classList.remove('hidden');
        extractTextBtn.classList.remove('disabled');
    };
    reader.readAsDataURL(file);
}

function clearImage() {
    currentImageFile = null;
    imageInput.value = "";
    previewContainer.classList.add('hidden');
    dropZone.classList.remove('hidden');
    extractTextBtn.classList.add('disabled');
}

// Camera
cameraBtn.addEventListener('click', async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            cameraStream.srcObject = stream;
            videoContainer.classList.remove('hidden');
            dropZone.classList.add('hidden');
            cameraActive = true;
        } catch (err) {
            showToast("Camera access denied or unavailable", "error");
        }
    }
});

function stopCamera() {
    if (cameraStream.srcObject) {
        cameraStream.srcObject.getTracks().forEach(t => t.stop());
    }
    videoContainer.classList.add('hidden');
    if(!currentImageFile) dropZone.classList.remove('hidden');
    cameraActive = false;
}

captureBtn.addEventListener('click', () => {
    cameraCanvas.width = cameraStream.videoWidth;
    cameraCanvas.height = cameraStream.videoHeight;
    cameraCanvas.getContext('2d').drawImage(cameraStream, 0, 0);
    cameraCanvas.toBlob((blob) => {
        const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
        stopCamera();
        handleImage(file);
    }, 'image/jpeg');
});

// Character Counts
inputText.addEventListener('input', () => charCountIn.textContent = inputText.value.length);
outputText.addEventListener('input', () => charCountOut.textContent = outputText.value.length);

// Extract Text (OCR + Translate simultaneously if via image as backend supports it)
extractTextBtn.addEventListener('click', async () => {
    if(!currentImageFile) return;
    showLoading("Extracting Text (OCR)...");
    
    const formData = new FormData();
    formData.append('image', currentImageFile);
    formData.append('language', targetLanguage.value);
    
    try {
        const res = await fetch(`${API_BASE}/translate-image`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        hideLoading();
        
        if (data.error) throw new Error(data.error);
        
        inputText.value = data.extracted_text;
        outputText.value = data.translated_text;
        charCountIn.textContent = inputText.value.length;
        charCountOut.textContent = outputText.value.length;
        showToast("Text extracted and translated!");
        fetchAnalytics(); // refresh stats
    } catch(err) {
        hideLoading();
        showToast(err.message, "error");
    }
});

// Auto Detect
detectLangBtn.addEventListener('click', async () => {
    if(!inputText.value.trim()) return showToast("Enter text to detect language", "error");
    try {
        const res = await fetch(`${API_BASE}/detect-language`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ text: inputText.value })
        });
        const data = await res.json();
        if(data.error) throw new Error(data.error);
        
        detectedLangBadge.textContent = `${data.detected_language} (${(data.confidence_score*100).toFixed(1)}%) - ${data.detected_script}`;
        detectedLangBadge.classList.remove('hidden');
    } catch(err) {
        showToast(err.message, "error");
    }
});

// Translate Text Only
translateBtn.addEventListener('click', async () => {
    if(!inputText.value.trim()) return showToast("Enter text to translate", "error");
    showLoading("Translating...");
    try {
        const res = await fetch(`${API_BASE}/translate-text`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                text: inputText.value,
                language: targetLanguage.value
            })
        });
        const data = await res.json();
        hideLoading();
        if(data.error) throw new Error(data.error);
        
        outputText.value = data.result;
        charCountOut.textContent = outputText.value.length;
        showToast("Translation complete");
        fetchAnalytics();
    } catch(err) {
        hideLoading();
        showToast(err.message, "error");
    }
});

// Utilities
document.getElementById('copyBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(outputText.value);
    showToast("Copied to clipboard!");
});

const downloadPdfBtn = document.getElementById('downloadPdfBtn');
if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener('click', () => {
        if (!outputText.value.trim()) return showToast("No text to download", "error");
        
        if (window.jspdf && window.jspdf.jsPDF) {
            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                
                doc.setFont("helvetica", "bold");
                doc.setFontSize(16);
                doc.text("Scriptify Translation", 15, 20);
                
                doc.setFont("helvetica", "normal");
                doc.setFontSize(12);
                
                // Split text to automatically fit within page width (180mm)
                const lines = doc.splitTextToSize(outputText.value, 180);
                doc.text(lines, 15, 30);
                
                doc.save("Scriptify_Translation.pdf");
                showToast("PDF Downloaded successfully!", "success");
            } catch (err) {
                console.error("PDF generation error:", err);
                showToast("Failed to generate PDF.", "error");
            }
        } else {
            showToast("PDF library not loaded yet.", "error");
        }
    });
}

async function convertScript(mode) {
    if(!inputText.value.trim()) return showToast("Enter text to convert", "error");
    showLoading(`Converting to ${mode}...`);
    try {
        const res = await fetch(`${API_BASE}/convert-script`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({text: inputText.value, mode: mode})
        });
        const data = await res.json();
        hideLoading();
        if(data.error) throw new Error(data.error);
        
        outputText.value = data.converted;
        showToast(`${mode} conversion complete`);
    } catch(err) {
        hideLoading();
        showToast(err.message, "error");
    }
}

// Speech to Text (Input)
const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
if(SpeechRecognitionAPI && micBtn) {
    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    micBtn.addEventListener('click', () => {
        const icon = micBtn.querySelector('i');
        if(icon.classList.contains('fa-microphone-slash')) {
            recognition.stop();
            return;
        }
        recognition.start();
        icon.className = 'fa-solid fa-microphone-slash';
        inputText.placeholder = "Listening...";
        showToast("Listening...", "success");
    });
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        inputText.value += (inputText.value ? ' ' : '') + transcript;
        charCountIn.textContent = inputText.value.length;
    };
    
    recognition.onend = () => {
        if(micBtn) micBtn.querySelector('i').className = 'fa-solid fa-microphone';
        inputText.placeholder = "Enter text to translate or wait for OCR output...";
    };
    
    recognition.onerror = (event) => {
        showToast("Speech recognition error: " + event.error, "error");
        if(micBtn) micBtn.querySelector('i').className = 'fa-solid fa-microphone';
    };
} else if(micBtn) {
    micBtn.addEventListener('click', () => showToast("Speech Recognition not supported in this browser.", "error"));
}

// Text to Speech (Output)
if(listenBtn) {
    listenBtn.addEventListener('click', () => {
        if(!outputText.value.trim()) return showToast("No text to read", "error");
        if('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(outputText.value);
            
            // Map our language codes to roughly speech synthesis compatible ones
            const langMap = {'en': 'en-US', 'es': 'es-ES', 'fr': 'fr-FR', 'de': 'de-DE', 'hi': 'hi-IN', 'zh-CN': 'zh-CN', 'ja': 'ja-JP', 'ru': 'ru-RU', 'ar': 'ar-SA'};
            utterance.lang = langMap[targetLanguage.value] || targetLanguage.value;
            
            window.speechSynthesis.speak(utterance);
        } else {
            showToast("Text-to-Speech not supported in this browser.", "error");
        }
    });
}

if (refreshStatsBtn) {
    refreshStatsBtn.addEventListener('click', async () => {
        const icon = refreshStatsBtn.querySelector('i');
        icon.classList.add('fa-spin');
        try {
            const el = document.getElementById('totalTranslationsStat');
            if (el) {
                el.textContent = '0';
                showToast("Stats reset to zero!", "success");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setTimeout(() => icon.classList.remove('fa-spin'), 400);
        }
    });
}


function updateCounter(id, targetValue) {
    const el = document.getElementById(id);
    if (!el) return;
    let current = parseInt(el.textContent.replace(/,/g, '')) || 0;
    const inc = Math.max(1, Math.ceil(targetValue / 30));
    
    const timer = setInterval(() => {
        current += inc;
        if(current >= targetValue) {
            current = targetValue;
            clearInterval(timer);
        }
        el.textContent = current.toLocaleString();
    }, 30);
}

async function fetchAnalytics() {
    try {
        const res = await fetch(`${API_BASE}/analytics`);
        const data = await res.json();
        if(data && typeof data.total_translations !== 'undefined') {
            updateCounter('totalTranslationsStat', data.total_translations);
        }
    } catch(err) {
        console.log("Analytics fetch failed (backend not running yet)");
    }
}

// --- AUTHENTICATION LOGIC ---

function checkAuthState() {
    const activeUser = localStorage.getItem('activeScriptifyUser');
    if (activeUser) {
        // User is logged in
        isLoggedIn = true;
        authOverlay.classList.add('hidden');
        mainAppContent.classList.remove('hidden');
        updateTotalUsersUI();
    } else {
        // Show login
        authOverlay.classList.remove('hidden');
        mainAppContent.classList.add('hidden');
    }
}

function toggleAuthMode(e) {
    if(e) e.preventDefault();
    isSignUpMode = !isSignUpMode;
    
    // Clear inputs
    authForm.reset();
    
    if (isSignUpMode) {
        authTitle.textContent = "Create Account";
        authSubtitle.textContent = "Join Scriptify to start translating";
        nameGroup.classList.remove('hidden');
        authName.required = true;
        authSubmitBtn.textContent = "Sign Up";
        authSwitchText.textContent = "Already have an account?";
        authSwitchLink.textContent = "Log In";
    } else {
        authTitle.textContent = "Welcome to Scriptify";
        authSubtitle.textContent = "Please log in to access the translator";
        nameGroup.classList.add('hidden');
        authName.required = false;
        authSubmitBtn.textContent = "Login";
        authSwitchText.textContent = "Don't have an account?";
        authSwitchLink.textContent = "Sign Up";
    }
}

function handleAuth(e) {
    e.preventDefault();
    const email = authEmail.value.trim();
    const password = authPassword.value;
    
    let users = JSON.parse(localStorage.getItem('scriptifyUsers') || "{}");
    
    if (isSignUpMode) {
        const name = authName.value.trim();
        if (users[email]) {
            return showToast("Account with this email already exists!", "error");
        }
        // Save new user
        users[email] = { name, password };
        localStorage.setItem('scriptifyUsers', JSON.stringify(users));
        
        showToast("Account created successfully! Logging in...", "success");
        loginUser(email);
    } else {
        // Login logic
        if (!users[email]) {
            return showToast("No account found with this email. Please sign up.", "error");
        }
        if (users[email].password !== password) {
            return showToast("Incorrect password. Please try again.", "error");
        }
        
        showToast(`Welcome back, ${users[email].name}!`, "success");
        loginUser(email);
    }
}

function loginUser(email) {
    localStorage.setItem('activeScriptifyUser', email);
    authForm.reset();
    checkAuthState();
    fetchAnalytics();
}

function logoutUser() {
    localStorage.removeItem('activeScriptifyUser');
    isLoggedIn = false;
    isSignUpMode = false;
    authForm.reset();
    checkAuthState();
    showToast("Logged out successfully.", "success");
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateTotalUsersUI() {
    const users = JSON.parse(localStorage.getItem('scriptifyUsers') || "{}");
    const count = Object.keys(users).length;
    if (totalUsersStat) {
        totalUsersStat.textContent = count;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    checkAuthState();
    fetchAnalytics();
});

// Theme Toggle
const themeToggleBtn = document.getElementById('themeToggleBtn');
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const icon = themeToggleBtn.querySelector('i');
        if (document.body.classList.contains('light-mode')) {
            icon.className = 'fa-solid fa-moon';
        } else {
            icon.className = 'fa-solid fa-sun';
        }
    });
}

// Clear Input Text
const clearInputBtn = document.getElementById('clearInputBtn');
if (clearInputBtn) {
    clearInputBtn.addEventListener('click', () => {
        const inputTextTemp = document.getElementById('inputText');
        const charCountInTemp = document.getElementById('charCountIn');
        if (inputTextTemp) {
            inputTextTemp.value = '';
            if (charCountInTemp) charCountInTemp.textContent = '0';
        }
        clearInputBtn.querySelector('i').classList.add('fa-spin');
        setTimeout(() => clearInputBtn.querySelector('i').classList.remove('fa-spin'), 300);
    });
}
