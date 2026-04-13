/**
 * TimeFlow AI - Logic Engine
 * Features: Direct Search, Continuous Voice, Female TTS, Gmail Account Chooser
 */

// --- GLOBAL STATE ---
let recognition;
let isRecording = false;

// --- STARTUP ---
window.onload = () => { 
    showPage('dashboard'); 
    fetchWeather();
};

// Initialize Lucide icons on start
if (window.lucide) {
    lucide.createIcons();
}

// --- 1. ASK AI SEARCH (Direct to Web) ---
function handleAISearch() {
    const input = document.getElementById('aiSearch');
    const query = input.value.trim();
    
    if (!query) return;

    const vp = document.getElementById('viewport');
    // Using Bing for reliable in-app frame loading
    const searchUrl = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
    
    vp.innerHTML = `
        <div class="h-full flex flex-col">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <i data-lucide="globe" class="w-5 h-5 text-indigo-600"></i> Web Search: "${query}"
                </h2>
                <button onclick="showPage('dashboard')" class="text-xs font-bold text-slate-400 hover:text-indigo-600 px-3 py-1 bg-white border rounded-lg shadow-sm">✕ BACK TO NOTES</button>
            </div>
            <div class="flex-1 bg-white rounded-3xl border shadow-inner overflow-hidden">
                <iframe src="${searchUrl}" class="w-full h-full border-none"></iframe>
            </div>
        </div>`;
    
    lucide.createIcons();
    input.value = "";
}

// --- 2. CONTINUOUS VOICE & FEMALE SPEECH ---
function startDictation(targetId) {
    const micIcon = document.getElementById('mic-' + targetId);
    const target = document.getElementById(targetId);

    if (isRecording) { 
        if (recognition) recognition.stop(); 
        return; 
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Voice recognition not supported.");

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => { 
        isRecording = true; 
        if (micIcon) micIcon.classList.add('voice-active'); 
    };
    
    recognition.onend = () => { 
        isRecording = false; 
        if (micIcon) micIcon.classList.remove('voice-active'); 
        if (targetId === 'quickNotes') saveNotes(); 
    };

    recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        }
        if (finalTranscript) {
            target.value += (target.value ? ' ' : '') + finalTranscript;
        }
    };
    recognition.start();
}

function speakText(targetId) {
    const text = document.getElementById(targetId).value;
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    // Prioritize Female-sounding voices
    const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Google US English') || v.name.includes('Zira') || v.name.includes('Samantha'));
    if (femaleVoice) utterance.voice = femaleVoice;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
}

// --- 3. GMAIL & BACKUP LOGIC ---
function toggleEmailMenu() {
    const menu = document.getElementById('emailDropdown');
    if (menu) menu.classList.toggle('hidden');
}

