# OAK & GRAIN INTERIORS — COMPLETE WEBSITE & ADMIN PORTAL GUIDE

Welcome to the official, production-ready website for **Oak & Grain Interiors**.
This website is built with clean **HTML5, CSS3, Vanilla JavaScript, and Supabase** — running as a 100% static site with zero Node.js build steps, zero npm dependencies, and zero complex backend setups.

---

## 📁 Project File Structure

```text
INTERIOR/
├── index.html            # Main customer website with enquiry form & animations
├── style.css             # Original design, variables, typography & layout styles
├── script.js             # Original scroll animations, gallery, modals & form logic
├── supabase-config.js    # Centralized Supabase credentials & logging functions
├── supabase-setup.sql    # Complete PostgreSQL database schema, RLS policies & triggers
├── images.js             # Photo & gallery configuration
├── images/               # High-resolution portfolio & service images
├── admin.html            # Private Studio Admin Portal (Login & Dashboard)
├── admin.css             # Luxury interior-design-inspired admin styling
├── admin.js              # Admin authentication, enquiries management & activity tracking
├── privacy-policy.html   # Privacy Policy explaining enquiry data usage
├── terms.html            # Terms of Service for interior design consultations
├── 404.html              # Custom branded 404 error page
└── README.md             # This step-by-step guide
```

---

## ⚡ What Has Been Completed for You

1. **Original Website Preserved 100%**:
   - Layout, typography, colors (`#fbf8f4` light / `#16110e` dark), day/night toggle (`🌙`/`☀️`).
   - Every single scroll animation: preloader counter, staggered hero reveals (`.hv`), horizontal parallax title slides (`.slx` via `tick()`), scroll-triggered section fades (`.fd` via `IntersectionObserver`), portfolio modal, and dynamic gallery.
   
2. **Branding & Contact Info Fully Updated**:
   - **Business Name**: Oak & Grain Interiors
   - **Lead Designer / Contact Person**: Amit Singh
   - **Phone**: `+91 93530 19525` (one-click call links)
   - **WhatsApp**: `+91 93530 19525` (direct chat links with pre-filled message)
   - **Email**: `oakandgraininteriors@gmail.com`
   - **Instagram**: `@oakandgrain.interiors`
   - **Location**: Bengaluru, Karnataka

3. **Customer Enquiry Form**:
   - Fields: Full Name, Indian Mobile Number, Email (Optional), Service Required, Message.
   - Validation for 10-digit Indian mobile numbers (`^[6-9]\d{9}$`).
   - Prevention of empty and duplicate submissions (button locks during send).
   - Direct storage in Supabase `enquiries` table.
   - Elegant confirmation card with direct WhatsApp fast-track button.

4. **Activity Tracking**:
   - Logs customer interactions (`Enquiry submitted`, `Phone button clicked`, `WhatsApp button clicked`) to Supabase `activity_logs`.
   - *Note*: Phone clicks only record button interactions (initiating the phone app) without claiming call completion.

5. **Private Studio Admin Portal**:
   - Discreet access via the subtle **"Staff"** link in the footer of `index.html`.
   - Whitelist security: Only `amit@oakandgrain.in`, `studio@oakandgrain.in`, and `manager@oakandgrain.in` are permitted.
   - Live dashboard: KPI overview, search by name/phone/email, filter by status (`New`, `Contacted`, `Completed`), view full message, update status, delete enquiry, one-click WhatsApp and Call actions, and real-time activity history.
   - Password reset flow via Supabase Auth email recovery.

6. **Database Security (RLS)**:
   - Public visitors can only submit (`INSERT`) enquiries and interaction events.
   - Public visitors **cannot** read (`SELECT`), edit (`UPDATE`), or delete (`DELETE`) enquiries.
   - Only verified studio administrators can view and manage client data.

---

## 🛠️ YOUR STEP-BY-STEP SETUP GUIDE (From Zero to Live)

Follow these easy steps to connect your free Supabase database and launch the website.

