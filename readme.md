# Paeon AI: The Intelligent Commercial Representative

> **Track:** 2 (Digital Medical Representative)
> **Team:** Paeon AI

### **Overview**

The **Paeon AI** is a high-performance, voice-controlled sales cockpit designed for the pharmaceutical "Last Mile."

Unlike traditional chatbots that simply retrieve information, the DMR acts as an **Agentic Sales Partner**. It equips field representatives with real-time, regulator-verified clinical arguments (CDSCO/FDA) and automated administrative tools (Insurance/Pricing) to close prescriptions instantly and compliantly.

---

### **The Problem**

Pharma spends billions on strategy, but execution fails in the **3 minutes** a rep has with a doctor.

* **Information Overload:** Reps can't memorize 100+ pages of clinical labels.
* **Compliance Fear:** Reps hesitate to discuss off-label queries or pricing.
* **Access Barriers:** Doctors avoid prescribing because they don't know if a patient's insurance covers the drug.

### **The Solution**

A **"Two-Zone" Intelligence Surface** that splits the cognitive load:

1. **Zone A (Active Stage):** Voice-activated **Flashcards** for immediate clinical detailing and comparison.
2. **Zone B (Live Ticker):** Real-time regulatory alerts (CDSCO circulars, price changes) and supply chain updates.

---

### **Key Features**

#### **1. The Flashcard Engine (Clinical Mastery)**

* **Zero-Latency Detailing:** Instantly renders side-by-side comparison tables (Efficacy, Safety, Dosing) grounded in the approved Product Insert.
* **Strict Verification:** Every data point is cited (e.g., *"Source: Section 4.2, CDSCO Approved Label"*).
* **Visual Logic:** Uses "Data Density" rather than persuasive text to show superiority.

#### **2. The Admin Closer (Business Mastery)**

* **Insurance Navigator:** Instantly checks coverage for **Ayushman Bharat**, **CGHS**, and private TPAs (Star/HDFC).
* **Automated Paperwork:** One-click generation of Prior Authorization Forms or Patient Assistance Program (PAP) applications.

#### **3. The "Indian Context" (Linguistic Fluidity)**

* **Hinglish NLP:** Built to understand mixed-language queries (e.g., *"Iska renal dosage kya hai?"*).
* **Regional Patient Support:** Generates patient education cards in local languages (Hindi, Marathi, Tamil) for the doctor to share via WhatsApp.

---

### **Tech Stack**

* **Frontend:** `Next.js 15` (App Router) + `React`
* **Styling:** `Tailwind CSS` + `Shadcn/UI`
* **Animation:** `Framer Motion` (for the "Snap" card transitions)
* **State Management:** `Zustand`
* **Voice/AI (Mocked for Demo):** `Deepgram` (STT) concept + `LangChain` RAG Logic

---

### **Project Structure**

```bash
├── app/
│   ├── page.tsx             # Main Cockpit Controller (Zone Layout)
│   └── layout.tsx           # Global Font/Theme wrappers
├── components/
│   ├── hud/                 # Heads-Up Display Components
│   │   ├── Header.tsx       # Context Bar (Mic, Language)
│   │   └── LiveTicker.tsx   # Regulatory Feed (Right Rail)
│   └── canvas/              # The Active Stage
│       ├── Stage.tsx        # Animation Wrapper
│       └── cards/           # The Flashcard Library
│           ├── Identity.tsx # Product Details
│           ├── Compare.tsx  # Competitor Matrix
│           └── Access.tsx   # Insurance/Pricing
└── public/                  # Assets (Drug Packshots, Logos)

```

### **Getting Started**

1. **Clone the repository:**
```bash
git clone https://github.com/justcreate-shaurya/Paeon-Med.git

```


2. **Install dependencies:**
```bash
npm install
# or
yarn install

```


3. **Run the development server:**
```bash
npm run dev

```


4. **Open:** `http://localhost:3000`

---

### **Future Roadmap**

* **Integration:** Direct API link to **Indegene’s Omnipresence** CRM.
* **Hardware:** Optimized tablet version for iPad Pro (Field Force standard).
* **Analytics:** "Voice-of-Customer" sentiment analysis fed back to HQ Strategy teams.
