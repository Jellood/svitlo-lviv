// ===========================
// Map Initialization
// ===========================
const map = L.map("map").setView([49.8419, 24.0315], 12);

// --- Tile Layers ---
const lightLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {maxZoom: 19});

const darkLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    subdomains: "abcd",
    maxZoom: 19
});

let currentLayer = lightLayer.addTo(map);
let theme = "light";

// --- Theme Toggle Button ---
document.getElementById("toggleTheme").addEventListener("click", () => {
    map.removeLayer(currentLayer);
    if (theme === "light") {
        currentLayer = darkLayer.addTo(map);
        theme = "dark";
        document.getElementById("toggleTheme").textContent = "Тема: темна";
    } else {
        currentLayer = lightLayer.addTo(map);
        theme = "light";
        document.getElementById("toggleTheme").textContent = "Тема: світла";
    }
});

// ===========================
// Marker Cluster & Mode
// ===========================
let mode = "group";
const markerCluster = L.markerClusterGroup({
    showCoverageOnHover: false, maxClusterRadius: 50, spiderfyOnMaxZoom: true, disableClusteringAtZoom: 18
});
map.addLayer(markerCluster);

// Group color mapping
const groupColors = {
    "unknown": "gray",
    "0": "gray",
    "1.1": "red",
    "1.2": "darkred",
    "2.1": "green",
    "2.2": "lightgreen",
    "3.1": "yellow",
    "3.2": "lightyellow",
    "4.1": "blue",
    "4.2": "lightblue",
    "5.1": "pink",
    "5.2": "brown",
    "6.1": "purple",
    "6.2": "violet"
};

// ===========================
// Data Storage
// ===========================
let schedule = {};
let allData = [];
let markers = [];
let followRealTime = true;

// ===========================
// Load Schedule
// ===========================
async function loadSchedule() {
    try {
        const res = await fetch(`./schedule.json?t=${Date.now()}`);
        schedule = await res.json();
    } catch {
        schedule = {};
    }
}

// ===========================
// Schedule Helpers
// ===========================
function getCurrentPeriodAtTime(group, minutes) {
    if (!Array.isArray(schedule[group])) return null;
    return schedule[group].find(p => {
        const [fh, fm] = p.from.split(":").map(Number);
        const [th, tm] = p.to.split(":").map(Number);
        const f = fh * 60 + fm;
        const t = th * 60 + tm;
        return minutes >= f && minutes <= t;
    }) || null;
}

function getNextPeriod(group) {
    if (!Array.isArray(schedule[group])) return null;
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const upcoming = schedule[group]
        .map(p => ({start: p.from.split(":").map(Number)[0] * 60 + p.from.split(":").map(Number)[1], data: p}))
        .filter(p => p.start > cur)
        .sort((a, b) => a.start - b.start);
    return upcoming.length ? upcoming[0].data : null;
}

// ===========================
// Marker Color Logic
// ===========================
function getColorAtTime(obj, minutes) {
    if (mode === "group") return groupColors[obj.group] || "gray";
    if (!Array.isArray(schedule[obj.group])) return "green";
    const current = getCurrentPeriodAtTime(obj.group, minutes);
    return current ? "red" : "green";
}

// ===========================
// Info Panel Update
// ===========================
function updateInfoPanel(selectedMinutes = null) {
    const minutes = selectedMinutes ?? (new Date().getHours() * 60 + new Date().getMinutes());
    let total = allData.length;
    let withLight = 0;
    let withoutLight = 0;
    const groupOffCounts = {};

    allData.forEach(obj => {
        const current = getCurrentPeriodAtTime(obj.group, minutes);
        if (current) {
            withoutLight++;
            groupOffCounts[obj.group] = (groupOffCounts[obj.group] || 0) + 1;
        } else if (schedule[obj.group]) {
            withLight++;
        }
    });

    const percentOff = total ? ((withoutLight / total) * 100).toFixed(1) : 0;
    const groupMaxOff = Object.keys(groupOffCounts).length ? Object.entries(groupOffCounts).sort((a, b) => b[1] - a[1])[0][0] : "-";

    document.getElementById("totalHouses").textContent = total;
    document.getElementById("housesWithLight").textContent = withLight;
    document.getElementById("housesWithoutLight").textContent = withoutLight;
    document.getElementById("percentOff").textContent = percentOff + "%";
    document.getElementById("groupMaxOff").textContent = groupMaxOff;
}

