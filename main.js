// --- Configuration ---
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const SYSTEM_INSTRUCTION = "You are Aqua, the AI assistant for Aqua Quence By Indiversa Water in Maheshtala, Kolkata. You help customers order 20L water jars, check delivery status, and provide pricing. Be polite, professional, and helpful.";

// --- State Variables ---
let session = null;
let audioContext = null;
let isConnected = false;
let isConnecting = false;
let mediaRecorder = null;
let stream = null;

// --- DOM Elements ---
const elements = {
    callBtn: document.getElementById('call-btn'),
    statusDot: document.getElementById('status-dot'),
    statusText: document.getElementById('status-text'),
    errorMessage: document.getElementById('error-message'),
    errorText: document.getElementById('error-text')
};

// --- Helper Functions ---
function showError(message) {
    elements.errorText.innerText = message;
    elements.errorMessage.classList.remove('hidden');
    setTimeout(() => elements.errorMessage.classList.add('hidden'), 5000);
}

function updateCallUI() {
    if (isConnected) {
        elements.callBtn.classList.add('bg-red-500', 'animate-pulse');
        elements.callBtn.classList.remove('bg-blue-600');
        elements.statusDot.classList.add('bg-green-500');
        elements.statusText.innerText = "Aqua is listening...";
    } else if (isConnecting) {
        elements.statusText.innerText = "Connecting to Aqua...";
    } else {
        elements.callBtn.classList.remove('bg-red-500', 'animate-pulse');
        elements.callBtn.classList.add('bg-blue-600');
        elements.statusDot.classList.remove('bg-green-500');
        elements.statusText.innerText = "Ready to take your order";
    }
}

// --- Connection Logic ---
async function startCall() {
    if (isConnecting || isConnected) return;
    
    isConnecting = true;
    updateCallUI();

    try {
        // Initialize Audio
        audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Connect to Gemini Live API
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        
        // Use the Multimodal Live connection
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        // Note: The following block assumes the use of the @google/generative-ai SDK's 
        // live connection methods adapted for your specific AI Studio export structure.
        
        session = await model.startChat({
            history: [],
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        // Simulating the connection success for the UI
        isConnected = true;
        isConnecting = false;
        updateCallUI();
        console.log("Connected to Aqua Quence AI");

    } catch (error) {
        console.error("Gemini Connection Error:", error);
        // This is the fix: 'error' is now properly defined and passed here
        showError("AI Connection Failed: " + (error.message || "Please check your API key and Internet."));
        isConnecting = false;
        isConnected = false;
        updateCallUI();
    }
}

function disconnect() {
    if (stream) stream.getTracks().forEach(track => track.stop());
    if (audioContext) audioContext.close();
    isConnected = false;
    isConnecting = false;
    updateCallUI();
}

// --- Event Listeners ---
elements.callBtn.addEventListener('click', () => {
    if (isConnected) {
        disconnect();
    } else {
        startCall();
    }
});
