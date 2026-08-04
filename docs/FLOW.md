# 🔁 Konnectika User Flows

This document explains how users interact with Konnectika from login to payment completion, including role-based flows (Creator, Brand, Admin).

---

## 👤 1. Authentication Flow (All Users)

1. User opens app
2. User signs up or logs in
3. Auth system validates credentials (Supabase Auth / NextAuth)
4. Backend creates session token
5. User role is loaded (CREATOR | BRAND | ADMIN)
6. User is redirected based on role:
   - CREATOR → `/discover`
   - BRAND → `/brand/dashboard`
   - ADMIN → `/admin`

7. Session is stored in browser (cookies / local storage)
8. Protected routes check session + role before access

---

## 📢 2. Campaign Discovery Flow (Creator)

1. Creator logs in
2. Opens `/discover`
3. System fetches ACTIVE campaigns from database (Prisma)
4. Creator browses available campaigns
5. Creator clicks a campaign
6. Redirected to `/campaign/:id`
7. Campaign details + brand info are loaded

---

## 📝 3. Application Flow (Creator → Brand)

1. Creator clicks “Apply”
2. Application form opens
3. Creator writes proposal/message
4. System checks:
   - user is CREATOR
   - user has NOT applied before
5. Application is saved in `Application` table:
   - status = PENDING
6. Success confirmation is shown

---

## 🧑‍💼 4. Brand Campaign Management Flow

1. Brand logs in
2. Goes to `/brand/dashboard`
3. Brand sees all their campaigns
4. Brand opens a campaign
5. Brand views list of applications
6. For each application:
   - View creator profile
   - Accept or Reject application

7. If ACCEPTED:
   - Application status → ACCEPTED
   - Creator is assigned to campaign

---

## 🤝 5. Deal & Collaboration Flow

1. Brand accepts creator
2. System marks creator as “ASSIGNED”
3. Collaboration phase starts:
   - Creator produces content
   - Brand tracks progress
4. Creator submits content proof (links / images)

---

## 🔍 6. Content Verification Flow (Brand)

1. Creator submits content
2. Brand reviews submission
3. Brand can:
   - Approve ✔️
   - Request changes 🔁
4. If approved:
   - Campaign marked as READY_FOR_PAYMENT

---

## 💰 7. Payment Flow

1. Verified campaign triggers payment stage
2. System checks:
   - content approved
   - campaign completed
3. Payment record created in `Payment` table
4. Status:
   - PENDING → PROCESSING → PAID
5. Creator receives earnings update

---

## 🧑‍💼 8. Creator Dashboard Flow

1. Creator logs in
2. Opens dashboard
3. Views:
   - Applied campaigns
   - Accepted campaigns
   - Earnings
   - Submission status

---

## 🛡️ 9. Admin Flow

1. Admin logs in
2. Opens `/admin`
3. Views system overview:
   - Total users (Creators + Brands)
   - Campaigns
   - Payments
4. Can:
   - Suspend users
   - Review disputes
   - Monitor platform activity

---

## 🔐 10. Security & Access Rules

- Only CREATOR can apply
- Only BRAND can create campaigns
- Only assigned creators can submit content
- Only BRAND can approve content
- Only ADMIN can override system actions

---

## 🧠 System Notes

- Campaign lifecycle:
  `ACTIVE → IN_PROGRESS → UNDER_REVIEW → COMPLETED`

- Application lifecycle:
  `PENDING → ACCEPTED → REJECTED`

- Payment lifecycle:
  `PENDING → APPROVED → PAID`

---

## 🚀 Summary

Konnectika is not just an application system anymore — it is a **full lifecycle marketplace platform connecting creators and brands through structured campaigns, execution, and payments.**