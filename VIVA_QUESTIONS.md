# NETSTAT – Comprehensive Viva Voce Questions & Answers
### Computer Networks, Software-Defined Networking (SDN), & Access Control

This document contains 32 beginner-friendly yet technically thorough viva voce and examination questions tailored for the **NETSTAT** project demonstration.

---

## Section 1: Software-Defined Networking (SDN) Fundamentals

### Q1: What is Software-Defined Networking (SDN), and how does it differ from traditional networking?
**Answer:**
Traditional networking couples the **Control Plane** (the decision-making logic, routing protocols, and access policies) and the **Data Plane** (the actual packet-forwarding hardware) inside each individual router or switch. Each box must be configured independently.

In **Software-Defined Networking (SDN)**:
- The Control Plane is decoupled from physical switches and centralized in a software program called an **SDN Controller** (e.g., Ryu).
- The Data Plane consists of simple, programmable packet-forwarding devices (e.g., Open vSwitch) that receive instructions from the controller via open protocols like **OpenFlow**.
- Benefit: Network-wide policy changes can be deployed dynamically in milliseconds from code, without reconfiguring physical switches manually.

---

### Q2: What are the three primary layers of the SDN architecture?
**Answer:**
1. **Application Layer**: Network management and business logic applications (e.g., our NETSTAT Access Control Engine, firewall apps, load balancers).
2. **Control Layer**: The SDN Controller (e.g., Ryu, ONOS) which maintains a global view of network state and translates application intent into flow rules.
3. **Infrastructure / Data Layer**: Programmable switches (e.g., Open vSwitch, hardware OpenFlow switches) that parse, modify, forward, or drop packets based on flow tables.

---

### Q3: What is the Southbound Interface vs. Northbound Interface in SDN?
**Answer:**
- **Southbound Interface**: The protocol used by the SDN Controller to communicate with the data-plane switches. **OpenFlow 1.3** is the standard Southbound Interface used in this project.
- **Northbound Interface**: APIs (typically RESTful HTTP/JSON APIs) exposed by the SDN Controller to higher-level applications and business management systems (like the NETSTAT backend).

---

### Q4: Why is SDN specifically beneficial for a hostel Wi-Fi network?
**Answer:**
In a traditional hostel network, enforcing an access policy like "one-device-per-student" requires expensive proprietary Wireless LAN Controllers (WLCs) or 802.1X RADIUS setups. Even then, traditional captive portals authenticate at Layer 7 (HTTP), meaning secondary devices can spoof MAC/IP addresses or share credentials without switch-level dropping.

With SDN:
- The controller dynamically installs **Priority 200 DROP flow rules** directly into switch hardware or kernel for unauthorized MACs.
- Frames from unauthorized devices are discarded at ingress ports before they can consume hostel upstream bandwidth or launch attacks.

---

## Section 2: OpenFlow 1.3 Protocol & Open vSwitch

### Q5: What is OpenFlow, and what role does it play in NETSTAT?
**Answer:**
OpenFlow is an open communications standard defined by the Open Networking Foundation (ONF). It allows the SDN controller to directly read and manipulate the internal flow tables of network switches.
In NETSTAT, OpenFlow 1.3 is used to:
1. Deliver **Packet-In** messages to the Ryu controller when an unclassified device transmits frames.
2. Push **Flow-Mod** commands to install `ALLOW` or `DROP` rules into Table 0 of Open vSwitch.

---

### Q6: What components make up an OpenFlow 1.3 Flow Table entry?
**Answer:**
Each entry in an OpenFlow 1.3 flow table contains:
1. **Match Fields**: Header conditions (e.g., `eth_src`, `eth_dst`, `eth_type`, `in_port`, `ip_proto`).
2. **Priority**: Numerical integer (0 to 65535). Higher priority rules are evaluated first.
3. **Counters**: Number of packets and bytes that have matched this specific rule.
4. **Instructions / Actions**: What to do with matching packets (e.g., `APPLY_ACTIONS: OUTPUT:port`, `DROP` [empty actions], or `GOTO_TABLE`).
5. **Timeouts**: `idle_timeout` (expires if no packets match for N seconds) and `hard_timeout` (expires after N seconds regardless of traffic).
6. **Cookie**: A 64-bit identifier used by the controller to filter or group rules.

