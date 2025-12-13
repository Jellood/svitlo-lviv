# ⚡ Lviv Electricity Map

Interactive map of Lviv houses showing electricity status, outages, and schedules. Combines geocoded addresses with
real-time visualization.

---

## 🗂 Project Structure

```
/testELECTRICY
  ├─ map.html                 # Main HTML file with interactive map
  ├─ style.css                # Map and panel styles
  ├─ main.js                  # Map logic and updates
  ├─ schedule.json            # Electricity outage schedule by group
  ├─ /data
  │   ├─ addresses_with_coords.json  # Houses with coordinates
  │   ├─ all_sorted.json               # Sorted house list
  │   ├─ with_coords_temp.json         # Temporary geocoding results
  │   ├─ unknown_temp.json             # Temporarily unknown addresses
  │   └─ unknown_coordinates.json      # Addresses not found
  ├─ all.json                 # Full list of addresses (street, building, group)
  ├─ geocode_all.js           # Script to geocode all houses
  ├─ server.js                # Local Node.js server
  ├─ package.json / package-lock.json
  └─ .gitignore
```

---

## ⚙️ Installation

1. Clone the repository or copy files to a local directory.
2. Install **Node.js 18+** (required for fetch in scripts).
3. Install dependencies (if needed):

```bash
npm install
```

4. Ensure `all.json` contains the full list of addresses.

---

## 🚀 Usage

### 🏠 Geocoding Houses

```bash
node geocode_all.js
```

- Progress saved in `data/progress.json` → **can stop and resume** anytime.
- Temporary results stored in:
    - `data/with_coords_temp.json`
    - `data/unknown_temp.json`
- Final results:
    - `addresses_with_coords.json` — houses with coordinates
    - `all_sorted.json` — sorted list with coordinates
    - `unknown_coordinates.json` — addresses not found

✅ Console shows **status per house** and percentage of successful geocoding.

---

### 🗺 Map Visualization

#### Method 1 – Using `server.js`

```bash
node server.js
```

Open in browser: `http://localhost:5500`

#### Method 2 – Using `http-server`

```bash
npx http-server . -p 5500
```

Open in browser: `http://localhost:5500`

- **Red/colored markers** show houses with coordinates and their electricity status.
- Click a marker → view **street, building, group, current status**.
- Map updates automatically every **15 seconds**.
- Use the **time slider** to preview past or upcoming outages.
- Toggle **light/dark themes** with the button.
- Search by **street or building number**.

---

## 💡 Tips

- Geocoding script includes a **1.2-second delay** between requests → prevents Nominatim overload.
- Expand abbreviations in `all.json` (e.g., "B." → "Bohdana") for higher accuracy.
- Coordinates are limited to **Lviv only** → ensures precise mapping.
- If the browser shows cached map tiles → press **Shift+F5** or clear cache.
- The map shows real-time and scheduled power status per group with marker colors and info panel stats.

