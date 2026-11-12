# NETSTAT SDN Architecture & Simulation Guide

This folder contains the SDN components for **NETSTAT – Network Access & Security Management System**.

## Components
1. `topology.py`: Mininet script creating 1 Open vSwitch (`s1`), 1 Ryu remote controller (`c0`), 1 Gateway router (`gw`), and 3 student hosts (`h1`, `h2`, `h3`).
2. `netstat_controller.py`: Ryu OpenFlow 1.3 controller application that listens for Packet-In events, verifies MAC registration against the NETSTAT backend, and installs Priority 200 DROP or Priority 100 ALLOW flow rules.

---

## Running in Linux / Ubuntu / WSL2

### Prerequisites
```bash
sudo apt-get update
sudo apt-get install -y mininet openvswitch-switch python3-pip
pip install ryu
```

### Step 1: Start NETSTAT Backend
```bash
python backend/run.py
```
Backend runs on `http://127.0.0.1:5000`.

### Step 2: Start Ryu Controller with REST API
In a separate terminal:
```bash
ryu-manager --verbose sdn/netstat_controller.py ryu.app.ofctl_rest
```
- OpenFlow listener: `0.0.0.0:6653` (or `6633`)
- REST API endpoint: `http://127.0.0.1:8080`

### Step 3: Launch Mininet Topology
In another terminal (with `sudo`):
```bash
sudo python3 sdn/topology.py 127.0.0.1 6653
```

### Step 4: Test in Mininet CLI
1. Verify ping from registered host `h1` to gateway:
   ```bash
   mininet> h1 ping -c 3 gw
   # PING 10.0.0.1 (10.0.0.1) 56(84) bytes of data.
   # 64 bytes from 10.0.0.1: icmp_seq=1 ttl=64 time=1.23 ms
   # 0% packet loss -> ALLOWED!
   ```

2. Verify ping from unauthorized host `h3`:
   ```bash
   mininet> h3 ping -c 3 gw
   # PING 10.0.0.1 (10.0.0.1) 56(84) bytes of data.
   # --- 10.0.0.1 ping statistics ---
   # 3 packets transmitted, 0 received, 100% packet loss -> DROPPED BY OPENFLOW RULE!
   ```

3. Check OpenFlow flow table on switch `s1`:
   ```bash
   sudo ovs-ofctl -O OpenFlow13 dump-flows s1
   ```
   You will see:
   - `priority=200,in_port=4,dl_src=dd:ee:ff:44:55:66 actions=drop`
   - `priority=100,in_port=2,dl_src=aa:bb:cc:11:22:33 actions=output:1`

---

## Native Windows / Fallback Mode
When running natively on Windows without Linux Mininet, NETSTAT seamlessly runs with the **Embedded OpenFlow 1.3 Simulation Engine**:
- Simulates exact OpenFlow 1.3 flow table insertion, priority ranking, and packet inspection.
- The UI contains an interactive **SDN Packet Ingress Simulator** and **Topology Visualizer** with live node telemetry.
- Clearly labeled in the UI as `High-Fidelity Software OpenFlow 1.3 Emulation`.
