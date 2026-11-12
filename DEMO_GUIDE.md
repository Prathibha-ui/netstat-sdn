# NETSTAT – Live Demonstration Guide

Follow this guide to deliver a seamless, high-scoring project presentation.

---

## 1. Quick Startup Commands

### Terminal 1: Start Backend API
```bash
cd netstat
python backend/run.py
```
> Expected Output:
> `NETSTAT Backend & SDN Security Management System Starting`
> `Serving API on: http://127.0.0.1:5000`

### Terminal 2: Start Frontend Application
```bash
cd netstat/frontend
pnpm dev
# (or: npm run dev)
```
> Expected Output:
> `VITE ready in ... ms`
> `Local: http://localhost:5173/`

Open your browser to: **`http://localhost:5173`**

---

## 2. Optional: Live Mininet & Ryu Execution (Linux / WSL2)

If presenting on Linux or inside Ubuntu on WSL2:

### Terminal A: Start Ryu OpenFlow 1.3 Controller
```bash
ryu-manager --verbose sdn/netstat_controller.py ryu.app.ofctl_rest
```

### Terminal B: Launch Mininet Virtual Network Topology
```bash
sudo python3 sdn/topology.py 127.0.0.1 6653
```

> **Note for Windows native presentations**:
> If presenting natively on Windows without Linux/Mininet, NETSTAT operates with its **Embedded High-Fidelity OpenFlow 1.3 Simulation Engine**. It generates and updates exact OpenFlow 1.3 flow tables, provides live packet-in simulation, and is clearly labeled in the UI as *High-Fidelity Software OpenFlow 1.3 Emulation*. You do not need to install Linux or Mininet for a successful demonstration.

---

## 3. Demo Credentials & Test Hardware Identities

### Demo Accounts
- **Network Administrator**:
  - Username: `admin`
  - Password: `Admin@123`
- **Hostel Student**:
  - Student ID: `23CS001`
  - Password: `Student@123`
  - Name: Aarav Sharma (Computer Science, 3rd Year)

### Test Hardware MAC Addresses
- **Device 1 (Trusted Device)**: `AA:BB:CC:11:22:33`
- **Device 2 (Unauthorized Device)**: `DD:EE:FF:44:55:66`
- **Device 3 (Replacement Device)**: `11:22:33:44:55:66`

---

## 4. Step-by-Step Demonstration Walkthrough

### Preparation Step: Reset Demo Environment
1. In the top cyan **SIMULATED NETWORK ADAPTER** banner, click the **Reset Demo** button (or click **Demo: Test 1**).
2. *Result*: Student `23CS001` device registrations are wiped clean, ready for fresh demonstration.

---

### SCENARIO 1 (TEST 1): First Connection Registration
**Objective**: Demonstrate that when a student connects for the first time from a trusted network device, NETSTAT automatically binds that MAC address to the student and installs an OpenFlow ALLOW rule.

1. Navigate to the **Student Portal**: `http://localhost:5173/student/login` (or click **Test 1** on the demo dock).
2. Ensure **Device 1 (AA:BB:CC:11:22:33)** is selected in the network adapter dock.
3. Click **Autofill Student Demo** (`23CS001` / `Student@123`).
4. Click **Connect to Hostel Wi-Fi**.

#### Expected Result:
- Access decision: **ALLOW**.
- The student is redirected to their **Student Dashboard**.
- The dashboard displays:
  - Student Identity: Aarav Sharma (23CS001)
  - Registered Device Card: Masked MAC `AA:BB:CC:**:**:33`
  - Status: **ALLOWED / Authorized & Active**
  - Notification banner: *"First-time device registration successful. MAC automatically bound to student."*

---

### SCENARIO 2 (TEST 2): Reconnection From Same Device
**Objective**: Demonstrate that subsequent connections from the registered device continue to be permitted.

1. On the Student Dashboard, click **Disconnect** (or click **Test 2** on the top demo dock).
2. Ensure **Device 1 (AA:BB:CC:11:22:33)** remains selected.
3. Click **Connect to Hostel Wi-Fi**.

#### Expected Result:
- Access decision: **ALLOW**.
- Status: **VERIFIED_DEVICE**.
- Access is granted instantly, and `last_connected_at` is updated.

---