---

### Q7: What is the "Table-Miss" flow rule?
**Answer:**
In OpenFlow 1.3, every flow table has a default **Table-Miss** entry with **Priority 0** and a wildcard match (`*`).
If an incoming packet does not match any higher-priority rule (like Priority 100 or 200), it matches the Table-Miss entry. The instruction tells the switch to encapsulate the packet header and send it to the controller via an **OpenFlow Packet-In** event.

---

### Q8: How does OpenFlow implement packet dropping?
**Answer:**
In OpenFlow 1.3, a **DROP** rule is implemented by creating a flow entry whose instruction set has **empty actions** (`actions=[]`).
When an incoming frame matches this rule, the switch applies zero output actions, causing the packet to be discarded immediately in kernel space without being forwarded or sent to the controller.

---

### Q9: Why did you set the DROP rule priority to 200 and the ALLOW rule priority to 100?
**Answer:**
OpenFlow switches evaluate flow rules in order of **highest priority first**.
- Priority 200 (DROP): Ensures that any unauthorized or rogue MAC is dropped immediately, even if a generic subnet or broadcast rule exists.
- Priority 100 (ALLOW): Forwards verified traffic from registered devices.
- Priority 0 (Table-Miss): Forwards unknown traffic to the controller for inspection.
By giving DROP a higher priority, security rules override forwarding rules.

---

### Q10: What is Open vSwitch (OVS)?
**Answer:**
Open vSwitch is a production-quality, open-source multilayer virtual switch designed for hypervisors and virtualized environments. It fully supports standard management interfaces and protocols, including OpenFlow 1.0 through 1.5, NetFlow, sFlow, and OVSDB.

---

## Section 3: Ryu Controller & Mininet Simulation

### Q11: What is the Ryu SDN Framework?
**Answer:**
Ryu is an open-source, component-based SDN framework written in Python. It provides software components with well-defined APIs that make it easy to create network management and control applications. Ryu supports OpenFlow 1.0, 1.2, 1.3, 1.4, 1.5, and NETCONF.

---

### Q12: How does the Ryu controller learn about a new student device connecting to the network?
**Answer:**
1. When a new device connects, its first frame (e.g., ARP request or DHCP Discover) arrives at Open vSwitch `s1`.
2. Since the switch has no matching flow rule for this new MAC, it hits the Priority 0 Table-Miss rule.
3. The switch generates an `OFPPacketIn` event and sends it across the OpenFlow control channel to Ryu.
4. Ryu's `@set_ev_cls(ofp_event.EventOFPPacketIn, MAIN_DISPATCHER)` handler extracts the Ethernet source MAC (`eth.src`), in-port, and payload.

---

### Q13: What is Mininet, and why is it used in academic and research SDN projects?
**Answer:**
Mininet is a network emulator that creates a realistic virtual network running real kernel, switch, and application code on a single machine (usually Linux).
It uses **Linux Network Namespaces** to create lightweight isolated virtual hosts, connects them with virtual Ethernet pairs (`veth`), and attaches them to Open vSwitch instances.
It allows testing real OpenFlow controllers and production code without needing physical hardware switches.

---

