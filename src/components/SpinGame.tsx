import React from 'react';
import Container from "./Container";
import '../assets/css/spinGame.scss';
import SlotReel from "./SlotReel";
function SpinGame() {
  return <Container >
      <div className="spin-game">
        <h2 className="title">Spin to get a bonus</h2>
        <SlotReel/>
      </div>
  </Container>;
}
export default SpinGame;
