from flask import Flask, render_template, request, redirect, session, url_for, flash, send_file, jsonify
from werkzeug.utils import secure_filename
from flask_sqlalchemy import SQLAlchemy
import os
import pandas as pd

app = Flask(__name__)
app.secret_key = 'your-secret-key'

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///fundtrail.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db = SQLAlchemy(app)

USERS = {
    'admin': {'password': 'admin123', 'role': 'Admin'},
    'officer': {'password': 'Officer123', 'role': 'Investigative Officer'}
}

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    layer = db.Column(db.Integer)
    from_account = db.Column(db.String(100))
    to_account = db.Column(db.String(100))
    ack_no = db.Column(db.String(100))
    bank_name = db.Column(db.String(100))
    ifsc_code = db.Column(db.String(20))
    txn_date = db.Column(db.String(50))
    txn_id = db.Column(db.String(100))
    amount = db.Column(db.Float)
    disputed_amount = db.Column(db.Float)
    action_taken = db.Column(db.String(200))
    atm_id = db.Column(db.String(100))
    atm_withdraw_amount = db.Column(db.Float)
    atm_withdraw_date = db.Column(db.String(100))
    cheque_no = db.Column(db.String(100))
    cheque_withdraw_amount = db.Column(db.Float)
    cheque_withdraw_date = db.Column(db.String(100))
    cheque_ifsc = db.Column(db.String(50))
    put_on_hold_txn_id = db.Column(db.String(100))
    put_on_hold_date = db.Column(db.String(100))
    put_on_hold_amount = db.Column(db.Float)

@app.route('/')
def home():
    return redirect('/login')

@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        role = request.form['role']

        user = USERS.get(username)
        if user and user['password'] == password and user['role'] == role:
            session['username'] = username
            session['role'] = role
            return redirect('/index')
        else:
            error = "Invalid credentials or role"
    return render_template('login.html', error=error)

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/login')

@app.route('/index')
def index():
    if 'username' not in session:
        return redirect('/login')
    return render_template('index.html')

@app.route('/upload_excel', methods=['POST'])
def upload_excel():
    if 'username' not in session:
        return redirect('/login')

    file = request.files['excel_file']
    if file and file.filename.endswith('.xlsx'):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        try:
            xls = pd.ExcelFile(filepath)

            tx_df = pd.read_excel(xls, sheet_name='Money Transfer to')

            atm_df = pd.read_excel(xls, sheet_name='Withdrawal through ATM') if 'Withdrawal through ATM' in xls.sheet_names else pd.DataFrame()
            chq_df = pd.read_excel(xls, sheet_name='Cash Withdrawal through Cheque') if 'Cash Withdrawal through Cheque' in xls.sheet_names else pd.DataFrame()
            hold_df = pd.read_excel(xls, sheet_name='Transaction put on hold') if 'Transaction put on hold' in xls.sheet_names else pd.DataFrame()

            def normalize_columns(df):
                return [str(c).encode('ascii', 'ignore').decode().strip().replace('\u00A0', ' ').replace('\xa0', ' ') for c in df.columns]

            if not atm_df.empty: atm_df.columns = normalize_columns(atm_df)
            if not chq_df.empty: chq_df.columns = normalize_columns(chq_df)
            if not hold_df.empty: hold_df.columns = normalize_columns(hold_df)

            def clean_amount(value):
                if pd.isna(value): return 0.0
                try: return float(str(value).replace(',', '').strip())
                except: return 0.0

            for _, row in tx_df.iterrows():
                acc_to = str(row.get('To Account', '')).strip()

                atm_info = atm_df[atm_df['Account No./ (Wallet /PG/PA) Id'].astype(str).str.strip() == acc_to] if not atm_df.empty else pd.DataFrame()
                chq_info = chq_df[chq_df['Account No./ (Wallet /PG/PA) Id'].astype(str).str.strip() == acc_to] if not chq_df.empty else pd.DataFrame()
                hold_info = hold_df[hold_df['Account No./ (Wallet /PG/PA) Id'].astype(str).str.strip() == acc_to] if not hold_df.empty else pd.DataFrame()

                transaction = Transaction(
                    layer=int(row.get('Layer', 0)),
                    from_account=str(row.get('From Account', '')).strip(),
                    to_account=acc_to,
                    ack_no=str(row.get('Acknowledgement No.', '')).strip(),
                    bank_name=str(row.get('Bank/FIs', '')).strip(),
                    ifsc_code=str(row.get('Ifsc Code', '')).strip(),
                    txn_date=str(row.get('Transaction Date', '')).strip(),
                    txn_id=str(row.get('Transaction Id / UTR Number', '')).strip(),
                    amount=clean_amount(row.get('Transaction Amount')),
                    disputed_amount=clean_amount(row.get('Disputed Amount')),
                    action_taken=str(row.get('Action Taken By bank', '')).strip(),
                    atm_id=str(atm_info.iloc[0]['ATM ID']) if not atm_info.empty else None,
                    atm_withdraw_amount=clean_amount(atm_info.iloc[0]['Withdrawal Amount']) if not atm_info.empty else None,
                    atm_withdraw_date=str(atm_info.iloc[0]['Withdrawal Date & Time']) if not atm_info.empty else None,
                    cheque_no=str(chq_info.iloc[0]['Cheque No']) if not chq_info.empty else None,
                    cheque_withdraw_amount=clean_amount(chq_info.iloc[0]['Withdrawal Amount']) if not chq_info.empty else None,
                    cheque_withdraw_date=str(chq_info.iloc[0]['Withdrawal Date & Time']) if not chq_info.empty else None,
                    cheque_ifsc=str(chq_info.iloc[0]['Ifsc Code']) if not chq_info.empty else None,
                    put_on_hold_txn_id=str(hold_info.iloc[0]['Transaction Id / UTR Number']) if not hold_info.empty else None,
                    put_on_hold_date=str(hold_info.iloc[0]['Put on hold Date']) if not hold_info.empty else None,
                    put_on_hold_amount=clean_amount(hold_info.iloc[0]['Put on hold Amount']) if not hold_info.empty else None
                )
                db.session.add(transaction)

            db.session.commit()
            flash("Excel uploaded and data saved successfully.", "success")
        except Exception as e:
            flash(f"Failed to process Excel: {e}", "danger")
    else:
        flash("Invalid file format. Please upload a .xlsx file.", "warning")

    return redirect('/index')