### Q14: What was your topology design in Mininet (`topology.py`)?
**Answer:**
Our Mininet topology consists of:
- **1 Remote Controller (`c0`)**: Ryu controller running OpenFlow 1.3 on TCP port 6653/6633.
- **1 Open vSwitch (`s1`)**: Bridge with DPID `0000000000000001`.
- **1 Gateway Router (`gw`)**: IP `10.0.0.1`, MAC `00:00:5E:00:53:01` connected to Switch Port 1.
- **3 Student Hosts**:
  - `h1`: Student 23CS001 primary registered device (`10.0.0.101`, MAC `AA:BB:CC:11:22:33`) on Port 2.
  - `h2`: Student 23CS002 registered device (`10.0.0.102`, MAC `52:54:00:12:34:56`) on Port 3.
  - `h3`: Unauthorized secondary device (`10.0.0.199`, MAC `DD:EE:FF:44:55:66`) on Port 4.

---

## Section 4: MAC Addresses & Network Security

### Q15: What is a MAC address, and at which OSI layer does it operate?
**Answer:**
A Media Access Control (MAC) address is a unique 48-bit (6-byte) physical identifier permanently or logically assigned to a Network Interface Card (NIC). It operates at **Layer 2 (Data Link Layer)** of the OSI model and is formatted as six pairs of hexadecimal digits (e.g., `AA:BB:CC:11:22:33`).

---

### Q16: Why can a standard browser JavaScript app not retrieve the client's physical MAC address?
**Answer:**
For critical privacy and sandbox security reasons, the W3C and browser security standards prevent web applications running inside a browser JavaScript engine from reading host hardware properties like NIC MAC addresses or serial numbers.
The browser only operates at the Application Layer (HTTP/HTTPS) over TCP/IP sockets.
In real-world networks, the client's MAC address is observed directly by:
- The Wireless Access Point (WAP) / 802.11 association table.
- The 802.1X / RADIUS authenticator.
- The DHCP server snooping table.
- The OpenFlow switch parsing the Ethernet frame header (`eth_src`).

---

### Q17: How did you solve this in your project demonstration?
**Answer:**
We created a **Controlled Network Simulation Adapter**:
- The network infrastructure (simulated AP or OpenFlow switch) supplies the observed MAC address to the backend via HTTP headers (`X-Observed-MAC`) or packet-in payloads.
- We built an explicit top simulation dock that lets the evaluator select which physical device (`Device 1: AA:BB:CC:11:22:33` vs `Device 2: DD:EE:FF:44:55:66`) is presenting frames to the switch port.
- This is clearly labeled as simulated network input and accurately mimics how an AP/controller passes observed Layer 2 telemetry to the captive backend.

---

### Q18: What is MAC Spoofing, and how does NETSTAT mitigate it?
**Answer:**
MAC spoofing is an attack where a rogue device changes its NIC's MAC address to impersonate an authorized host.
NETSTAT mitigates this through two mechanisms:
1. **Physical Switch Port Binding**: In OpenFlow, rules match on both `in_port` and `eth_src`. If an unauthorized device on Port 4 sends frames claiming to be `AA:BB:CC:11:22:33` (which is wired to Port 2), the port mismatch triggers an alert.
2. **Identity Authentication Binding**: Network access requires valid student credentials (`student_id` and password). Simply changing a MAC address without valid student credentials leaves the device unauthenticated.
3. **Duplicate MAC Check**: If a student attempts to register a MAC that is already actively bound to another student, NETSTAT triggers a `CRITICAL` severity alert and drops the traffic.

---

## Section 5: NETSTAT Access Control Logic

### Q19: Explain the exact step-by-step logic when a student logs in for the very first time.
**Answer:**
1. Student inputs Student ID (`23CS001`) and password (`Student@123`).
2. Backend verifies password against the stored PBKDF2/SHA-256 hash.
3. Network adapter extracts observed MAC (`AA:BB:CC:11:22:33`).
4. System queries `RegisteredDevice` table for student `23CS001`.
5. No active device exists -> System checks that no other student has claimed this MAC.
6. System inserts new `RegisteredDevice` record with status `ALLOWED`.
7. An `AccessDecision` (ALLOW) and `SecurityLog` (DEVICE_AUTO_REGISTERED) are saved.
8. SDN adapter installs a **Priority 100 ALLOW flow rule** (`eth_src=AA:BB:CC:11:22:33, actions=OUTPUT:GATEWAY`) on Open vSwitch.
9. Backend returns HTTP 200 with session token and device details.

