import React from "react";
import  'assets/css/modal.scss';
function Modal({ open, onClose, children, bonus=450 }) {
    if (!open) return null;
    return (
        <div className="overlay" >
            <div className="modal-ontent" >
                <h1 className="name">BET<span>AND</span>YOU</h1>

                <div className="modal-content">
                    <h2>you win!</h2>
                    <p>{bonus}%</p>
                    <span>Deposit bonus</span>
                    {children}
                </div>
                <button className="modal_button" onClick={onClose} >Claim now</button>
            </div>
        </div>
    );
}
export default Modal;