### STEP 1: Create a Free Supabase Account
1. Open your browser and go to [https://supabase.com](https://supabase.com).
2. Click **"Start your project"** or **"Sign In"**.
3. Sign up using your email or GitHub account (it is completely free).

---

### STEP 2: Create a New Supabase Project
1. In your Supabase dashboard, click **"New project"**.
2. Fill in the project details:
   - **Name**: `oak-and-grain-interiors` (or any name you prefer)
   - **Database Password**: Choose a strong password and save it in a safe place.
   - **Region**: Select **"South Asia (Mumbai)"** for the fastest performance in Bengaluru/India.
   - **Pricing Plan**: Free Tier.
3. Click **"Create new project"**.
4. Wait about 1-2 minutes for Supabase to provision your database.

---

### STEP 3: Execute the SQL Setup Script
1. In your Supabase project dashboard, click on **"SQL Editor"** in the left sidebar (looks like `>_` or a terminal icon).
2. Click **"New query"** (or "+").
3. Open the file `supabase-setup.sql` on your computer using Notepad, VS Code, or any text editor.
4. Copy the entire contents of `supabase-setup.sql` and paste it into the Supabase SQL Editor.
5. Click the green **"Run"** button in the bottom right corner.
6. You will see `Success. No rows returned`.
   *(This creates the `admin_profiles`, `enquiries`, and `activity_logs` tables along with all Row Level Security policies and performance indexes).*

---

### STEP 4: Copy Your Supabase API Credentials
1. In the Supabase left sidebar, click the **Settings** icon (gear at the bottom left).
2. Click on **"API"** under Project Settings.
3. You will see two important values:
   - **Project URL**: (e.g., `https://xyzabcdefghijklm.supabase.co`)
   - **Project API Keys**: Look for the key labeled **`anon` / `public`**. (Starts with `eyJhbGciOi...`).
   *(Do NOT copy the `service_role` secret key — browser code only uses the `anon` key).*

---

### STEP 5: Paste Your Credentials into `supabase-config.js`
1. Open the file `supabase-config.js` in your text editor.
2. Replace `'YOUR_SUPABASE_URL'` with your actual Project URL.
3. Replace `'YOUR_SUPABASE_ANON_KEY'` with your actual `anon` key.
4. Save the file.

```javascript
const SUPABASE_CONFIG = {
  url: 'https://xyzabcdefghijklm.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
};
```

---

### STEP 6: Create the 3 Authorised Admin Accounts
1. In the Supabase left sidebar, click on **"Authentication"** (person icon).
2. Click on the **"Users"** tab at the top.
3. Click the green button **"Add user"** -> select **"Create user"**.
4. Create the three accounts one by one:
   - **Account 1**:
     - Email: `amit@oakandgrain.in`
     - Password: Choose a secure password
     - **Toggle "Auto Confirm User?" to ON** (Green) -> Click **"Create user"**.
   - **Account 2**:
     - Email: `studio@oakandgrain.in`
     - Password: Choose a secure password
     - **Auto Confirm User**: ON -> Click **"Create user"**.
   - **Account 3**:
     - Email: `manager@oakandgrain.in`
     - Password: Choose a secure password
     - **Auto Confirm User**: ON -> Click **"Create user"**.

*As soon as these accounts are created, our database trigger automatically registers them in `admin_profiles` and activates their admin permissions!*

---

### STEP 7: Configure Email & Password Reset Settings
1. In the Supabase left sidebar, go to **Authentication** -> **URL Configuration**.
2. In the **Site URL** field, set:
   - When testing locally: `http://localhost:8000` (or `http://127.0.0.1:5500`)
   - When deployed to production: `https://your-domain.com` (or your Netlify URL)
3. In **Redirect URLs**, add:
   - `http://localhost:8000/admin.html`
   - `https://your-domain.com/admin.html`
4. Click **"Save"**.
*(This ensures that when an admin clicks "Forgot password?", the reset email directs them right back to the admin portal).*

---

### STEP 8: Testing the Website Locally (WITHOUT Node.js)
You **do not** need Node.js, npm, or any installation to test your website.

**Method A: Simple Python Local Server** (If Python is installed):
1. Open PowerShell or Command Prompt in this folder (`INTERIOR`).
2. Run:
   ```powershell
   python -m http.server 8000
   ```
3. Open your browser to: `http://localhost:8000`
4. Test:
   - Scroll through all sections and verify animations.
   - Submit a test enquiry in the Contact section.
   - Click the "Staff" link in the footer to open `admin.html`.
   - Log in using `amit@oakandgrain.in` and your chosen password.
   - View your test enquiry on the dashboard!

**Method B: Direct Double-Click**:
- You can even double-click `index.html` to open it directly in Chrome, Edge, or Safari!
*(For Supabase Auth and password recovery redirects, a local server or hosted URL is recommended).*

---

### STEP 9: Free Deployment to Netlify (Drag-and-Drop)
1. Go to [https://www.netlify.com](https://www.netlify.com) and create a free account.
2. In your Netlify dashboard, go to **"Sites"**.
3. Locate the box that says: **"Want to deploy a new site without connecting to Git? Drag and drop your site output folder here"**.
4. Drag your entire `INTERIOR` folder and drop it into that box.
5. Netlify will deploy your website in less than 5 seconds!
6. Netlify will assign a live URL (e.g. `https://peaceful-oak-123456.netlify.app`).
7. Test the live link on your phone and laptop!

---

### STEP 10: Connecting a Custom Domain (e.g. `oakandgrain.in`)
1. In your Netlify site dashboard, click **"Domain management"** -> **"Add a domain"**.
2. Enter your domain name (e.g. `oakandgrain.in` or `www.oakandgrain.in`).
3. Netlify will provide DNS records (CNAME or A records).
4. Go to your domain registrar (GoDaddy, Namecheap, Hostinger, etc.) and add those DNS records.
5. Netlify will automatically provision a free SSL certificate (HTTPS) within a few minutes.
6. Update your **Site URL** in Supabase (from Step 7) to your new custom domain!

---

## 🔒 Security Best Practices Summary
- **No Service-Role Key in Frontend**: Your website only uses the public `anon` key.
- **Row Level Security (RLS)**: Enforced directly on PostgreSQL. Even if someone inspects the network tab, they cannot view, edit, or delete any customer enquiries without logging in as one of the 3 approved emails.
- **Protected Admin Views**: Unauthorized users cannot bypass authentication to access client submissions.

---

## 📞 Support & Contacts
- **Oak & Grain Interiors**: Amit Singh
- **Phone / WhatsApp**: +91 93530 19525
- **Email**: oakandgraininteriors@gmail.com
- **Instagram**: @oakandgrain.interiors
- **Location**: Bengaluru, Karnataka, India
#   o a k - a n d - g r a i n - i n t e r i o r s  
 