import React, { useState, useEffect } from "react";
import Modal from "./Modal";

export default function WinModal({ winSlots }) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const check = winSlots.current;
        if (!check) return;

        // open only if there's a win AND it was not already shown
        if (check.hasMatch && !check.alreadyShown) {
            const t = setTimeout(() => {
                setOpen(true);
                check.alreadyShown = true;  // ✅ mark as shown
            }, 2000);

            return () => clearTimeout(t);   // cleanup
        }
    }, [winSlots.current?.hasMatch]);  // triggers when new win appears

    return (
        <Modal
            open={open}
            onClose={() => setOpen(false)}
            bonus={winSlots.current?.bonus || 450}
        />
    );
}
