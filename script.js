/**
 * TimeFlow AI - Logic Engine (v2.0)
 * Features: Interactive Calendar, Direct Search, Voice TTS, Gmail Backup
 */

// --- GLOBAL STATE ---
let recognition;
let isRecording = false;
let currentCalDate = new Date(); // Stores the month being viewed

// --- STARTUP ---
window.onload = () => { 
    showPage('dashboard'); 
    fetchWeather();
};

if (window.lucide) {
    lucide.createIcons();
}

// --- 1. ASK AI SEARCH ---
function handleAISearch() {
    const input = document.getElementById('aiSearch');
    const query = input.value.trim();
    if (!query) return;

    const vp = document.getElementById('viewport');
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

// --- 2. CONTINUOUS VOICE & SPEECH ---
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
    const femaleVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Zira') || v.name.includes('Samantha'));
    if (femaleVoice) utterance.voice = femaleVoice;
    window.speechSynthesis.speak(utterance);
}

// --- 3. EMAIL LOGIC ---
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

// --- 4. INTERACTIVE CALENDAR LOGIC ---
function changeMonth(dir) {
    currentCalDate.setMonth(currentCalDate.getMonth() + dir);
    showPage('calendar');
}

// --- 5. NAVIGATION & RENDERERS ---
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
                        <div class="flex gap-2">
                            <button onclick="startDictation('quickNotes')" class="p-2 hover:bg-slate-100 rounded-full text-slate-500"><i data-lucide="mic" id="mic-quickNotes"></i></button>
                            <button onclick="speakText('quickNotes')" class="p-2 hover:bg-slate-100 rounded-full text-slate-500"><i data-lucide="volume-2"></i></button>
                            <div class="relative">
                                <button onclick="toggleEmailMenu()" class="p-2 hover:bg-slate-100 rounded-full text-slate-500"><i data-lucide="mail"></i></button>
                                <div id="emailDropdown" class="hidden absolute right-0 mt-2 w-56 bg-white border rounded-2xl shadow-xl z-50 py-2 px-2">
                                    <button onclick="sendToGmail('draft')" class="w-full text-left px-4 py-2 text-xs hover:bg-indigo-50 rounded-xl flex items-center gap-2"><i data-lucide="file-text" class="w-3 h-3"></i> Save as Draft</button>
                                    <button onclick="sendToGmail('self')" class="w-full text-left px-4 py-2 text-xs hover:bg-indigo-50 rounded-xl flex items-center gap-2"><i data-lucide="user" class="w-3 h-3"></i> Send to My Gmail</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <textarea id="quickNotes" oninput="saveNotes()" class="w-full h-96 p-6 bg-slate-50 border-none rounded-2xl text-base outline-none" placeholder="Start your notes..."></textarea>
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
                        <input type="text" id="taskInput" onkeypress="if(event.key==='Enter')addTask()" class="flex-1 p-4 bg-slate-50 rounded-2xl outline-none" placeholder="Add task...">
                        <button onclick="addTask()" class="bg-indigo-600 text-white px-6 py-2 rounded-2xl font-bold hover:bg-indigo-700">+ ADD</button>
                    </div>
                    <div id="taskList" class="space-y-3"></div>
                </div>
            </div>`;
        renderTasks();
    }
    else if (page === 'calendar') {
        const monthName = currentCalDate.toLocaleString('default', { month: 'long' });
        const year = currentCalDate.getFullYear();
        const daysInMonth = new Date(year, currentCalDate.getMonth() + 1, 0).getDate();
        
        const days = Array.from({length: daysInMonth}, (_, i) => `
            <div class="h-24 border border-slate-100 p-2 rounded-xl hover:bg-indigo-50 cursor-pointer group">
                <span class="text-xs font-bold text-slate-400 group-hover:text-indigo-600">${i+1}</span>
            </div>`).join('');
            
        vp.innerHTML = `
            <div class="bg-white p-8 rounded-3xl border shadow-sm">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-slate-800">${monthName} ${year}</h2>
                    <div class="flex gap-2">
                        <button onclick="changeMonth(-1)" class="p-2 hover:bg-slate-100 rounded-lg border text-slate-600"><i data-lucide="chevron-left"></i></button>
                        <button onclick="changeMonth(1)" class="p-2 hover:bg-slate-100 rounded-lg border text-slate-600"><i data-lucide="chevron-right"></i></button>
                    </div>
                </div>
                <div class="grid grid-cols-7 gap-2">${days}</div>
            </div>`;
    }
    else if (page === 'calc') {
        vp.innerHTML = `
            <div class="max-w-xs mx-auto bg-white p-6 rounded-3xl border shadow-xl">
                <input type="text" id="calcDisplay" class="w-full text-right text-2xl p-4 bg-slate-100 rounded-xl mb-4" readonly placeholder="0">
                <div class="grid grid-cols-4 gap-2">
                    ${['7','8','9','/','4','5','6','*','1','2','3','-','0','C','=','+'].map(btn => `<button onclick="calcInput('${btn}')" class="p-4 bg-slate-50 hover:bg-indigo-500 hover:text-white rounded-xl font-bold text-slate-700 transition-colors">${btn}</button>`).join('')}
                </div>
            </div>`;
    }
    lucide.createIcons();
}

// --- 6. DATA PERSISTENCE ---
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

function calcInput(val) {
    const d = document.getElementById('calcDisplay');
    if(val === '=') { try { d.value = eval(d.value) || '0'; } catch { d.value = "Error"; } }
    else if(val === 'C') d.value = '';
    else d.value += val;
}

async function fetchWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                const res = await fetch(`https://wttr.in/${pos.coords.latitude},${pos.coords.longitude}?format=%l:+%t+%C`);
                const text = await res.text();
                document.getElementById('current-temp').innerText = text.toUpperCase();
            } catch (e) {
                document.getElementById('current-temp').innerText = "PAVIA: 24°C SUNNY";
            }
        });
    }
}

function showSaved() {
    const el = document.getElementById('save-indicator');
    if(el) { el.style.opacity = '1'; setTimeout(() => el.style.opacity = '0', 1000); }
}