---

### Q20: Explain what happens when the student tries to connect from a second device (Test 3).
**Answer:**
1. Student `23CS001` logs in from observed MAC `DD:EE:FF:44:55:66`.
2. Password is verified.
3. System checks student's active device: found registered MAC `AA:BB:CC:11:22:33`.
4. Comparison: `DD:EE:FF:44:55:66 != AA:BB:CC:11:22:33` -> **Mismatch detected!**
5. One-Device-Per-Student policy is violated.
6. System generates a `SecurityLog` with event `UNAUTHORIZED_DEVICE_ATTEMPT`, decision `DROP`, and severity `HIGH`.
7. System calls `sdn_adapter.push_drop_flow("DD:EE:FF:44:55:66")`, installing a **Priority 200 DROP rule** in Open vSwitch Table 0.
8. Backend rejects the connection with HTTP 403 Forbidden.

---

### Q21: How does NETSTAT handle device replacement (e.g., student lost or upgraded their laptop)?
**Answer:**
1. The student contacts the network administrator.
2. The admin logs into the Admin Console, navigates to **Devices**, and clicks **Reset / Replace** for that student.
3. The backend deletes or revokes the existing device record and removes the old MAC's flow rule from the switch.
4. An audit log is recorded (`DEVICE_REGISTRATION_RESET`).
5. The student now has zero registered devices.
6. On the student's next login from their new laptop, the system treats it as a First Connection and automatically registers the new MAC.

---

### Q22: Why does the Student Dashboard display a masked MAC address (`AA:BB:CC:**:**:33`)?
**Answer:**
Masking sensitive hardware identifiers is a standard cybersecurity best practice. While the network controller stores the full unmasked MAC for flow matching, masking the middle octets on the student-facing portal prevents shoulder-surfing, credential theft, and visual sniffing in public hostel study areas.

---

## Section 6: Database & Backend Design

### Q23: What tables exist in the NETSTAT database?
**Answer:**
1. `students`: Stores institutional identities (`student_id`, `name`, `email`, `department`, `year`, `hostel_room`, `password_hash`).
2. `registered_devices`: Stores active hardware bindings (`device_id`, `student_id`, `mac_address`, `ip_address`, `status`, `registered_at`, `last_connected_at`).
3. `security_logs`: Stores security events (`log_id`, `student_id`, `observed_mac`, `registered_mac`, `event_type`, `decision`, `reason`, `severity`, `timestamp`).
4. `access_decisions`: Comprehensive audit trail of every access evaluation.
5. `admins`: Administrator credentials and roles.
6. `network_flow_rules`: Synchronized state of active OpenFlow 1.3 flow table rules.

---

### Q24: How is password security implemented in NETSTAT?
**Answer:**
Passwords are never stored in plaintext. NETSTAT uses `werkzeug.security.generate_password_hash`, which applies **PBKDF2 (Password-Based Key Derivation Function 2) with HMAC-SHA256** and a cryptographic random salt. When logging in, `check_password_hash` calculates the salted hash and performs constant-time comparison to protect against timing attacks.

---

### Q25: How do database transactions ensure that a student cannot register two devices concurrently?
**Answer:**
We use database transactions and atomic query checks. When processing a registration, the query filters for existing active devices (`status IN ['ALLOWED', 'BLOCKED']`) for that student. If one is found, the transaction is rejected before writing. Database indexes on `(student_id, status)` and unique constraints on `mac_address` prevent race conditions or duplicate entries.

---

## Section 7: Frontend & User Experience

