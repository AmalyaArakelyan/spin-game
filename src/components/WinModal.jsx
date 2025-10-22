import React from "react";
import Modal from "./Modal";

export default function WinModal({ winSlots, showModal, onClose }) {

    return (
        <Modal
            open={showModal}
            onClose={onClose}
            bonus={winSlots.current?.bonus || 450}
        />
    );
}
