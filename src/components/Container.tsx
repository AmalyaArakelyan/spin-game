import React from 'react';
import '../assets/css/container.scss';


function Container({ children }: { children?: React.ReactNode }) {
  return <div className="container-wrapper">
    <div className="container mx-auto px-4">
          <h1 className="name">BET<span>AND</span>YOU</h1>
          <div className="character"></div>

          {children}

    </div>
  </div>;
}
export default Container;