// ===========================
// Load & Plot Markers
// ===========================
async function loadAndPlot() {
    try {
        const res = await fetch(`./data/addresses_with_coords.json?t=${Date.now()}`);
        allData = await res.json();
    } catch {
        allData = [];
    }

    markerCluster.clearLayers();
    markers = [];

    const minutes = parseInt(document.getElementById("timeSlider").value);
    const batchSize = 200;
    let index = 0;

    function drawBatch() {
        const slice = allData.slice(index, index + batchSize);
        const newMarkers = slice.map(obj => {
            if (obj.lat == null || obj.lng == null) return null;

            const marker = L.circleMarker([obj.lat, obj.lng], {
                radius: 6, fillColor: getColorAtTime(obj, minutes), fillOpacity: 0.9, color: "#000", weight: 1
            });

            const currentPeriod = getCurrentPeriodAtTime(obj.group, minutes);
            const nextPeriod = getNextPeriod(obj.group);
            const status = currentPeriod ? "🔴 Відключено зараз" : (schedule[obj.group] ? "🟢 Світло є" : "⚪ Немає даних");

            const popupHtml = `
                <b>${obj.street} ${obj.building}</b><br>
                <b>Група:</b> ${obj.group}<br>
                <b>Статус:</b> ${status}<br>
                ${currentPeriod ? `<b>Поточний період:</b> ${currentPeriod.from} – ${currentPeriod.to}<br>` : ""}
                ${nextPeriod ? `<b>Наступне відключення:</b> ${nextPeriod.from}<br>` : "<b>Наступних відключень:</b> немає<br>"}
                <b>Оновлено графік:</b> ${new Date().toLocaleTimeString()}<br>
                <b>Координати:</b> ${obj.lat.toFixed(5)}, ${obj.lng.toFixed(5)}<br>
                <b>Мапа оновлена:</b> ${new Date().toLocaleTimeString()}
            `;

            marker.bindPopup(popupHtml);
            markers.push({marker, obj});
            return marker;
        }).filter(Boolean);

        markerCluster.addLayers(newMarkers);
        index += batchSize;
        if (index < allData.length) requestAnimationFrame(drawBatch); else updateInfoPanel(minutes);
    }

    drawBatch();
}

// ===========================
// Initialization
// ===========================
async function init() {
    await loadSchedule();
    await loadAndPlot();
    setInterval(async () => {
        await loadSchedule();
        if (followRealTime) setSliderToCurrentTime(); else loadAndPlot();
    }, 5000);
}

init();

// ===========================
// Mode Toggle
// ===========================
document.getElementById("toggleMode").addEventListener("click", () => {
    mode = mode === "group" ? "schedule" : "group";
    document.getElementById("toggleMode").textContent = "Mode: " + mode;
    loadAndPlot();
});

// ===========================
// Search by Street/Building
// ===========================
document.getElementById("searchInput").addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    markerCluster.clearLayers();
    markers.forEach(({marker, obj}) => {
        const s = `${obj.street} ${obj.building}`.toLowerCase();
        if (!q || s.includes(q)) markerCluster.addLayer(marker);
    });
});

// ===========================
// Timeline Slider
// ===========================
const timeSlider = document.getElementById("timeSlider");
const sliderTime = document.getElementById("sliderTime");

function updateSliderTimeDisplay() {
    const h = Math.floor(timeSlider.value / 60);
    const m = timeSlider.value % 60;
    sliderTime.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

timeSlider.addEventListener("input", () => {
    followRealTime = false;
    updateSliderTimeDisplay();
    const minutes = parseInt(timeSlider.value);
    markers.forEach(({marker, obj}) => marker.setStyle({fillColor: getColorAtTime(obj, minutes)}));
    updateInfoPanel(minutes);
});

updateSliderTimeDisplay();

// ===========================
// "Now" Button
// ===========================
document.getElementById("nowButton").addEventListener("click", () => {
    followRealTime = true;
    setSliderToCurrentTime();
});

function setSliderToCurrentTime() {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    timeSlider.value = minutes;
    updateSliderTimeDisplay();
    markers.forEach(({marker, obj}) => marker.setStyle({fillColor: getColorAtTime(obj, minutes)}));
    updateInfoPanel(minutes);
}
