// --- 1. SETUP THE MAP ---
const map = L.map('map-area').setView([36.2048, 138.2529], 5);

L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri',
    maxZoom: 16
}).addTo(map);

let currentMarker;

// --- 2. TOGGLE SIDEBAR LOGIC ---
const toggleBtn = document.getElementById('toggle-btn');
const uiArea = document.getElementById('ui-area');

toggleBtn.addEventListener('click', () => {
    uiArea.classList.toggle('collapsed');
    
    if (uiArea.classList.contains('collapsed')) {
        toggleBtn.innerHTML = '◀';
    } else {
        toggleBtn.innerHTML = '▶';
    }

    setTimeout(() => {
        map.invalidateSize();
    }, 300);
});


// --- 3. CUSTOM "RED X" MARKER ---
const neonXIcon = L.divIcon({
    className: 'custom-x-icon',
    html: `
        <svg width="24" height="24" viewBox="0 0 24 24" style="filter: drop-shadow(0 0 8px red);">
            <line x1="4" y1="4" x2="20" y2="20" stroke="white" stroke-width="6" stroke-linecap="round" />
            <line x1="20" y1="4" x2="4" y2="20" stroke="white" stroke-width="6" stroke-linecap="round" />
            <line x1="4" y1="4" x2="20" y2="20" stroke="#ff2a2a" stroke-width="4" stroke-linecap="round" />
            <line x1="20" y1="4" x2="4" y2="20" stroke="#ff2a2a" stroke-width="4" stroke-linecap="round" />
        </svg>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

// --- 4. SHINDO COLORS ---
function getShindoStyle(shindo) {
    let color = "#333";
    switch (shindo) {
        case '1': color = "#4fc3f7"; break;
        case '2': color = "#0277bd"; break;
        case '3': color = "#4caf50"; break;
        case '4': color = "#ffeb3b"; break;
        case '5-': color = "#ff9800"; break;
        case '5+': color = "#f57c00"; break;
        case '6-': color = "#f44336"; break;
        case '6+': color = "#d32f2f"; break;
        case '7': color = "#9c27b0"; break;
    }
    return `background-color: ${color}; box-shadow: inset 0 0 15px rgba(255,255,255,0.3), 0 0 10px ${color};`;
}

// --- 5. FETCH DATA FROM WOLFX & UPDATE TASKBAR ---
const WOLFX_API_URL = "https://api.wolfx.jp/jma_eqlist.json";
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');

async function getEarthquakeHistory() {
    try {
        // Set loading status
        statusDot.className = "";
        statusText.innerText = "Fetching JMA Data...";

        const response = await fetch(WOLFX_API_URL);
        const data = await response.json();
        
        delete data.md5;
        const eqList = Object.values(data);
        
        const latestEq = eqList[0];
        updateMap(latestEq.latitude, latestEq.longitude);
        updateSidebar(eqList);

        // Update taskbar to show success
        statusDot.className = "connected";
        statusText.innerText = `API Connected | Last Sync: ${new Date().toLocaleTimeString()}`;

    } catch (error) {
        console.error("Error fetching data:", error);
        
        // Update taskbar to show error
        statusDot.className = "error";
        statusText.innerText = "Connection Error";
    }
}

function updateMap(latStr, lonStr) {
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);

    if (currentMarker) {
        map.removeLayer(currentMarker);
    }

    if (!isNaN(lat) && !isNaN(lon)) {
        map.setView([lat, lon], 7);
        currentMarker = L.marker([lat, lon], { icon: neonXIcon }).addTo(map);
    }
}

// --- 6. UPDATE SIDEBAR ---
function updateSidebar(eqList) {
    const listContainer = document.getElementById('history-list');
    listContainer.innerHTML = "";

    eqList.forEach((eq, index) => {
        const card = document.createElement('div');
        
        if (index === 0) {
            card.className = 'eq-card latest';
        } else {
            card.className = 'eq-card';
        }

        const shindoStyle = getShindoStyle(eq.shindo);

        card.innerHTML = `
            <div class="shindo-box" style="${shindoStyle}">
                ${eq.shindo}
            </div>
            <div class="info-box">
                <div class="info-location">${eq.location}</div>
                <div class="info-details">
                    <div>M <span>${eq.magnitude}</span></div>
                    <div>Depth: <span>${eq.depth}</span></div>
                </div>
                <div class="info-time">
                    ${eq.time}
                </div>
            </div>
        `;

        card.addEventListener('click', () => {
            updateMap(eq.latitude, eq.longitude);
        });

        listContainer.appendChild(card);
    });
}

// --- 7. AUTO-UPDATE LOOP (PHASE 1) ---

// Run it once immediately when the page loads
getEarthquakeHistory();

// Then set an interval to run it every 15 seconds (15000 milliseconds)
setInterval(() => {
    // Make the dot blink yellow to show it's checking in the background
    const dot = document.getElementById('status-dot');
    dot.className = ""; 
    
    // Fetch the data
    getEarthquakeHistory();
}, 15000);

// Run the application
getEarthquakeHistory();