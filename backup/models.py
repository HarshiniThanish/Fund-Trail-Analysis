from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    layer = db.Column(db.Integer)
    from_account = db.Column(db.String(100))
    to_account = db.Column(db.String(100))
    ack_no = db.Column(db.String(100))
    bank_name = db.Column(db.String(100))
    ifsc_code = db.Column(db.String(50))
    txn_date = db.Column(db.String(100))
    txn_id = db.Column(db.String(100))
    amount = db.Column(db.Float)
    disputed_amount = db.Column(db.Float)
    action_taken = db.Column(db.String(255))

    # New fields for ATM withdrawal
    atm_id = db.Column(db.String(100))
    atm_withdraw_amount = db.Column(db.Float)
    atm_withdraw_date = db.Column(db.String(100))

    # New fields for Cheque withdrawal
    cheque_no = db.Column(db.String(100))
    cheque_withdraw_amount = db.Column(db.Float)
    cheque_withdraw_date = db.Column(db.String(100))
    cheque_ifsc = db.Column(db.String(50))

    put_on_hold_txn_id = db.Column(db.String(100))
    put_on_hold_date = db.Column(db.String(100))
    put_on_hold_amount = db.Column(db.Float)

# Add to Transaction model in models.py or wherever your SQLAlchemy models are defined
    kyc_name = db.Column(db.String(120))
    kyc_aadhar = db.Column(db.String(20))
    kyc_mobile = db.Column(db.String(20))
    kyc_address = db.Column(db.String(200))

