import React from 'react';
import Container from "./Container";
import '../assets/css/spinGame.scss';
import SpinButton from "./SpinButton";
import SlotReel from "./SlotReel";
function SpinGame() {
  return <Container >
      <div className="spin-game">
        <h2 className="title">Spin to get a bonus</h2>
<SlotReel/>
          <SpinButton />
      </div>
  </Container>;
}
export default SpinGame;
