# NETSTAT – Network Access & Security Management System
### SDN-Based One-Device-Per-Student Access Control for University Hostel Wi-Fi

---

## 1. Project Overview

**NETSTAT** is an SDN-orchestrated network access control and security management platform designed specifically for university hostel Wi-Fi networks. 

Hostel networks suffer from unauthorized bandwidth abuse, rogue hotspots, credential sharing, and network congestion caused by students connecting multiple unmanaged devices simultaneously. Traditional captive portals verify credentials only at the application layer, failing to prevent secondary devices from piggybacking onto established sessions or spoofing IP addresses.

NETSTAT solves this by enforcing a strict **One-Device-Per-Student policy directly at the Data Link Layer (Layer 2) using Software-Defined Networking (OpenFlow 1.3)**:
1. **Student Authentication**: A student authenticates using their institutional ID and password.
2. **First-Connection Binding**: On first successful login from a physical network-observed device, the system automatically registers that device's MAC address and binds it to the student.
3. **OpenFlow Policy Enforcement**: An OpenFlow 1.3 flow rule (Priority 100) is programmed onto the Open vSwitch to forward traffic from the verified MAC.
4. **Unauthorized Secondary Device Detection**: If the student attempts to connect from an unregistered second device, the system detects the MAC mismatch.
5. **Immediate SDN Drop**: The unauthorized device is blocked at the switch port using an OpenFlow 1.3 DROP rule (Priority 200).
6. **Security Alert Generation**: The mismatch event is recorded with high severity, capturing observed MAC, registered MAC, timestamp, and policy violation details.
7. **Admin Visibility**: Network administrators monitor connected students, registered devices, live OpenFlow flow tables, real-time traffic statistics, and security alerts.

---

## 2. System Architecture

```
                      +---------------------------------------+
                      |       NETSTAT WEB APPLICATION         |
                      |  - React + TypeScript + Tailwind CSS  |
                      |  - Cybersecurity Admin Dashboard      |
                      |  - Student Self-Service Portal        |
                      +-------------------+-------------------+
                                          | REST API (HTTP)
                                          v
                      +---------------------------------------+
                      |         NETSTAT BACKEND API           |
                      |  - Python Flask + SQLAlchemy (SQLite) |
                      |  - Identity & Access Control Engine   |
                      |  - OpenFlow 1.3 Adapter & Simulator   |
                      +---------+-------------------+---------+
                                |                   |
               OpenFlow REST    |                   | Embedded
               API (TCP 8080)   |                   | Simulation Fallback
                                v                   v
          +-----------------------------+   +-----------------------------+
          |     Ryu SDN Controller      |   |   High-Fidelity Software    |
          |  - OpenFlow 1.3 Controller  |   |   OpenFlow 1.3 Emulation    |
          |  - Dynamic Packet-In Engine |   |   (Windows Native Demo)     |
          +--------------+--------------+   +--------------+--------------+
                         |                                 |
                         | OpenFlow 1.3                    | Simulated
                         | Control Channel                 | Flow Table
                         v                                 v
          +---------------------------------------------------------------+
          |                   Open vSwitch (s1)                           |
          |  - Priority 200: DROP (Clear actions) for Unauthorized MACs   |
          |  - Priority 100: ALLOW (Output to Gateway) for Registered MACs|
          |  - Priority 0:   Table-Miss Packet-In to Controller           |
          +-------------------------------+-------------------------------+
                                          |
        +---------------------------------+-------------------------------+
        |                                 |                               |
    [Port 1]                          [Port 2]                        [Port 4]
        v                                 v                               v
+-----------------+               +-----------------+             +-----------------+
| Hostel Gateway  |               |  Student Host   |             |  Rogue 2nd Host |
| (10.0.0.1)      |               |  23CS001        |             |  (Unauthorized) |
| Internet Uplink |               |  AA:BB:CC:..:33 |             |  DD:EE:FF:..:66 |
+-----------------+               +-----------------+             +-----------------+
                                  [STATUS: ALLOWED]               [STATUS: DROPPED]
```

---

## 3. Technology Stack

### Frontend
- **Framework**: React 19 (TypeScript)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4 (Navy Blue cybersecurity theme with Electric Blue & Cyan accents)
- **Icons**: Lucide React
- **Data Visualization**: Recharts (Network Throughput Area Charts)
- **Theme Modes**: Dark Mode, Light Mode, System Default (persisted in `localStorage`)

### Backend
- **Language**: Python 3.10+
- **Framework**: Flask, Flask-SQLAlchemy, Flask-CORS
- **Database**: SQLite (local single-file demo database)
- **Security**: Werkzeug secure password hashing (PBKDF2/SHA-256)
- **SDN Adapter**: Ryu REST Client & Embedded OpenFlow 1.3 Emulation Engine