@app.route('/view_graph')
def view_graph():
    ack_no = request.args.get('ack_no')
    return redirect(url_for('graph_tree', ack_no=ack_no))

@app.route('/graph/<ack_no>')
def graph_tree(ack_no):
    return render_template('graph_tree.html', ack_no=ack_no)

@app.route('/complaints')
def complaints():
    if 'username' not in session:
        return redirect('/login')

    dummy_complaints = [
        {'ack_no': 'ACK123', 'victim_name': 'John Doe', 'date': '2024-12-10', 'status': 'Under Review'},
        {'ack_no': 'ACK456', 'victim_name': 'Jane Smith', 'date': '2024-12-11', 'status': 'Resolved'},
    ]
    return render_template('complaint.html', complaints=dummy_complaints)

@app.route('/graph_data/<ack_no>')
def graph_data(ack_no):
    transactions = Transaction.query.filter_by(ack_no=ack_no).all()
    from_layer_map = {t.from_account: t.layer for t in transactions if t.from_account}

    def build_hierarchy(rows):
        root = {'name': 'Flow', 'children': []}
        def find_node(n, target):
            if n['name'] == target:
                return n
            for c in n.get('children', []):
                found = find_node(c, target)
                if found:
                    return found
            return None

        for t in rows:
            if t.layer == 1:
                parent = next((c for c in root['children'] if c['name'] == t.from_account), None)
                if not parent:
                    parent = {'name': t.from_account, 'children': []}
                    root['children'].append(parent)
            else:
                parent = find_node(root, t.from_account)

            if parent:
                existing = next((c for c in parent['children'] if c['name'] == t.to_account), None)
                if not existing:
                    child = {
                        'name': t.to_account,
                        'children': [],
                        'layer': from_layer_map.get(t.to_account, t.layer),
                        'ack': t.ack_no,
                        'bank': t.bank_name,
                        'ifsc': t.ifsc_code,
                        'date': t.txn_date,
                        'txid': t.txn_id,
                        'amt': str(t.amount),
                        'disputed': str(t.disputed_amount),
                        'action': t.action_taken,
                        'atm_info': {
                            'atm_id': t.atm_id,
                            'amount': t.atm_withdraw_amount,
                            'date': t.atm_withdraw_date
                        } if t.atm_id else None,
                        'cheque_info': {
                            'cheque_no': t.cheque_no,
                            'amount': t.cheque_withdraw_amount,
                            'date': t.cheque_withdraw_date,
                            'ifsc': t.cheque_ifsc
                        } if t.cheque_no else None,
                        'hold_info': {
                            'txn_id': t.put_on_hold_txn_id,
                            'amount': t.put_on_hold_amount,
                            'date': t.put_on_hold_date
                        } if t.put_on_hold_txn_id else None
                    }
                    parent['children'].append(child)

        return root

    if not transactions:
        return jsonify({'error': 'No data found'}), 404

    return jsonify(build_hierarchy(transactions))

@app.route('/save_kyc', methods=['POST'])
def save_kyc():
    data = request.json
    ack = data.get('ack')
    account = data.get('account')

    txn = Transaction.query.filter_by(ack_no=ack, to_account=account).first()
    if txn:
        txn.kyc_name = data.get('kyc_name')
        txn.kyc_aadhar = data.get('kyc_aadhar')
        txn.kyc_mobile = data.get('kyc_mobile')
        txn.kyc_address = data.get('kyc_address')
        db.session.commit()
        return jsonify({'status': 'success'})
    return jsonify({'status': 'error', 'message': 'Transaction not found'}), 404


with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)
