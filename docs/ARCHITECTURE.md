# 🏗️ Konnectika Architecture

## 📌 Overview
Konnectika is a creator-brand marketplace platform where brands create campaigns, creators apply, deals are accepted, content is delivered, engagement is verified, and creators are paid.

---

## ⚙️ Tech Stack
- Frontend: Next.js (React)
- Backend: Next.js API routes / Node.js
- Database: PostgreSQL
- ORM: Prisma
- Auth: Supabase Auth or NextAuth (TBD)

---

## 🧭 Main Modules

### 1. Authentication System
- Handles login/signup
- Supports role-based users (Creator, Brand, Admin)

---

### 2. Campaign System
- Brands create campaigns
- Campaigns are visible on `/discover`
- Each campaign has `/campaign/:id`

---

### 3. Application System
- Creators apply to campaigns
- Stored in Applications table
- Status flow: Pending → Accepted → Rejected

---

### 4. Deal & Execution Flow
- Brand accepts creator
- Agreement is formed
- Creator delivers content
- Brand verifies delivery

---

### 5. Payment System
- Payments triggered after verification
- Tracks status: Pending → Paid → Failed

---

## 🔁 Main Flow

1. User logs in (role-based)
2. Creator browses `/discover`
3. Opens campaign
4. Applies
5. Brand reviews application
6. Brand accepts creator
7. Creator delivers content
8. Brand verifies
9. Payment released

---

## 🔐 Rules
- Only brands can create campaigns
- Only creators can apply
- One application per campaign per creator
- Payment only after verification 