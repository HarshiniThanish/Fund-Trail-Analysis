Fund Trail Analysis

A web-based investigation tool built for the Tamil Nadu Police – Cyber Crime Wing to help officers trace the flow of disputed funds across multiple bank accounts in cyber-fraud cases. Investigators upload a bank-provided transaction spreadsheet and the system reconstructs the money trail as an interactive, multi-layer graph — making it easy to spot where funds moved, where they were withdrawn, and where they were frozen.

Overview

When a cyber-fraud complaint is filed, banks typically respond with raw transaction data spread across multiple sheets (transfers, ATM withdrawals, cheque withdrawals, holds). Piecing this together manually to trace how money moved from the victim's account through a chain of mule accounts is slow and error-prone.

Fund Trail Analysis automates this by:

Ingesting a multi-sheet Excel file per complaint (acknowledgement number)
Normalizing and linking transaction, ATM, cheque, and hold data by account number
Rendering the fund flow as an interactive, zoomable tree/graph, layer by layer
Letting officers drill into any node for full transaction detail, bank/IFSC lookup, and KYC information
Features
Role-based login — separate Admin and Investigative Officer roles
Excel ingestion — upload a .xlsx file with sheets for money transfers, ATM withdrawals, cheque withdrawals, and transactions put on hold; data is parsed, cleaned, and normalized automatically
Interactive fund-flow graph — D3.js-powered, zoomable hierarchy tree showing the trail of funds across layers (originating account → intermediate mule accounts → final withdrawal points)
Layer-wise color coding — each hop in the money trail is color-coded for quick visual scanning
Detail panels — click any account/node to see transaction amount, disputed amount, bank name, IFSC code, transaction ID, and action taken by the bank
ATM / cheque / hold linkage — automatically matches ATM withdrawal, cheque withdrawal, and "put on hold" records to the corresponding account in the trail
Live IFSC/bank lookup — fetches branch details for a given IFSC code via the Razorpay IFSC API
KYC capture — officers can attach KYC details (name, Aadhaar, mobile, address) to any account node in the trail
Complaint tracking view — lists complaints with acknowledgement number, victim name, date, and status
Tech Stack
Layer	Technology
Backend	Python, Flask
Database / ORM	SQLite, Flask-SQLAlchemy
Data processing	Pandas, openpyxl
Frontend	HTML, CSS, Jinja2 templates
Visualization	D3.js (zoomable tree/hierarchy graph)
External API	Razorpay IFSC API (bank/branch lookup)
Project Structure
backup/
├── app.py                  # Flask app: routes, Excel ingestion, graph data API
├── models.py                # SQLAlchemy Transaction model
├── setup.sql                 # DB setup reference
├── static/
│   ├── style.css
│   ├── graph.js             # D3 tree rendering, zoom/pan, detail panels
│   └── tn_police_logo.png
├── templates/
│   ├── login.html           # Role-based login
│   ├── index.html           # Dashboard / Excel upload
│   ├── graph_tree.html      # Fund-trail graph view
│   └── complaint.html       # Complaint tracking list
└── uploads/                  # Uploaded Excel files land here
Getting Started
Prerequisites
Python 3.8+
pip
Installation
bash
git clone https://github.com/HarshiniThanish/Fund-Trail-Analysis.git
cd Fund-Trail-Analysis/backup

pip install flask flask_sqlalchemy pandas openpyxl
Run the app
bash
python app.py

The app starts at http://127.0.0.1:5000/ and redirects to the login page. A SQLite database (fundtrail.db) is created automatically on first run.

Demo credentials
Username	Password	Role
admin	admin123	Admin
officer	Officer123	Investigative Officer

These are hardcoded demo credentials for local testing only — see Security Notes below before using this beyond a demo environment.

Usage
Log in with a role (Admin / Investigative Officer).
From the dashboard, upload the bank's transaction Excel file for a case. The workbook is expected to contain:
Money Transfer to (required) — core transaction records with Layer, From Account, To Account, Acknowledgement No., Bank/FIs, Ifsc Code, Transaction Date, Transaction Id / UTR Number, Transaction Amount, Disputed Amount, Action Taken By bank
Withdrawal through ATM (optional) — ATM withdrawal records
Cash Withdrawal through Cheque (optional) — cheque withdrawal records
Transaction put on hold (optional) — frozen/held transaction records
Enter the case's acknowledgement number to view its fund-trail graph.
Explore the tree: zoom/pan, click any node to see full transaction detail, linked ATM/cheque/hold info, and attach KYC data where available.
Security Notes

This was built as an internship prototype and has a few things you'd want to change before any real deployment:

Replace hardcoded demo users with a proper authentication system (hashed passwords, a real user store)
Move the Flask secret_key out of source code and into an environment variable
Add input validation and access control on the /graph_data and /save_kyc API routes
Store uploaded case data (PII, financial data) with encryption at rest given the sensitivity of the information involved
Future Improvements
Automated anomaly flagging (e.g., unusually fast layering, circular transaction patterns)
Export fund-trail graphs and case summaries as PDF reports
Multi-case dashboard with search/filter across acknowledgement numbers
Migrate from SQLite to a production-grade database for multi-user concurrent access
Author

Harshini T — Built during an internship with the Tamil Nadu Police Cyber Crime Wing. github.com/HarshiniThanish
