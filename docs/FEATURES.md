# ⚡ Konnectika Features

This document defines the core product features of Konnectika — a creator-brand campaign platform that connects creators with brands through structured campaigns, applications, execution, and payments.

---

## 🎯 1. Campaign Discovery System

### 📌 Description
Allows users (primarily creators) to browse and discover active campaigns created by brands.

### ⚙️ Behavior
- Fetches only campaigns with status: `ACTIVE`
- Displays campaign title, budget, and brief description
- Supports browsing and filtering (future enhancement)

### 🧭 Route
`/discover`

### 🔐 Access Rules
- Accessible to all authenticated users
- Guests redirected to login

---

## 📢 2. Campaign Details System

### 📌 Description
Displays full information about a selected campaign and enables application.

### ⚙️ Behavior
- Loads campaign by `campaign_id`
- Shows:
  - campaign description
  - brand information
  - budget
  - requirements
- Displays “Apply” button if user is eligible

### 🧭 Route
`/campaign/:id`

### 🔐 Rules
- Only logged-in users can view full details
- User must not already have applied

---

## 📝 3. Application System

### 📌 Description
Handles creator applications to campaigns.

### ⚙️ Behavior
- Creator submits a message/proposal
- System validates:
  - user role = CREATOR
  - no existing application for same campaign
- Creates record in `Application` table
- Sets status = `PENDING`

### 🔁 Lifecycle
`PENDING → ACCEPTED → REJECTED`

### 🔐 Rules
- Only creators can apply
- One application per campaign per creator

---

## 🧑‍💼 4. Creator Dashboard System

### 📌 Description
Dashboard for creators to manage their campaign participation.

### ⚙️ Features
- View applied campaigns
- View application status
- Track accepted campaigns
- View earnings (future feature)
- Submit content proof (future feature)

### 🔐 Rules
- Only users with role = CREATOR

---

## 🏢 5. Brand Dashboard System

### 📌 Description
Allows brands to manage campaigns and applications.

### ⚙️ Features
- Create campaigns
- View all created campaigns
- View applications per campaign
- Accept or reject creators
- Track campaign performance (future)

### 🔐 Rules
- Only users with role = BRAND

---

## 🔐 6. Authentication System

### 📌 Description
Handles user authentication and session management.

### ⚙️ Behavior
- Email login/signup
- Session persistence via cookies/local storage
- Role-based access control (RBAC)

### 🔁 Flow
- Login → Session created → Role loaded → Redirect based on role

### 🧭 Redirect Rules
- CREATOR → `/discover`
- BRAND → `/brand/dashboard`
- ADMIN → `/admin`

---

## 🛡️ 7. Access Control System

### 📌 Description
Ensures users can only perform actions allowed by their role.

### 🔐 Rules
- CREATOR:
  - can browse campaigns
  - can apply
- BRAND:
  - can create campaigns
  - can manage applications
- ADMIN:
  - full system access

---

## 🧪 8. Planned Features (Roadmap)

### 🚀 Messaging System
- Brand ↔ Creator communication after acceptance

### 🔔 Notifications System
- Application updates
- Campaign status updates

### 💰 Payment System
- Creator payouts after campaign completion

### 📊 Analytics Dashboard
- Campaign performance tracking
- Creator performance insights

---

## 🧠 Product Notes

- Campaigns are lifecycle-based: `ACTIVE → IN_PROGRESS → COMPLETED`
- Application is the core interaction unit
- Future system will expand into full marketplace (like Upwork for creators)