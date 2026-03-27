import { GoogleGenAI } from 'https://esm.run/@google/genai';

        // --- Configuration ---
        const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY; // Will try to use process.env if available
        const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbxW4kA7WA96XmxgYZpXYDhQ47JKn5JiNwwiSybDftpStKchGrMyH77Y39NMDUoTWNsxfQ/exec";
        const SYSTEM_INSTRUCTION = `You are "Aqua Assistant," the dedicated virtual representative for Aqua Quence by Indiversa Water. Your goal is to provide exceptional customer service, manage orders, and provide product information to residents in Maheshtala, Kolkata.
Persona: Professional, helpful, and locally aware. You sound like a friendly neighbor who is efficient and reliable.

1. Linguistic Protocol (CRITICAL)
- Language Mirroring: You must detect and respond in the language the customer uses first (English, Bengali, or Hindi).
- Local Context: You are deeply familiar with Maheshtala and its surrounding localities. You know the landmarks and neighborhoods well.

2. Local Geography & Service Areas (KNOW THESE WELL)
- Primary Hub: Akra Station Road (Our main base)
- Key Neighborhoods: Santoshpur, Batanagar, Nangi, Budge Budge, Sarenga, Mollargate, Dakghar, Parbangla, Rampur, Gopalpur.
- Nearby Landmarks: Akra Railway Station, Batanagar Riverside, Nangi Station, Budge Budge Trunk Road, Santoshpur Government Colony, Sarenga High School.
- Surrounding Areas: Jinjirabazar, Taratala, Garden Reach, Metiabruz.
- Fluency: If a customer says "I am calling from Santoshpur" or "Deliver to Batanagar," acknowledge it naturally (e.g., "Sure, we deliver to Santoshpur regularly!" or "Batanagar is well within our service route!").

3. Product Knowledge & Pricing
- 20L Water Refill: ₹20 per jar
- Empty 20L Jar (White): ₹180 (One-time deposit/purchase)
- Empty 20L Jar (Colored): ₹200 (One-time deposit/purchase)
- Accessories: Water Dispensers and Manual Water Pumps available
- Service Area: Kolkata, Maheshtala, specifically near Akra Station Road and all mentioned neighborhoods.

4. Key Business Rules
- Owner Reference: If asked for the owner or manager, refer to Mr. Anisul Alam.
- Promotions: ALWAYS mention that we have "huge seasonal offers and exciting discounts running regularly" in your initial response or greeting.
- Lead Handoff: For complex queries or deep technical support, advise the customer: "You can chat directly with our AI Chat Assistant for real-time updates and detailed support."

5. Conversational Guidelines
- Greeting: "Welcome to Aqua Quence! This is your automated assistant. How can I help with your water supply today? By the way, we have huge seasonal offers and exciting discounts running regularly!"
- Ordering: If a customer wants to order, confirm the quantity, jar type (if new), and their exact location (e.g., "Which part of Batanagar?" or "Near which landmark in Santoshpur?").
- Closing: Always end by thanking them for choosing Aqua Quence for their hydration needs.
- Conciseness: Keep responses under 2-3 sentences as this is a voice interface.`;

        // --- Database Setup ---
        const db = new Dexie('AquaQuenceDB');
        db.version(1).stores({
            messages: '++id, sessionId, mode, timestamp',
            media: '++id, sessionId, type, timestamp'
        });

        // --- State Management ---
        let activeTab = 'voice';
        let isConnected = false;
        let isConnecting = false;
        let isModelSpeaking = false;
        let volume = 0;
        let sessionId = '';
        let transcriptionHistory = [];
        let useThinking = true;
        let useSearch = true;

        // Gemini Live Refs
        let session = null;
        let audioContext = null;
        let processor = null;
        let source = null;
        let stream = null;
        let playbackQueue = [];
        let isPlaying = false;

        // --- UI Elements ---
        const elements = {
            tabVoice: document.getElementById('tab-voice'),
            tabChat: document.getElementById('tab-chat'),
            sectionVoice: document.getElementById('section-voice'),
            sectionChat: document.getElementById('section-chat'),
            btnCall: document.getElementById('btn-call'),
            callIdle: document.getElementById('call-icon-idle'),
            callActive: document.getElementById('call-icon-active'),
            callLoading: document.getElementById('call-icon-loading'),
            rings: document.getElementById('rings'),
            ring1: document.getElementById('ring-1'),
            ring2: document.getElementById('ring-2'),
            liveBadge: document.getElementById('live-badge'),
            micStatus: document.getElementById('mic-status'),
            micIcon: document.getElementById('mic-icon'),
            statusText: document.getElementById('status-text'),
            voiceHistory: document.getElementById('voice-history'),
            mainHeading: document.getElementById('main-heading'),
            mainSubtext: document.getElementById('main-subtext'),
            errorBox: document.getElementById('error-box'),
            errorText: document.getElementById('error-text'),
            chatMessages: document.getElementById('chat-messages'),
            chatInput: document.getElementById('chat-input'),
            btnSend: document.getElementById('btn-send'),
            chatLoading: document.getElementById('chat-loading'),
            overlayHistory: document.getElementById('overlay-history'),
            overlayInfo: document.getElementById('overlay-info'),
            historyList: document.getElementById('history-list')
        };

        // --- Initialization ---
        lucide.createIcons();
        initChat();

        // --- Event Listeners ---
        elements.tabVoice.addEventListener('click', () => switchTab('voice'));
        elements.tabChat.addEventListener('click', () => switchTab('chat'));
        elements.btnCall.addEventListener('click', toggleCall);
        document.getElementById('btn-history').addEventListener('click', showHistory);
        document.getElementById('btn-info').addEventListener('click', () => elements.overlayInfo.classList.remove('hidden'));
        document.getElementById('close-history').addEventListener('click', () => elements.overlayHistory.classList.add('hidden'));
        document.getElementById('close-info').addEventListener('click', () => elements.overlayInfo.classList.add('hidden'));
        document.getElementById('btn-clear').addEventListener('click', clearAllHistory);
        document.getElementById('btn-clear-chat').addEventListener('click', clearChatHistory);
        document.getElementById('toggle-thinking').addEventListener('click', (e) => {
            useThinking = !useThinking;
            e.currentTarget.classList.toggle('bg-blue-500/20', useThinking);
            e.currentTarget.classList.toggle('text-blue-400', useThinking);
            e.currentTarget.classList.toggle('bg-white/5', !useThinking);
            e.currentTarget.classList.toggle('text-white/40', !useThinking);
        });
        document.getElementById('toggle-search').addEventListener('click', (e) => {
            useSearch = !useSearch;
            e.currentTarget.classList.toggle('bg-blue-500/20', useSearch);
            e.currentTarget.classList.toggle('text-blue-400', useSearch);
            e.currentTarget.classList.toggle('bg-white/5', !useSearch);
            e.currentTarget.classList.toggle('text-white/40', !useSearch);
        });
        elements.btnSend.addEventListener('click', handleChatSend);
        elements.chatInput.addEventListener('keydown', (e) => e.key === 'Enter' && handleChatSend());

        // --- Functions ---

        function switchTab(tab) {
            activeTab = tab;
            elements.tabVoice.classList.toggle('bg-blue-600', tab === 'voice');
            elements.tabVoice.classList.toggle('text-white', tab === 'voice');
            elements.tabVoice.classList.toggle('text-white/40', tab !== 'voice');
            
            elements.tabChat.classList.toggle('bg-blue-600', tab === 'chat');
            elements.tabChat.classList.toggle('text-white', tab === 'chat');
            elements.tabChat.classList.toggle('text-white/40', tab !== 'chat');

            elements.sectionVoice.classList.toggle('hidden', tab !== 'voice');
            elements.sectionChat.classList.toggle('hidden', tab !== 'chat');
        }

        async function toggleCall() {
            if (isConnected) {
                disconnect();
            } else {
                connect();
            }
        }

        async function connect() {
            if (isConnected || isConnecting) return;
            isConnecting = true;
            updateCallUI();
            
            try {
                const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || GEMINI_API_KEY;
                if (!apiKey || apiKey === "YOUR_API_KEY") {
                    throw new Error("Please set your Gemini API Key in the code.");
                }

                const ai = new GoogleGenAI({ apiKey });
                sessionId = `voice_${Date.now()}`;
                transcriptionHistory = [];
                elements.voiceHistory.innerHTML = '';

                audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
                
                const sessionPromise = ai.live.connect({
                    model: "models/gemini-1.5-flash",
                    config: {
                        systemInstruction: SYSTEM_INSTRUCTION,
                        responseModalities: ["AUDIO"],
                        speechConfig: {
                            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
                        },
                        inputAudioTranscription: {},
                        outputAudioTranscription: {},
                    },
                    callbacks: {
                        onopen: () => {
                            isConnected = true;
                            isConnecting = false;
                            updateCallUI();
                            sessionPromise.then(s => {
                                session = s;
                                startRecording();
                            });
                        },
                        onmessage: (msg) => {
                            if (msg.serverContent?.modelTurn?.parts) {
                                for (const part of msg.serverContent.modelTurn.parts) {
                                    if (part.inlineData?.data) {
                                        playbackQueue.push(base64ToPCM(part.inlineData.data));
                                        playNextInQueue();
                                    }
                                }
                            }
                            if (msg.serverContent?.outputTranscription?.text) {
                                addTranscription('aqua', msg.serverContent.outputTranscription.text);
                            }
                            if (msg.serverContent?.inputTranscription?.text) {
                                addTranscription('user', msg.serverContent.inputTranscription.text);
                            }
                            if (msg.serverContent?.interrupted) {
                                playbackQueue = [];
                                isPlaying = false;
                                isModelSpeaking = false;
                                updateMicUI();
                            }
                        },
                        onclose: () => disconnect(),
                        onerror: (err) => {
                            console.error(err);
                            showError("Connection error. Check your API key.");
                            disconnect();
                        }
                    }
                });
            } catch (err) {
                showError(err.message);
                isConnecting = false;
                updateCallUI();
            }
        }

        function disconnect() {
            if (session) session.close();
            session = null;
            isConnected = false;
            isConnecting = false;
            isModelSpeaking = false;
            stopAudio();
            updateCallUI();
            if (transcriptionHistory.length > 0) {
                syncToGoogleSheets(transcriptionHistory, 'VOICE');
            }
        }

        async function startRecording() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                source = audioContext.createMediaStreamSource(stream);
                processor = audioContext.createScriptProcessor(4096, 1, 1);

                processor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    let sum = 0;
                    for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                    volume = Math.sqrt(sum / inputData.length);
                    
                    updateRings();

                    if (session && isConnected) {
                        const pcm = floatTo16BitPCM(inputData);
                        session.sendRealtimeInput({
                            audio: { data: base64EncodeAudio(pcm), mimeType: "audio/pcm;rate=16000" }
                        });
                    }
                };

                source.connect(processor);
                processor.connect(audioContext.destination);
            } catch (err) {
                showError("Error: " + error.message);
                disconnect();
            }
        }

        function stopAudio() {
            if (processor) processor.disconnect();
            if (source) source.disconnect();
            if (stream) stream.getTracks().forEach(t => t.stop());
            if (audioContext) audioContext.close();
            audioContext = null;
        }

        async function playNextInQueue() {
            if (playbackQueue.length === 0 || isPlaying || !audioContext) return;
            if (audioContext.state === 'suspended') await audioContext.resume();

            isPlaying = true;
            isModelSpeaking = true;
            updateMicUI();

            const pcmData = playbackQueue.shift();
            const float32Data = new Float32Array(pcmData.length);
            for (let i = 0; i < pcmData.length; i++) float32Data[i] = pcmData[i] / 32768;

            const buffer = audioContext.createBuffer(1, float32Data.length, 24000);
            buffer.getChannelData(0).set(float32Data);

            const sourceNode = audioContext.createBufferSource();
            sourceNode.buffer = buffer;
            sourceNode.connect(audioContext.destination);
            sourceNode.onended = () => {
                isPlaying = false;
                if (playbackQueue.length === 0) {
                    isModelSpeaking = false;
                    updateMicUI();
                }
                playNextInQueue();
            };
            sourceNode.start();
        }

        function updateCallUI() {
            elements.callIdle.classList.toggle('hidden', isConnected || isConnecting);
            elements.callActive.classList.toggle('hidden', !isConnected);
            elements.callLoading.classList.toggle('hidden', !isConnecting);
            elements.btnCall.classList.toggle('bg-red-500/10', isConnected);
            elements.btnCall.classList.toggle('border-red-500/50', isConnected);
            elements.btnCall.classList.toggle('text-red-500', isConnected);
            elements.btnCall.classList.toggle('bg-blue-600', !isConnected);
            
            elements.rings.classList.toggle('hidden', !isConnected);
            elements.liveBadge.classList.toggle('hidden', !isConnected);
            elements.micStatus.classList.toggle('hidden', !isConnected);
            
            elements.mainHeading.innerText = isConnected ? "Connected to Aqua" : isConnecting ? "Connecting..." : "Need fresh water?";
            elements.mainSubtext.innerText = isConnected ? "Speak naturally to order your 20L water jars." : "Call our AI assistant to place your order for Maheshtala delivery.";
        }

        function updateMicUI() {
            elements.statusText.innerText = isModelSpeaking ? "Aqua is speaking..." : volume > 0.01 ? "Aqua is listening..." : "Aqua is ready";
            elements.statusText.classList.toggle('text-cyan-400', isModelSpeaking);
        }

        function updateRings() {
            const scale1 = 1 + volume * 2;
            const scale2 = 1 + volume * 4;
            elements.ring1.style.transform = `scale(${scale1})`;
            elements.ring2.style.transform = `scale(${scale2})`;
            elements.micIcon.style.transform = `scale(${1 + volume * 2})`;
            updateMicUI();
        }

        function addTranscription(role, text) {
            transcriptionHistory.push({ role, text });
            db.messages.add({ sessionId, role, text, timestamp: new Date().toLocaleString(), mode: 'voice' });
            
            const div = document.createElement('div');
            div.className = `p-3 rounded-2xl text-xs leading-relaxed max-w-[80%] ${role === 'user' ? 'bg-blue-600/20 text-blue-200 ml-auto border border-blue-600/20' : 'bg-white/5 text-white/80 mr-auto border border-white/10'}`;
            div.innerText = text;
            
            if (elements.voiceHistory.innerText.includes('No conversation history')) elements.voiceHistory.innerHTML = '';
            elements.voiceHistory.prepend(div);
        }

        function showError(msg) {
            elements.errorText.innerText = msg;
            elements.errorBox.classList.remove('hidden');
            setTimeout(() => elements.errorBox.classList.add('hidden'), 5000);
        }

        // --- Chat Logic ---
        async function initChat() {
            const count = await db.messages.where('mode').equals('chat').count();
            if (count === 0) {
                await db.messages.add({ sessionId: 'initial', role: 'model', text: "Namaste! I am Aqua's text assistant. How can I help you today?", timestamp: new Date().toLocaleString(), mode: 'chat' });
            }
            renderChat();
        }

        async function renderChat() {
            const messages = await db.messages.where('mode').equals('chat').toArray();
            elements.chatMessages.innerHTML = messages.map(msg => `
                <div class="flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-white/10'}">
                        <i data-lucide="${msg.role === 'user' ? 'user' : 'bot'}" class="w-4 h-4"></i>
                    </div>
                    <div class="space-y-2">
                        <div class="p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/90'}">
                            <div class="prose prose-invert prose-sm max-w-none">${marked.parse(msg.text)}</div>
                        </div>
                    </div>
                </div>
            `).join('');
            lucide.createIcons();
            elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
        }

        async function handleChatSend() {
            const input = elements.chatInput.value.trim();
            if (!input || isConnecting) return;
            
            elements.chatInput.value = '';
            const chatSessionId = `chat_${Date.now()}`;
            await db.messages.add({ sessionId: chatSessionId, role: 'user', text: input, timestamp: new Date().toLocaleString(), mode: 'chat' });
            renderChat();
            
            elements.chatLoading.classList.remove('hidden');
            
            try {
                const apiKey = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || GEMINI_API_KEY;
                const ai = new GoogleGenAI({ apiKey });
                const model = ai.getGenerativeModel({ model: "gemini-1.5-pro" });
                
                const history = await db.messages.where('mode').equals('chat').toArray();
                const chat = model.startChat({
                    history: history.slice(-10).map(m => ({ role: m.role, parts: [{ text: m.text }] })),
                    generationConfig: { maxOutputTokens: 1000 }
                });

                const result = await chat.sendMessage(input);
                const response = await result.response;
                const text = response.text();
                
                await db.messages.add({ sessionId: chatSessionId, role: 'model', text, timestamp: new Date().toLocaleString(), mode: 'chat' });
                renderChat();
                
                const allMessages = await db.messages.where('sessionId').equals(chatSessionId).toArray();
                syncToGoogleSheets(allMessages, 'CHAT');
            } catch (err) {
                console.error(err);
                showError("Chat error. Check your API key.");
            } finally {
                elements.chatLoading.classList.add('hidden');
            }
        }

        // --- History & Utilities ---
        async function showHistory() {
            const allMessages = await db.messages.where('mode').equals('voice').toArray();
            const sessions = {};
            allMessages.forEach(m => {
                if (!sessions[m.sessionId]) sessions[m.sessionId] = { id: m.sessionId, timestamp: m.timestamp, count: 0, first: m.text, last: m.text };
                sessions[m.sessionId].count++;
                sessions[m.sessionId].last = m.text;
            });

            const list = Object.values(sessions).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            elements.historyList.innerHTML = list.length ? list.map(s => `
                <div class="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 group hover:bg-white/10 transition-colors">
                    <div class="flex justify-between items-start">
                        <div class="space-y-1">
                            <p class="text-sm font-medium text-white/90">${s.timestamp}</p>
                            <p class="text-[10px] text-white/40 uppercase tracking-widest font-bold">${s.count} Messages</p>
                        </div>
                        <div class="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <i data-lucide="phone" class="w-4 h-4"></i>
                        </div>
                    </div>
                    <div class="space-y-2 pt-2 border-t border-white/5">
                        <p class="text-[11px] text-white/60 line-clamp-1 italic">"${s.first}"</p>
                    </div>
                </div>
            `).join('') : '<div class="text-center py-12 text-white/20 italic text-sm">No past calls recorded.</div>';
            
            lucide.createIcons();
            elements.overlayHistory.classList.remove('hidden');
        }

        async function syncToGoogleSheets(messages, mode) {
            if (!GOOGLE_SHEETS_URL || messages.length === 0) return;
            const transcript = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join("\n\n");
            const payload = {
                sessionId: messages[0].sessionId,
                timestamp: new Date().toLocaleString(),
                mode: mode,
                messagesCount: messages.length,
                transcript: transcript,
                firstMessage: messages[0].text,
                lastMessage: messages[messages.length - 1].text
            };
            fetch(GOOGLE_SHEETS_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(payload) });
        }

        async function clearAllHistory() {
            if (confirm("Clear all local history?")) {
                await db.messages.clear();
                await db.media.clear();
                window.location.reload();
            }
        }

        async function clearChatHistory() {
            if (confirm("Clear chat history?")) {
                await db.messages.where('mode').equals('chat').delete();
                initChat();
            }
        }

        // --- Audio Helpers ---
        function floatTo16BitPCM(float32Array) {
            const buffer = new Int16Array(float32Array.length);
            for (let i = 0; i < float32Array.length; i++) {
                const s = Math.max(-1, Math.min(1, float32Array[i]));
                buffer[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            }
            return buffer;
        }

        function base64EncodeAudio(pcmData) {
            const uint8Array = new Uint8Array(pcmData.buffer);
            let binary = "";
            for (let i = 0; i < uint8Array.byteLength; i++) binary += String.fromCharCode(uint8Array[i]);
            return btoa(binary);
        }

        function base64ToPCM(base64) {
            const binary = atob(base64);
            const buffer = new ArrayBuffer(binary.length);
            const uint8Array = new Uint8Array(buffer);
            for (let i = 0; i < binary.length; i++) uint8Array[i] = binary.charCodeAt(i);
            return new Int16Array(buffer);
        }
    