### Q26: What technologies were used to build the NETSTAT UI?
**Answer:**
- **React 19 + TypeScript**: Ensures type safety and modular component architecture.
- **Tailwind CSS v4**: Utility-first CSS used to build a navy blue cybersecurity theme with electric blue and cyan accents.
- **Lucide React**: Clean SVG iconography.
- **Recharts**: Responsive vector-based charting library for network throughput and dropped packet visualization.

---

### Q27: How is theme switching implemented?
**Answer:**
We built a custom `ThemeContext` supporting **Dark Mode**, **Light Mode**, and **System Mode**:
- The preference is saved in the browser's `localStorage` (`netstat_theme`).
- When "System" is selected, the app registers a `window.matchMedia('(prefers-color-scheme: dark)')` listener to adapt automatically to OS appearance changes.
- It dynamically adds or removes the `dark` class on the root `<html>` element.

---

### Q28: How does the Network Topology page work?
**Answer:**
The **Network Topology Page** queries `/api/network/topology`, which returns nodes and links representing the active SDN topology (Ryu Controller, Open vSwitch `s1`, Gateway, and Student Hosts).
It renders an interactive SVG canvas displaying live link statuses (cyan dashed line for OpenFlow control channel, solid blue for permitted links, solid red for dropped links).
Clicking any node opens a detail drawer showing its DPID, port, IP, and assigned OpenFlow version.

---

## Section 8: Testing & Project Evaluation

### Q29: What automated tests did you write to verify the project?
**Answer:**
We wrote two automated test suites:
1. `tests/test_access_control.py` (7 Unit Tests):
   - Invalid password rejection.
   - First device auto-registration -> ALLOW.
   - Same device login -> ALLOW.
   - Unauthorized second device -> DROP + HIGH alert.
   - Device reset and replacement workflow.
   - Duplicate MAC prevention across students -> CRITICAL alert.
   - Role-based authorization: verifying student token cannot access admin endpoints.
2. `tests/verify_end_to_end.py` (End-to-End Test):
   - Executes the complete live demo sequence (Test 1, Test 2, Test 3, Test 4) and checks all API responses and database state.

---

### Q30: What are the main limitations of this college prototype?
**Answer:**
1. **MAC Address Randomization**: Modern mobile operating systems (iOS and Android) enable randomized private MAC addresses by default for new Wi-Fi networks. In production, students must be instructed to turn off "Private Wi-Fi Address" for the hostel network so their static hardware MAC is observed.
2. **Simulation Adapter**: While real OpenFlow enforcement is supported via Mininet/Ryu, the Windows demo uses an HTTP header simulation adapter because standard browser sandboxes block direct Layer 2 hardware inspection.
3. **Single Switch**: The current topology models a single distribution switch (`s1`). In a campus with multiple hostel blocks, a multi-switch OpenFlow topology spanning several switches would be deployed.

---

### Q31: How would this project be deployed in a real-world campus hostel?
**Answer:**
1. **Hardware Switch**: Deploy an enterprise OpenFlow-compatible switch (e.g., HP ProCurve, Allied Telesis, or whitebox switch running OVS).
2. **Access Points**: Wi-Fi Access Points configured in bridge mode so client Ethernet frames reach the switch unaltered.
3. **Ryu Controller**: Run Ryu on a dedicated Linux VM or server in the campus datacenter.
4. **Captive Redirection**: Unauthenticated devices hitting the Table-Miss rule have their HTTP traffic redirected to the NETSTAT login portal via an OpenFlow IP redirect flow rule.
5. **Database**: SQLite can be seamlessly upgraded to PostgreSQL by changing `DATABASE_URL` in `config.py`.

---

### Q32: Summarize the key accomplishment of the NETSTAT project in one sentence.
**Answer:**
NETSTAT successfully bridges **Software-Defined Networking (OpenFlow 1.3)** with **Identity-Based Network Access Control** to dynamically enforce a strict One-Device-Per-Student policy directly at Layer 2, preventing unauthorized device sprawl and bandwidth abuse on hostel networks.
