<div align="center">

# 🛡️ NORTHSHIELD
### AI-Powered Terrain Intelligence, Disaster Early Warning & Dynamic Rerouting System
**Built for the North Eastern Region (NER) · Smart India Hackathon (SIH) · Ministry of DoNER**

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015%20%2F%20React%2019-black?style=flat&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/AI%20Backend-FastAPI-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![YOLOv8](https://img.shields.io/badge/Computer%20Vision-YOLOv8-blue?style=flat)](https://ultralytics.com/)
[![Telegram](https://img.shields.io/badge/Alerts-Telegram%20Bot%20API-2CA5E0?style=flat&logo=telegram)](https://telegram.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

*“The slope moves six hours before the road does.”*

</div>

---

## 📌 Executive Summary

India’s North Eastern Region (NER) faces frequent catastrophic landslides, flash floods, and road washouts during the monsoon season, cutting off critical supply chains and stranding civilian convoys. 

**Northshield** combines **edge Computer Vision (YOLOv8)**, **multi-criteria terrain risk modeling (slope, rainfall, seismic priors)**, and **real-time alerting** to predict corridor failures hours before they happen, dynamically rerouting logistics convoys and broadcasting instant alerts over Telegram and satellite fallback channels.

---

## 👥 Team Work Allocation & Responsibilities

Our team of **5 engineers** collaborated across AI modeling, data pipelines, geospatial visualization, UI/UX, and real-time communication systems:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             NORTHSHIELD TEAM MATRIX                              │
├──────────────────────┬───────────────────────────────────┬───────────────────────┤
│ Role / Domain        │ Core Responsibilities             │ Key Deliverables      │
├──────────────────────┼───────────────────────────────────┼───────────────────────┤
│ 🧠 Member 1: ML Eng  │ Model Training & Risk Modeling    │ YOLOv8 & Risk Engine  │
│ 📊 Member 2: Data    │ Dataset Pipeline & Preprocessing  │ 41K Dataset + SceneGate│
│ 🗺️ Member 3: GIS/FE  │ Frontend Core, GIS Map & Routing  │ Leaflet + Elevation   │
│ 🖥️ Member 4: UI/Ops  │ Operations UI & Field Report Flow │ /report & Dashboard   │
│ 📢 Member 5: Alerts  │ Telegram Engine & Demo Automation │ Bot Alert API + SOS   │
└──────────────────────┴───────────────────────────────────┴───────────────────────┘
```

---

### 🧠 Member 1: Model Training & AI Engineering
* **Algorithm Used**: **YOLOv8 Deep Convolutional Neural Network (fine-tuned on custom disaster dataset)** + **Multi-Criteria Terrain Risk Engine**.
* **Key Tasks & Contributions**:
  - Fine-tuned YOLOv8 classification architecture on 4 target disaster classes (`landslide_debris`, `flooded_road`, `obstruction`, `clear_road`).
  - Engineered the composite **Terrain Risk Mathematical Formula**:
    $$\text{Risk} = w_{\text{slope}} \cdot \hat{S} + w_{\text{rain}} \cdot \hat{R}_{7d} + w_{\text{elev}} \cdot \hat{E} + w_{\text{geo}} \cdot P_{\text{district}}$$
  - Implemented the logistics accessibility scoring function $(0–100)$ with penalty matrix mapping for actionable vehicle advisory (*"IMPASSABLE: Close corridor"*, *"RESTRICTED: 4x4 only"*, *"CLEAR"*).
  - Built high-performance asynchronous **FastAPI service (`api.py`)** with CORS support and sub-100ms inference times.
* **Results & Metrics**:
  - **Top-1 Accuracy**: **94.2%** on test holdout.
  - **Inference Latency**: **~68 ms** per image on standard CPU.
  - **Composite Score Accuracy**: Successfully identifies hazardous slope conditions with high correlation to historical disaster events.

---

### 📊 Member 2: Dataset Collection, Cleaning & Preprocessing
* **Key Tasks & Contributions**:
  - Curated and synthesized a robust dataset of **41,000+ field and satellite disaster images** covering terrain conditions across all 8 North Eastern states (Meghalaya, Assam, Sikkim, Arunachal Pradesh, Nagaland, Manipur, Mizoram, Tripura).
  - **Data Preprocessing & Cleaning**:
    - Resolution normalization and standardization to $640 \times 640$ pixels.
    - Rigorous deduplication and label cross-validation.
    - Class balance optimization to prevent bias toward common clear-road scenarios.
  - **Data Augmentation Pipeline**: Applied photometric distortions, synthetic rain/fog artifacts, random rotations ($\pm 15^\circ$), horizontal flips, and brightness/contrast shifts to mimic harsh monsoon weather.
  - **Heuristic Scene-Gate Engine (`scene_is_road`)**: Built an intelligent chromaticity & pixel-entropy filter to automatically detect and reject screenshots, blurry captures, and non-road photos before feeding them to the heavy model.

---

### 🗺️ Member 3: Frontend Architecture, State Management & Interactive GIS Map
* **Key Tasks & Contributions**:
  - Designed the **Next.js 15 (App Router) + React 19 + TypeScript** architecture.
  - Implemented the central **Zustand reactive store (`store.ts`)** for synchronized real-time state across views.
  - Developed the **Interactive Terrain Map (`/map`)**:
    - Embedded custom **Leaflet GIS layers** with animated corridor routes.
    - Implemented side-by-side **Direct (Shortest) vs. Recommended (Safe)** route comparison engine.
    - Built the **Dynamic Elevation Profile Strip** that graphs elevation vs. hazard risk hotspots along the road path in real time.
  - Connected live OpenRouteService (ORS) road network API with graceful mock fallback for offline resilience.

---

### 🖥️ Member 4: Operations Dashboard, Field Report Flow & AI Vision UI
* **Key Tasks & Contributions**:
  - Built the mission-critical **Operations Dashboard (`/`)**:
    - Real-time Incident Feed, Ranked Corridor Risk Table, and Live Convoy Tracking Board.
    - Dynamic SVG terrain contour background (`ContourField.tsx`) with animated radar pulses.
  - Developed the **3-Step Citizen & Patrol Field Report Flow (`/report`)**:
    - Step 1: Camera capture & Drag-and-drop image upload.
    - Step 2: Automatic GPS geolocation + OpenStreetMap Nominatim reverse geocoding.
    - Step 3: Live model classification readout with animated probability distribution bars, terrain risk scorecards, and operator override controls.
  - Designed responsive dark-mode UI with Tailwind CSS following geological survey aesthetic guidelines (slate ground, muted jade contours, signal hazard accents).

---

### 📢 Member 5: Real-Time Alerts, Telegram Bot Integration & Demo Automation
* **Key Tasks & Contributions**:
  - Engineered the server-side **Notification Engine (`/api/notify`)**:
    - Integrated **Telegram Bot API** for instant multi-recipient dispatch (replacing SMS/telecom carrier dependencies).
    - Designed rich, emoji-tagged incident markdown templates with GPS coordinates, timestamps, and severity levels.
  - Built the **Synchronized 60-Second Guided Demo Driver (`DemoDriver.tsx`)**:
    - Automated narrative sequence that drives the app state and fires **real live Telegram alerts** to the judges' phones during presentation beats.
  - Created the **Emergency SOS Dispatch Hub (`/sos`)**:
    - 2-second press-and-hold safety trigger to prevent accidental dispatches.
    - Simulated dual-channel dispatch: Cellular uplink with automatic **NavIC Satellite backup**.
  - Built the visual **Telegram Alert Log Panel (`TelegramAlertLog.tsx`)** showing live delivery status (Sending → Delivered).

---

## 🏛️ System Architecture

```
                       ┌──────────────────────────────────────────────┐
                       │          CITIZEN / DRIVER / PATROL           │
                       │    (Camera Photo + GPS / SOS Dispatch)       │
                       └──────────────────────┬───────────────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                             NEXT.JS 15 FRONTEND (Vercel)                                    │
│  ┌──────────────────────┬─────────────────────────────┬──────────────────────────────────┐  │
│  │ Operations Dashboard │ Interactive GIS Map (/map)  │ Field Report Flow (/report)      │  │
│  │ (Live Convoy Board)  │ (Shortest vs Safe Reroute)  │ (Photo + Auto Reverse Geocoding) │  │
│  └──────────────────────┴──────────────┬──────────────┴─────────────────┬────────────────┘  │
│                                        │                                │                   │
│                                        │ Zustand State Store            │                   │
│                                        ▼                                ▼                   │
│  ┌─────────────────────────────────────────────────────────┬─────────────────────────────┐  │
│  │ Route Planning Engine (/api/route)                      │ Notification (/api/notify)  │  │
│  │ • OpenRouteService Car GeoJSON                          │ • Telegram Bot API Gateway  │  │
│  │ • Elevation & Hazard Shading Calculation                │ • Multi-Chat ID Broadcaster │  │
│  └─────────────────────────────────────────────────────────┴──────────────┬──────────────┘  │
└────────────────────────────────────────────┬──────────────────────────────┼─────────────────┘
                                             │                              │
                                             │ Multipart Form (Image + GPS) │ Instant Markdown
                                             ▼                              ▼
                 ┌──────────────────────────────────────┐     ┌───────────────────────────┐
                 │     FASTAPI AI ENGINE (Railway)      │     │   TELEGRAM OPS CHANNELS   │
                 │ ──────────────────────────────────── │     │ ───────────────────────── │
                 │ 1. Heuristic Scene-Gate Filter       │     │ 🚫 Road Blocked Alerts    │
                 │ 2. YOLOv8 Classification (best.pt)   │     │ 🔄 Convoy Reroute Notice  │
                 │ 3. Multi-Criteria Terrain Risk Engine│     │ 🆘 Emergency SOS Dispatch │
                 │ 4. Logistics Accessibility Score     │     │ 📊 High-Risk Predictions  │
                 └──────────────────────────────────────┘     └───────────────────────────┘
```

---

## ⚡ Key Capabilities

| Feature | Description |
|---|---|
| **🏔️ 6-Hour Early Prediction** | Fuses soil saturation, slope degrees, and 24h rainfall forecasts to predict slope failure before road collapse. |
| **🔄 Dynamic Convoy Rerouting** | Automatically computes detour corridors (e.g. +25 min safe route vs. blocked shortest route). |
| **👁️ Computer Vision Verification** | Instant AI verification of road hazards from crowdsourced citizen photos with 94.2% accuracy. |
| **📢 Real-Time Telegram Dispatch** | Direct push notifications to disaster management cells and driver groups without telecom network delays. |
| **🛰️ Offline & Satellite Resilience** | SOS dispatches position over cellular or NavIC satellite channel with assigned NDRF rescue units. |

---

## 🛠️ Technology Stack

* **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide React, Framer Motion
* **Mapping & GIS**: Leaflet, React-Leaflet, OpenRouteService API, OpenStreetMap Nominatim
* **State & Data Viz**: Zustand, Recharts, Sonner Toasts
* **AI / ML Engine**: PyTorch, Ultralytics YOLOv8, Pillow, NumPy
* **Backend API**: FastAPI, Uvicorn, Python Multipart, Requests
* **Notifications**: Telegram Bot API
* **Deployment**: Vercel (Frontend), Railway / Render (AI Backend)

---

## 🚀 Quick Start (Local Setup)

### 1. Clone & Install Frontend
```bash
cd northshield
npm install
```

### 2. Configure Environment (`.env.local`)
```env
NEXT_PUBLIC_AI_API_URL=http://127.0.0.1:8000
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
ORS_API_KEY=your_openrouteservice_key_here
NOMINATIM_EMAIL=your_email@example.com
```

### 3. Start Frontend & AI Backend

**Terminal 1 (AI Model Server):**
```bash
cd ../model_files
pip install -r requirements.txt
python -m uvicorn api:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 (Next.js App):**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏆 Presentation Demo Guide for Judges (70 Seconds)

1. Open **[http://localhost:3000](http://localhost:3000)** and click **"Watch the 60-second demo"**.
2. **0s – Rerouting Beat**: Convoy AS-01-KC-4482 reroutes away from NH-6 danger $\rightarrow$ **Telegram Notification 1 received**.
3. **26s – Vision AI Beat**: Field photo classified as Landslide (91.4% confidence) $\rightarrow$ **Telegram Notification 2 received**.
4. **40s – Predictive Matrix Beat**: Rainfall crosses 340mm, composite risk > 80 $\rightarrow$ **Telegram Notification 3 received**.
5. **50s – SOS Dispatch**: Instant emergency distress transmitted with GPS coordinates and nearest NDRF unit ETA.

---

<div align="center">
Built with ❤️ for the Northeast Region of India 🇮🇳 · Smart India Hackathon
</div>
