# Important Dates App 🗓️💖

> **A dedicated, sacred personal memory & milestone tracker.**  
> Keep your family birthdays, wedding anniversaries, remembrance days, and personal achievements completely separate from your busy work and study calendars.

Built in accordance with the specifications in `important_dates_app_blueprint.pdf`.

---

## ✨ Why this app instead of Google Calendar?
* **Zero clutter**: No lectures, homework reminders, meetings, or dentist appointments mixing with beloved memories.
* **Milestone intelligence**: Automatically computes and tells you *"Turns 25"*, *"5th Anniversary"*, or *"10 years in loving memory"*.
* **Leap-year handling**: Gracefully observes Feb 29 anniversaries on Feb 28 on non-leap years.
* **Dual-tier privacy**: Keep certain milestone notes strictly private to you (Owner only), while sharing family dates with authorized members.
* **Invite-only security**: Only explicitly invited email addresses can log in. No public sign-ups.

---

## 🚀 Quick Start (Run Locally)

1. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Start the local development server:**
   \`\`\`bash
   npm run dev
   \`\`\`

3. **Open in browser:**
   Go to \`http://localhost:5173\`.

---

## 📱 How to Install on Your Devices (PWA)

### Android Phone (Chrome)
1. Open the app URL in Google Chrome on your Android phone.
2. Tap the **three dots menu (⋮)** in the top right corner.
3. Tap **"Install app"** or **"Add to Home screen"**.
4. The app icon will appear directly on your home screen like a native Android app!

### Laptop / Desktop (Chrome or Edge)
1. Open the app URL in Chrome or Edge.
2. Click the **Install icon (⊕)** on the right side of the URL bar (or click "Install App" in the app header).
3. The app opens in its own clean window without browser tabs.

---

## 🔐 Supabase Cloud Sync & Invite-Only Security (Optional)

The application works 100% offline out-of-the-box using local storage. When you are ready to synchronize between your phone and laptop and enforce invite-only permissions:

1. Create a free project on [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in Supabase and run the schema provided in the app under **Settings -> "Copy PostgreSQL RLS Script"** (also located in `src/lib/supabase.ts`).
3. In the app, open **Settings**, paste your **Supabase URL** and **Anon Key**, and click **Save Settings**.
4. In **Manage Access**, invite the email addresses of your family or friends. Only those emails can authenticate and access the shared events.

