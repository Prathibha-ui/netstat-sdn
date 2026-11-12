# NETSTAT Deployment Guide

This guide covers 3 ways to deploy and run **NETSTAT**:
1. **Cloud Deployment (Render.com - 100% Free & 24/7 Live)**: For submitting a project URL or showing external reviewers.
2. **Instant Public URL (Localtunnel / ngrok - 30 Seconds)**: Instant public link from your laptop without cloud setup.
3. **Local Wi-Fi / Hotspot Deployment (College Demo)**: Best for in-person presentations so professors can connect via mobile phones.

---

## Architecture Overview for Deployment

The application is structured as a **unified full-stack deployment**:
- Flask serves both the **REST API** (`/api/*`) and the compiled **Vite/React single-page application** (`frontend/dist/`).
- Only **one server** (Port 5000 or the cloud platform's assigned `$PORT`) is required.
- The SQLite database (`netstat.db`) is automatically initialized and seeded on first launch.

---

## Option 1: Cloud Deployment (Render.com) - Recommended Free Hosting

Render provides free cloud hosting for Python web services with automatic SSL (`https://`).

### Step 1: Initialize Git and Push to GitHub

Open PowerShell or Command Prompt:

```bash
cd C:\Users\prath\.gemini\antigravity\scratch\netstat

# Initialize git repository
git init
git add .
git commit -m "Deploy NETSTAT SDN Access Control System"

# Link to your GitHub account (create a new public or private repo on github.com first)
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/netstat.git
git push -u origin main
```

*(Note: `frontend/dist` is pre-built and included, so cloud deployment is fast and doesn't even need Node.js installed on the server).*

### Step 2: Deploy on Render.com

1. Go to [https://dashboard.render.com](https://dashboard.render.com) and sign in with GitHub.
2. Click **New +** > **Web Service**.
3. Select your `netstat` repository.
4. Fill in the deployment settings:
   - **Name**: `netstat-sdn` (or any name you prefer)
   - **Language / Runtime**: `Python 3`
   - **Region**: Any (e.g., Oregon, Frankfurt, Singapore)
   - **Branch**: `main`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn backend.run:app`
   - **Instance Type**: `Free`
5. Click **Deploy Web Service**.
6. In ~1-2 minutes, Render will provide your live URL:
   `https://netstat-sdn.onrender.com`

---

## Option 2: Instant Public Link (Localtunnel or ngrok)

If you need a live public URL immediately without creating GitHub repositories or cloud accounts:

### Using Localtunnel (Zero installation, uses npx):

1. **Terminal 1** (Start backend):
   ```bash
   cd C:\Users\prath\.gemini\antigravity\scratch\netstat
   python backend/run.py
   ```

2. **Terminal 2** (Expose port 5000):
   ```bash
   npx localtunnel --port 5000
   ```
   Localtunnel will output a public URL such as:
   `https://young-lions-cry.loca.lt`

   *(When opening the link, it may ask for your public IP once to confirm. You can see your public IP by visiting [whatismyip.host](https://whatismyip.host)).*

### Using ngrok:
```bash
ngrok http 5000
```
ngrok will display an HTTPS URL like `https://xxxx-xx-xx.ngrok-free.app`.

---

## Option 3: Local Network / Wi-Fi Hotspot (College Lab Presentation)

This is the standard, foolproof way to demonstrate the project to evaluators in a college laboratory or classroom.

1. **Connect Devices to Same Network**:
   - Connect your laptop and testing devices (smartphones, other lab laptops) to the college Wi-Fi, or turn on your mobile hotspot and connect your laptop to it.

2. **Find Your Laptop's Local IP**:
   - Open Command Prompt and type:
     ```cmd
     ipconfig
     ```
   - Look for **IPv4 Address** under `Wireless LAN adapter Wi-Fi` (e.g., `192.168.1.15` or `10.1.14.43`).

3. **Start the Unified Server**:
   ```bash
   cd C:\Users\prath\.gemini\antigravity\scratch\netstat
   python backend/run.py
   ```

4. **Access the System**:
   - On your laptop: Open [http://localhost:5000](http://localhost:5000)
   - On the professor's phone or any device on the same Wi-Fi: Open `http://<YOUR_IP>:5000` (e.g. `http://192.168.1.15:5000`).

---

## Default Credentials for Live Demo

- **Admin Login**:
  - URL: `/admin/login`
  - Username: `admin`
  - Password: `Admin@123`
- **Student Login**:
  - Roll No: `23CS001` / Password: `Student@123`
  - Or use the **"New Student Registration"** tab to enroll with any name and roll number.
