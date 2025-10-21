import React from "react";
import SpinButtonImage from 'assets/img/SpinButton.png';

function SpinButton({
                        onClick,
                        disabled = false,
                        className = "",
                        image = SpinButtonImage,
                        alt = "spin button",
                    }) {
    return (
        <button
            className={`spin-button ${className}`}
            onClick={onClick}
            disabled={disabled}
        >
            <img className="button-image" src={image} alt={alt} />
        </button>
    );
}

export default SpinButton;
