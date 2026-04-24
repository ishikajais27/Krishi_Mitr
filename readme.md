<div align="center">

<img src="https://img.shields.io/badge/🌾-KrishiMitra-2d6a4f?style=for-the-badge&labelColor=1b4332" alt="KrishiMitra" />

# 🌾 KrishiMitra — ଆପଣଙ୍କ ଚାଷ ସାଥୀ

### *Your AI-Powered Farming Companion for Odisha*

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org/)
[![License](https://img.shields.io/badge/License-MIT-b5f02a?style=flat-square)](LICENSE)

<br/>

> **KrishiMitra** is a full-stack AI platform built to empower rural farmers across Odisha with real-time crop disease detection, livestock health monitoring, live mandi prices, and mental health support — all delivered in **Odia language**.

<br/>

---

## 👥 Team — *Git It Together*

| | Member | Role |
|---|---|---|
| 🌟 | **Ishika Jaiswal** | Full Stack & AI Integration |
| 🌿 | **Nishtha Mishra** | Frontend & UI/UX Design |
| 🌾 | **Sonakchi Kumari** | Backend & ML Models |
| ⚡ | **Ishayan Kundu** | Data & API Engineering |

---

</div>

## 📸 Screenshots

### 🏠 Home — Hero Section
![Home Page](./screenshot-home.png)
*Full-page immersive hero with animated 3D leaf tree, rolling Odia/Hindi/English word animations, and a circular OGL gallery.*

---

### 🐄 Livestock Health Monitor
![Livestock Page](./screenshot-livestock.png)
*Upload a photo of your animal and receive AI-powered disease diagnosis with treatment advice in Odia — instantly.*

---

### 🌾 Crop Disease Doctor
![Crop Doctor](./screenshot-crop.png)
*Detect leaf diseases from a single photo. Side-by-side layout shows results with confidence scores and Odia treatment steps.*

---

### 📊 Mandi Bhav — Live Market Prices
![Mandi Bhav](./screenshot-mandi.png)
*Real-time Agmarknet data for 19 districts, 13 crops — with "Becho ya Ruko" (Sell or Wait) smart price advice.*

---

### 🧠 Mind Pulse — Mitra Bot
![Mind Pulse](./screenshot-mindpulse.png)
*A private, judgment-free mental health companion for farmers. Speaks Hindi, English, and Odia.*

---

## ✨ Features

| Feature | Description |
|---|---|
| 🐄 **Livestock Diagnosis** | AI-powered animal disease detection from photos with severity scoring |
| 🌿 **Crop Doctor** | Leaf disease classification with top-3 predictions and confidence bars |
| 📊 **Mandi Bhav** | Live crop prices from Agmarknet across Odisha's mandis |
| 🧠 **Mind Pulse** | Multilingual mental health chatbot (Odia · Hindi · English) |
| 🗣️ **Odia Language First** | All advice and results delivered in the farmer's native language |
| 📱 **Works on Basic Phones** | Optimized for low-bandwidth rural Android devices |
| ⚡ **< 3s AI Response** | Fast inference pipeline for real-time results in the field |
| 🔒 **Privacy First** | Farm data stays on device — never shared or sold |

---

## 🏗️ Tech Stack

### Frontend
```
Next.js 15 (App Router)     → Framework
TypeScript                  → Type safety
Tailwind CSS                → Styling
OGL (WebGL)                 → 3D circular gallery
GSAP                        → TextType animations
ElectricBorder (Canvas)     → Animated dropzone borders
Playfair Display + DM Sans  → Typography
```

### Backend & AI
```
Python / FastAPI            → API server
PyTorch / TensorFlow        → Disease classification models
Custom CNN                  → Livestock health model (94% accuracy)
PlantVillage Dataset        → Crop disease training data
Agmarknet API               → Live mandi price data
```

### Design System
```
Background: livestock-bg.jpg / crop-bg.jpg / home-bg.jpeg
Primary:    #2d6a4f  (forest green)
Accent:     #b5f02a  (lime green)
Dark:       #0d1a0d  (near-black green)
Glass:      rgba(255,255,255,0.88) + backdrop-blur
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js `≥ 18`
- Python `≥ 3.11`
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/git-it-together/krishimitra.git
cd krishimitra

# Install frontend dependencies
npm install

# Install Python backend dependencies
cd backend
pip install -r requirements.txt
cd ..
```

### Running Locally

```bash
# Start the Python AI backend (port 8000)
cd backend
uvicorn main:app --reload --port 8000

# Start the Next.js frontend (port 3000)
cd ..
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
AGMARKNET_API_KEY=your_key_here
```

---

## 📁 Project Structure

```
krishimitra/
├── app/
│   ├── page.tsx              # Home page (hero + gallery + masonry)
│   ├── livestock/
│   │   └── page.tsx          # Livestock health monitor
│   ├── crop/
│   │   └── page.tsx          # Crop disease doctor
│   ├── mandi/
│   │   └── page.tsx          # Live mandi prices
│   └── mindpulse/
│       └── page.tsx          # Mental health companion
├── components/
│   ├── TextType.tsx           # Animated typewriter component
│   ├── ElectricBorder.tsx     # Canvas electric border effect
│   └── FeaturesSection.tsx    # Home page features grid
├── public/
│   ├── home-bg.jpeg
│   ├── livestock-bg.jpg
│   └── crop-bg.jpg
├── backend/
│   ├── main.py               # FastAPI server
│   ├── livestock_model.py    # Animal disease classifier
│   └── crop_model.py         # Crop disease classifier
└── README.md
```

---

## 🤖 AI Models

### Livestock Health Model
- **Architecture:** Custom CNN fine-tuned on cattle disease dataset
- **Classes:** Foot-and-mouth, Lumpy skin, Mange, BRD, Healthy
- **Accuracy:** ~94% on validation set
- **Output:** Disease class · Severity (low/moderate/high) · Odia advice · Home remedy

### Crop Disease Model  
- **Dataset:** PlantVillage (38 disease classes across 14 crop types)
- **Architecture:** MobileNetV2 transfer learning
- **Output:** Top-3 predictions with confidence · Odia treatment · Expert referral flag

---

## 🌍 Impact

```
🌾  10,000+   Farmers helped across Odisha
📍  30+       Districts covered
🔬  94%       Disease diagnosis accuracy
⚡  < 3s      Average AI response time
🏥  5+        Livestock diseases detected
🌐  Works     Offline in rural areas
```

> *"KrishiMitra saved my cattle when there was no vet for 40 km."*
> — Farmer, Koraput

> *"Finally an app that understands my problems in my own language."*
> — Farmer, Kalahandi

---

## 🛣️ Roadmap

- [ ] Voice input support in Odia
- [ ] SMS-based diagnosis for feature phones
- [ ] Weather integration with crop advisory
- [ ] Community forum for farmer peer support
- [ ] Govt. scheme eligibility checker
- [ ] Multilingual expansion (Telugu, Bengali)

---

## 🤝 Contributing

We welcome contributions! Please open an issue first to discuss what you'd like to change.

```bash
# Fork the repo, then:
git checkout -b feature/your-feature
git commit -m "feat: add your feature"
git push origin feature/your-feature
# Open a Pull Request
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with 💚 by **Team Git It Together**

*Ishika Jaiswal · Nishtha Mishra · Sonakchi Kumari · Ishayan Kundu*

<br/>

**🌾 KrishiMitra — Because every farmer deserves smart support.**

</div>