### SCENARIO 3 (TEST 3): Connection Attempt From Unauthorized Second Device
**Objective**: Demonstrate that when the same student attempts to connect using an unregistered secondary phone or laptop, the system detects the MAC mismatch, blocks the device, triggers an OpenFlow DROP rule, and records a security incident.

1. In the top network adapter dock, select **Dev 2 (Unauthorized): DD:EE:FF:44:55:66** (or click **Test 3** on the demo dock).
2. Ensure student ID is `23CS001` and password is `Student@123`.
3. Click **Connect to Hostel Wi-Fi**.

#### Expected Result:
- Access decision: **DROP (HTTP 403 Forbidden)**.
- A red security alert box appears with the message:
  > *"One-Device Policy Violation: Student Aarav Sharma (23CS001) already has a registered trusted device [AA:BB:CC:11:22:33], but attempted login from unauthorized device [DD:EE:FF:44:55:66]."*
- The alert highlights:
  - Observed MAC: `DD:EE:FF:44:55:66`
  - Registered MAC: `AA:BB:CC:11:22:33`
  - Action: **Priority 200 DROP rule installed on Open vSwitch**.

---

### SCENARIO 4 (TEST 4): Admin Dashboard & OpenFlow Inspection
**Objective**: Demonstrate administrative monitoring, real-time security alerts, flow table updates, and packet inspection.

1. Click **Admin Console** (or navigate to `http://localhost:5173/admin/login`).
2. Log in with `admin` / `Admin@123`.
3. Observe the **Admin Dashboard**:
   - **Unauthorized Attempts KPI Card**: Incremented by 1.
   - **Security Alerts KPI Card**: Shows new high-priority incident.
   - **Recent Access Decisions**: Shows `DROP` decision for `23CS001` from `DD:EE:FF:44:55:66`.
   - **High-Priority Security Alerts Feed**: Shows `UNAUTHORIZED_DEVICE_ATTEMPT` with full MAC details.
4. Navigate to **Network > Flow Rules** (`/admin/flows`):
   - Notice the active flow entries:
     - **Priority 200**: `eth_src=DD:EE:FF:44:55:66`, Action: `DROP (Clear actions pipeline)` (Created during Test 3).
     - **Priority 100**: `eth_src=AA:BB:CC:11:22:33`, Action: `OUTPUT:GATEWAY_PORT` (Created during Test 1).
     - **Priority 0**: `* (All unmatched traffic)`, Action: `OUTPUT:CONTROLLER` (Table-Miss rule).
5. Navigate to **Network > Network Topology** (`/admin/topology`):
   - View interactive visual topology graph showing Ryu Controller, Open vSwitch (`s1`), Gateway, and Student Hosts.
   - Notice the link to the unauthorized device is displayed with a red **DROPPED** status.
   - Click on any node to inspect port assignments and telemetry in the drawer.
6. Test Ingress Packet:
   - Click the **Test Ingress Frame** button.
   - Choose preset **Host 3 (Rogue: DD:EE:FF:44:55:66)** and click **Inject Packet into Open vSwitch**.
   - Watch the switch evaluate Table 0 and output: `Switch Action: PACKET_DROPPED_BY_SWITCH (Priority 200)`.

---

### BONUS SCENARIO: Device Replacement / Reset Workflow
**Objective**: Demonstrate how a student who purchased a new laptop gets their device binding reset by the administrator.

1. Navigate to **Network > Devices** (`/admin/devices`).
2. Locate student `23CS001` (MAC `AA:BB:CC:11:22:33`).
3. Click the **Reset / Replace** button.
4. Notice the device registration is removed from the table, and the switch flow rule is cleared.
5. In the top simulation adapter dock, switch to a new MAC (e.g. `11:22:33:44:55:66`).
6. Log in as student `23CS001` at `/student/login`.
7. *Result*: The new device is bound as the student's new trusted hardware!

---

## 5. Troubleshooting Checklist

| Issue | Resolution |
|---|---|
| Backend connection refused (`Failed to fetch`) | Ensure `python backend/run.py` is actively running in a terminal on port 5000. |
| Port 5000 or 5173 already in use | Change port or terminate existing process: `Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force` |
| Student login fails immediately | Click **Reset Demo** in the top cyan dock to ensure demo accounts are in initial state. |
| Want to re-run demo from the beginning | Click the **Reset Demo** button on the top simulation dock anytime! |
