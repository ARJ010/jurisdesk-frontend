# JurisDesk – Bar Association Management System

JurisDesk is a premium React, Vite, and TypeScript application designed to orchestrate Bar Association operations, member registrations, outstanding subscriber dues, treasury registry collections, and self-service advocate workflows.

---

## 🌟 Overview

JurisDesk provides association administrators and office staff with a centralized dashboard to register advocates, manage arrears, issue official printed receipt vouchers, and review bookkeeping records in real-time. It also provides self-service portals for advocate members to manage their profiles, download eligibility certificates, submit payment verification requests, and track audit trails.

---

## 🛠 Tech Stack

* **Core Framework**: React 19 (Functional Components, Hooks)
* **Build System**: Vite 8 & TypeScript 6
* **Styling & Theme**: Tailwind CSS v4
* **Navigation Routing**: React Router v7
* **Analytics & Graphs**: Recharts (dynamic Area, Bar, and Pie charts)
* **Icons**: Lucide React
* **Data Storage**: Client-side version-controlled LocalStorage Mock Database with automated terminology schema migrations and pre-seeded demo records.

---

## 📐 Architecture

JurisDesk implements a clean, decoupled layer architecture:

1. **User Interface (View)**: Modular page components under `src/pages/` handle UI layout, event capturing, and formatting.
2. **Custom Hook Services (Controller/State)**: React state hooks (e.g., `usePaymentRequestService.ts` and `usePaymentService.ts`) under `src/hooks/` bridge components with business logic, handling state updates, synchronization, and local persistence.
3. **Pure Logic Services (Model/Engine)**: Core mathematical calculations, billing rule applications, and data validations live strictly as pure, framework-independent functions under `src/services/` to simplify future backend integration.
4. **Mock Database Context**: `MockDBContext.tsx` holds central state variables, coordinates reads/writes, manages terminology key migrations, and handles initialization.

---

## 📸 Screenshots

*Below are placeholders for the interface screenshots. Place your PNG/JPG image assets inside the `/screenshots` directory using the filenames below to render them natively on GitHub:*

#### Administrative Dashboard & Recharts Analytics
![Admin Dashboard](./screenshots/admin_dashboard.png)

#### Member Registry & Onboarding Wizard
![Advocate List & Wizard](./screenshots/advocate_registry.png)

#### Advocate Self-Service Payment Request Portal
![Advocate Portal](./screenshots/advocate_portal.png)

#### Receipt Voucher Reprint & Print Templates
![Official Receipt Voucher](./screenshots/receipt_print.png)

---

## ✨ Features Overview

### 1. Advocate Registry & Onboarding
* **Multi-Step Onboarding Wizard**: A 3-step form to register members with real-time validations.
* **Bulk CSV Import**: Drag-and-drop CSV importer with validation dry-runs and error reporting.
* **Advanced Search Index**: Search by name, enrolment number, KAWF number, address, blood group, internal notes, or active office position.

### 2. Dues & Subscription Billing Engine
* **Automated Generation**: Accrues monthly subscription fees and recurring billing rules dynamically.
* **Additional Fee Billing**: Flexible billing engine supporting rules for specific frequencies (`ONE_TIME`, `YEARLY`, `MONTHLY`, `QUARTERLY`, `MANUAL`) and applicability categories (`NEW_MEMBERS`, `ALL_ACTIVE_MEMBERS`, `CUSTOM`).
* **Ledger Immutability**: Billing rules updates never modify historical records, maintaining financial ledger integrity.

### 3. Payment Request & Verification Workflow
* **Self-Service Submissions**: Members can select outstanding dues, input reference numbers (UTR / Cheque No), upload proof attachments, and track review status.
* **Double Submission Guard**: Validates overlapping pending dues and reference numbers globally prior to request submission.
* **Admin Review & Adjustment**: Admins can override advocate selections, view a live reconciliation summary panel, and execute the checkout engine.
* **Audit Receipt Capturing**: Successfully approved requests capture the generated transaction ID and receipt number, creating a complete progress stepper (`Submitted` → `Approved` → `Receipt HBA-XXXX-XXXX`) with direct reprint links.

### 4. Unified Checkout Basket
* **Collection Operator Panel**: Allows staff to checkout selected outstanding arrears and advance prepayment months, apply waivers, choose payment modes (Cash, UPI, Cheque, Bank Transfer), and record references.
* **Reprintable Receipt Vouchers**: Official A4 printable receipt layout with double border design, watermark, and browser print overrides.

### 5. Office Positions & Terms History
* **Bear Priority Ordering**: Sorts committee positions by configured `display_order` priority globally across pages, dashboards, and certificates.
* **Historical Terms Logger**: Closing or updating active terms registers historical bearer logs. Prevents concurrent bearer assignments on single-person positions.
* **Experience Certificates**: Auto-validates active member status and ₹0 balance before rendering experiences credential sheets.

### 6. Treasury Registry
* **Bookkeeping adjustments**: Log CREDIT/DEBIT adjustments or cash/bank transfers.
* **Financial metrics**: Dynamic KPI cards displaying cash registers, UPI registers, and overall outstanding association balances.

### 7. Audit logs
* **Registry Changes Diffs**: Audits registry updates, generating detailed diffs for sensitive fields, and enforcing notes for rare modifications.

---

## 🚀 Installation & Running

### 1. Clone Project
```bash
git clone https://github.com/ARJ010/jurisdesk-frontend.git
cd jurisdesk-frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

---

## 🔑 Demo Credentials

To log in, use the following preset credentials (all passwords are `pass@123`):

* **Admin Advocate**: `admin` (Haridasan Nair - has full registry, settings, ledgers, and personal profile access)
* **Office Staff**: `staff` (Bindu Rajesh - registry operator access, no personal profile)
* **Advocate Member**: `K/876/2017` (Sandeep K. V. - self-service payments, requests, and certificate download portal)
* **Advocate Member**: `K/1092/2015` (Manoj Kumar - outstanding dues member, certificate blocked)

---

## 🗺 Future Backend Roadmap

Subsequent iterations will migrate the frontend services to interface directly with a Django REST Framework (DRF) backend:

* **Token Authentication**: Replace local session states with JWT authentication headers.
* **REST Services**: Transition mock hooks to issue Axios/Fetch calls to `/api/advocates/`, `/api/dues/`, `/api/payments/`, and `/api/treasury/`.
* **Database Persistence**: Drop LocalStorage managers and rely on Django models, migrations, and PostgreSQL storage.
* **Treasury Sessions Milestone**: 
  - *Opening and Closing Cash*: Force operators to declare cash drawer balances at the start and end of daily shifts.
  - *Daily Treasury Sessions*: Lock membership collection batches under individual, sequential treasury session IDs.
  - *Cash Reconciliation*: Require automated validation checks to flag discrepancies between drawer collection logs and actual bank deposits before closing daily sessions.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