function sendToGmail(type) {
    const notes = document.getElementById('quickNotes').value;
    const subject = encodeURIComponent("TimeFlow AI - Backup");
    const body = encodeURIComponent(notes);
    document.getElementById('emailDropdown').classList.add('hidden');

    if (type === 'self') {
        let myEmail = localStorage.getItem('user_email') || prompt("Enter your backup Gmail address:");
        if (myEmail) {
            localStorage.setItem('user_email', myEmail);
            window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${myEmail}&su=${subject}&body=${body}`);
        }
    } else if (type === 'choose') {
        window.open(`https://accounts.google.com/AccountChooser?continue=https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`);
    } else {
        window.open(`mailto:?subject=${subject}&body=${body}`);
    }
}

// --- 4. NAVIGATION & RENDERERS ---
function showPage(page) {
    const vp = document.getElementById('viewport');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('tab-active'));
    const activeBtn = document.getElementById('btn-' + page);
    if(activeBtn) activeBtn.classList.add('tab-active');

    if (page === 'dashboard') {
        vp.innerHTML = `
            <div class="max-w-4xl mx-auto">
                <div class="bg-white p-8 rounded-3xl border shadow-sm">
                    <div class="flex justify-between items-center mb-6">
                        <h3 class="font-bold text-xl text-slate-800">Quick Capture</h3>
                        <div class="flex gap-2 relative">
                            <button onclick="startDictation('quickNotes')" class="p-2 hover:bg-slate-100 rounded-full text-slate-500"><i data-lucide="mic" id="mic-quickNotes"></i></button>
                            <button onclick="speakText('quickNotes')" class="p-2 hover:bg-slate-100 rounded-full text-slate-500"><i data-lucide="volume-2"></i></button>
                            <div class="relative inline-block text-left">
                                <button onclick="toggleEmailMenu()" class="p-2 hover:bg-slate-100 rounded-full text-slate-500"><i data-lucide="mail"></i></button>
                                <div id="emailDropdown" class="hidden absolute right-0 mt-2 w-56 origin-top-right bg-white border border-slate-200 rounded-2xl shadow-xl z-50">
                                    <div class="py-2 px-2 space-y-1">
                                        <button onclick="sendToGmail('draft')" class="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-indigo-50 rounded-xl flex items-center gap-2"><i data-lucide="file-text" class="w-3 h-3"></i> Save as Draft</button>
                                        <button onclick="sendToGmail('self')" class="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-indigo-50 rounded-xl flex items-center gap-2"><i data-lucide="user" class="w-3 h-3"></i> Send to My Gmail</button>
                                        <button onclick="sendToGmail('choose')" class="w-full text-left px-4 py-2 text-[10px] text-slate-400 hover:bg-slate-50 rounded-xl">Switch Account...</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <textarea id="quickNotes" oninput="saveNotes()" class="w-full h-96 p-6 bg-slate-50 border-none rounded-2xl text-base outline-none leading-relaxed" placeholder="Start your notes..."></textarea>
                </div>
            </div>`;
        loadNotes();
    } 
    else if (page === 'tasks') {
        vp.innerHTML = `
            <div class="max-w-2xl mx-auto">
                <div class="bg-white p-8 rounded-3xl border shadow-sm">
                    <h2 class="text-2xl font-bold mb-6 text-slate-800">Tasks</h2>
                    <div class="flex gap-3 mb-8">
                        <input type="text" id="taskInput" onkeypress="if(event.key==='Enter')addTask()" class="flex-1 p-4 bg-slate-50 rounded-2xl outline-none text-sm" placeholder="Add task...">
                        <button onclick="addTask()" class="bg-indigo-600 text-white px-6 py-2 rounded-2xl font-bold hover:bg-indigo-700">+ ADD</button>
                    </div>
                    <div id="taskList" class="space-y-3"></div>
                </div>
            </div>`;
        renderTasks();
    }
    else if (page === 'calendar') {
        const days = Array.from({length: 30}, (_, i) => `<div class="h-24 border border-slate-100 p-2 rounded-xl hover:bg-indigo-50 cursor-pointer"><span class="text-xs font-bold text-slate-400">${i+1}</span></div>`).join('');
        vp.innerHTML = `<div class="bg-white p-8 rounded-3xl border shadow-sm"><h2 class="text-2xl font-bold mb-6">April 2026</h2><div class="grid grid-cols-7 gap-2">${days}</div></div>`;
    }
    else if (page === 'calc') {
        vp.innerHTML = `
            <div class="max-w-xs mx-auto bg-white p-6 rounded-3xl border shadow-xl">
                <input type="text" id="calcDisplay" class="w-full text-right text-2xl p-4 bg-slate-100 rounded-xl mb-4" readonly placeholder="0">
                <div class="grid grid-cols-4 gap-2">
                    ${['7','8','9','/','4','5','6','*','1','2','3','-','0','C','=','+'].map(btn => `<button onclick="calcInput('${btn}')" class="p-4 bg-slate-50 hover:bg-indigo-500 rounded-xl font-bold text-slate-700">${btn}</button>`).join('')}
                </div>
            </div>`;
    }
    lucide.createIcons();
}

// --- 5. DATA PERSISTENCE ---
function saveNotes() { 
    localStorage.setItem('tf_notes', document.getElementById('quickNotes').value); 
    showSaved(); 
}

function loadNotes() { 
    const s = localStorage.getItem('tf_notes'); 
    if(s && document.getElementById('quickNotes')) document.getElementById('quickNotes').value = s; 
}

function addTask() {
    const input = document.getElementById('taskInput');
    if(!input.value.trim()) return;
    let tasks = JSON.parse(localStorage.getItem('tf_tasks') || '[]');
    tasks.unshift({ text: input.value, id: Date.now() });
    localStorage.setItem('tf_tasks', JSON.stringify(tasks));
    input.value = '';
    renderTasks();
    showSaved();
}

function renderTasks() {
    const list = document.getElementById('taskList');
    if(!list) return;
    const tasks = JSON.parse(localStorage.getItem('tf_tasks') || '[]');
    list.innerHTML = tasks.map(t => `
        <div class="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
            <input type="checkbox" onclick="deleteTask(${t.id})"> 
            <span class="text-sm text-slate-700">${t.text}</span>
        </div>`).join('');
}

function deleteTask(id) {
    let tasks = JSON.parse(localStorage.getItem('tf_tasks') || '[]');
    tasks = tasks.filter(t => t.id !== id);
    localStorage.setItem('tf_tasks', JSON.stringify(tasks));
    renderTasks();
}

// --- 6. UTILS ---
function calcInput(val) {
    const d = document.getElementById('calcDisplay');
    if(val === '=') {
        try {
            d.value = eval(d.value) || '0';
        } catch {
            d.value = "Error";
        }
    }
    else if(val === 'C') d.value = '';
    else d.value += val;
}

function manualWeatherUpdate() {
    const city = prompt("Enter city:");
    if (city) {
        fetch(`https://wttr.in/${city}?format=%l:+%t+%C`)
            .then(res => res.text())
            .then(t => document.getElementById('current-temp').innerText = t);
    }
}

async function fetchWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const res = await fetch(`https://wttr.in/${pos.coords.latitude},${pos.coords.longitude}?format=%l:+%t+%C`);
                const text = await res.text();
                document.getElementById('current-temp').innerText = text;
            } catch (e) {
                document.getElementById('current-temp').innerText = "PAVIA: 24°C SUNNY";
            }
        }, () => { 
            document.getElementById('current-temp').innerText = "PAVIA: 24°C SUNNY"; 
        });
    }
}

function showSaved() {
    const el = document.getElementById('save-indicator');
    if(el) { 
        el.style.opacity = '1'; 
        setTimeout(() => el.style.opacity = '0', 1000); 
    }
}
