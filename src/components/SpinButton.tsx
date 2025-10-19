import React from "react";
import SpinButtonImage from 'assets/img/SpinButton.png';

function SpinButton() {
  return <button className="spin-button">
          <img className="button-image" src={SpinButtonImage} alt="spin button"></img>
      </button>;


}
export default SpinButton;