### SDN Network Simulation
- **Mininet**: Programmable virtual network topology (`topology.py`)
- **Switch**: Open vSwitch (OVS) with OpenFlow 1.3 protocol
- **Controller**: Ryu SDN Framework (`netstat_controller.py`)

---

## 4. Project Structure

```
netstat/
├── backend/
│   ├── app/
│   │   ├── __init__.py           # Flask app factory, blueprint registration, DB init
│   │   ├── models.py             # SQLAlchemy models (Students, Devices, SecurityLogs, FlowRules)
│   │   ├── access_control.py     # Core One-Device-Per-Student policy engine
│   │   ├── sdn_adapter.py        # Ryu REST client + High-fidelity OpenFlow 1.3 emulator
│   │   ├── utils.py              # JWT/Token authentication decorators
│   │   ├── seed_data.py          # Demo accounts (admin, 23CS001, test MACs)
│   │   └── routes/
│   │       ├── auth.py           # Login, logout, session verification
│   │       ├── student.py        # Student profile, registered device, activity
│   │       ├── admin.py          # Student CRUD, KPI stats, traffic telemetry
│   │       ├── devices.py        # Block, unblock, reset/replace device
│   │       ├── network.py        # Topology nodes/links, switch status, flow rules
│   │       ├── security.py       # Security alerts, access decisions audit log
│   │       └── demo.py           # Demo state reset endpoint
│   ├── config.py                 # Configuration settings
│   ├── run.py                    # Backend server entrypoint
│   └── requirements.txt          # Python dependencies
├── sdn/
│   ├── topology.py               # Mininet SDN topology (1 Controller, 1 OVS, 3 Hosts)
│   ├── netstat_controller.py     # Ryu OpenFlow 1.3 Controller application
│   └── README_SDN.md             # Linux / Mininet / Ryu execution instructions
├── frontend/
│   ├── src/
│   │   ├── components/           # Sidebar, Navbar, DemoBar, KPICards, TopologyGraph, etc.
│   │   ├── pages/                # Admin Dashboard, Student Portal, Topology, Flows, etc.
│   │   ├── context/              # AuthContext, ThemeContext, DemoContext
│   │   ├── services/api.ts       # Backend REST API client
│   │   ├── types.ts              # TypeScript domain interfaces
│   │   ├── App.tsx               # Route configurations
│   │   ├── main.tsx              # React DOM entrypoint
│   │   └── index.css             # Tailwind v4 custom styles
│   ├── package.json
│   └── vite.config.ts            # Vite proxy and Tailwind plugin
├── tests/
│   ├── test_access_control.py    # 7 unit tests covering all access control rules
│   └── verify_end_to_end.py      # End-to-end automated test for Demo Scenarios 1-4
├── README.md                     # Comprehensive project documentation
├── DEMO_GUIDE.md                 # Step-by-step presentation demonstration guide
└── VIVA_QUESTIONS.md             # 30+ Viva Voce questions & answers
```

---

## 5. Quick Installation & Startup

### Prerequisites
- Python 3.10+
- Node.js v18+ and `npm` / `pnpm`

### Step 1: Clone or Navigate to Project
```bash
cd netstat
```

### Step 2: Install Backend Dependencies
```bash
cd backend
pip install -r requirements.txt
cd ..
```

### Step 3: Install Frontend Dependencies
```bash
cd frontend
npm install   # or pnpm install
cd ..
```

### Step 4: Run Backend
```bash
# In Terminal 1:
python backend/run.py
```
*Backend runs on: `http://127.0.0.1:5000`*

### Step 5: Run Frontend
```bash
# In Terminal 2:
cd frontend
npm run dev   # or pnpm dev
```
*Frontend runs on: `http://localhost:5173`*

Open your browser at **`http://localhost:5173`**.

---

## 6. Default Demo Credentials

| Role | Username / ID | Password | Notes |
|---|---|---|---|
| **Network Administrator** | `admin` | `Admin@123` | Full access to SDN dashboard, device management, flow tables |
| **Hostel Student** | `23CS001` | `Student@123` | Aarav Sharma (Hostel 4, Room 204) - Ready for live Test 1 |

### Preconfigured Test Device Identities

| Device Identity | MAC Address | Designated Role |
|---|---|---|
| **Device 1 (Trusted)** | `AA:BB:CC:11:22:33` | Primary student device (Auto-registered on Test 1) |
| **Device 2 (Unauthorized)** | `DD:EE:FF:44:55:66` | Secondary unauthorized device (Triggering DROP on Test 3) |
| **Device 3 (Replacement)** | `11:22:33:44:55:66` | Replacement device used for testing device reset |

---

## 7. Running Automated Verification

To verify that the system satisfies all project constraints, execute the automated test suites:

```bash
# 1. Run Core Access Control Unit Tests (7 tests)
python tests/test_access_control.py

# 2. Run End-to-End Demo Scenario Verification (Scenarios 1-4)
python tests/verify_end_to_end.py
```
Expected output: **All tests pass with 100% success.**
