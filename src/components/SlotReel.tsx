import React, { useEffect, useRef, useState, useMemo } from "react";

// @ts-ignore
import hv1 from 'assets/img/symbols/gool_hv1.png';
import hv2 from    "assets/img/symbols/gool_hv_2.png";
import hv3 from   "assets/img/symbols/gool_hv3.png";
import hv4 from   "assets/img/symbols/gool_hv4.png";
import lv1 from   "assets/img/symbols/gool_lv_1_orange.png";
import lv2 from      "assets/img/symbols/gool_lv_2_purple.png";
import lv3 from      "assets/img/symbols/gool_lv_3_yellow.png";
import lv4 from      "assets/img/symbols/gool_lv_4_green.png";
import lv5 from      "assets/img/symbols/gool_lv_5_blue.png";
import wild from      "assets/img/symbols/gool_wild_win.png";
import CANVAS_BACKGROUND_URL from      "assets/img/Reel_Base.png";
import CANVAS_BACKGROUND_FRAME from      "assets/img/Reel_Frame.png";

import SpinButton from "./SpinButton";
import WinModal from "./WinModal";

    export default function SlotMachineCanvas({
          reelsCount = 6,
          symbolsCount = 10,
          symbolSize = 57, // px (height of one symbol)
          visibleSymbols = 4, // how many symbols visible per reel
          bonus = 100, // bonus per matched symbol
          spacing = 0,
      }) {
        const canvasRef = useRef(null);
        const rafRef = useRef(null);
        const reelsSymbols = useRef(null);
        const winSlots = useRef();
        const stopSpinTimeout = useRef(null);

        const [isSpinning, setIsSpinning] = useState(false);
        const [isStopping, setIsStopping] = useState(false);

        const bgImg = useMemo(() => {
            const img = new Image();
            img.src = CANVAS_BACKGROUND_URL;
            return img;
        }, []);

        const bgImgFrame = useMemo(() => {
            const img = new Image();
            img.src = CANVAS_BACKGROUND_FRAME;
            return img;
        }, []);

        const BG_IMAGE = useRef({bgImg, bgImgFrame}).current;

        // load image symbols (replace with your actual asset paths)
        const SYMBOLS = useRef([
            hv1,
            hv2,
            hv3,
            hv4,
            lv1,
            lv2,
            lv3,
            lv4,
            lv5,
            wild,
        ].map((src, id) => {
            const img = new Image();
            img.src = src;
            img.className = "h-10 w-10";

            return {id, img, name: src.split("/").pop().split(".")[0]};
        })).current;

        function initialSymbols( ){

            reelsSymbols.current =  reelsSymbols.current || [];

            const newReelsSymbols = reelsSymbols.current;

            for (let r = 0; r < reelsCount; r++) {
                newReelsSymbols[r] = newReelsSymbols[r] || [];
                for (let i = 0; i < SYMBOLS.length; i++) {

                    newReelsSymbols[r][i] = newReelsSymbols[r][i] ||
                        {
                            id:"i" + r + i,
                           symbol: SYMBOLS[randIndex()]
                        };
                }
            }
        }
        function getVisibleMatrix() {
            const matrix = [];
            const totalH = symbolSize * symbolsCount + 10;

            for (let r = 0; r < reelsCount; r++) {
                const reel = reels.current[r];
                let offset = ((reel.offset % totalH) + totalH) % totalH;
                const startIndex = Math.floor(offset / symbolSize);

                const reelColumn = [];

                for (let row = 0; row < visibleSymbols; row++) {
                    const idx = (startIndex + row) % symbolsCount;
                    reelColumn.push(reelsSymbols.current[r][idx]); // full symbol object
                }
                matrix.push(reelColumn); // column-major
            }
            return matrix; // matrix[reel][row]
        }

        function getMergedMatches() {
            const matrix = getVisibleMatrix(); // column-major [reel][row]
            const cols = matrix.length;
            const rows = matrix[0].length;

            const visited = Array.from({ length: cols }, () => Array(rows).fill(false));
            const matches = [];
            let totalBonus = 0;

            const directions = [
                [1, 0],   // right (next reel)
                [-1, 0],  // left (previous reel)
                [0, 1],   // down (next row)
                [0, -1],  // up (previous row)
            ];
            function dfs(c, r, symbolId, positions) {
                if (r < 0 || r >= rows || c < 0 || c >= cols) return;
                if (visited[c][r]) return;
                if (matrix[c][r].symbol.id !== symbolId) return;

                visited[c][r] = true;
                positions.push({ c, r, id: matrix[c][r].id });

                for (const [dc, dr] of directions) {
                    dfs(c + dc, r + dr, symbolId, positions);
                }
            }

            for (let c = 0; c < cols; c++) {
                for (let r = 0; r < rows; r++) {
                    if (!visited[c][r]) {
                        const symbolId = matrix[c][r].symbol.id;
                        const positions = [];
                        dfs(c, r, symbolId, positions);
                        if (positions.length >= 2) {
                            matches.push({ symbolId, positions });
                            totalBonus += positions.length  * bonus; // example bonus calculation
                        }
                    }
                }
            }

            return {
                hasMatch: matches.length > 0,
                matches,
                matrix,
                alreadyShown: false,
                bonus: totalBonus
            };
        }
        function roundRectPath(ctx, x, y, w, h, r) {
            const radius = typeof r === "number" ? r : 0;
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + w - radius, y);
            ctx.arcTo(x + w, y, x + w, y + radius, radius);
            ctx.lineTo(x + w, y + h - radius);
            ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
            ctx.lineTo(x + radius, y + h);
            ctx.arcTo(x, y + h, x, y + h - radius, radius);
            ctx.lineTo(x, y + radius);
            ctx.arcTo(x, y, x + radius, y, radius);
            ctx.closePath();
        }

        const reels = useRef(
            Array.from({ length: reelsCount }).map(() => ({
                offset: 0,
                velocity: 10,
                targetIndex: 0,
                stopping: false,
            }))
        );

        // helper: pick a random index
        const randIndex = () => Math.floor(Math.random() * symbolsCount);

        // resize canvas to device pixel ratio
        function resizeCanvasToDisplaySize(canvas, width, height) {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            const ctx = canvas.getContext("2d");
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function drawSymbol(ctx, x, y, w, h, img) {
            ctx.strokeStyle = "rgba(255,255,255,0.06)";
            ctx.lineWidth = 1;
            // draw tile background border
            roundRectPath(ctx, x + 2, y + 2, w, w, 6);
            if (img && img.complete) {
                const pad = Math.floor(h * 0.1);
                ctx.drawImage(img, x + pad, y + pad, w - pad * 2, w - pad * 2);
            }
        }

        function draw() {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            const width = canvas.clientWidth;
            const height = canvas.clientHeight;
            const REEL_AREA = {
                x: 8,
                // center vertically inside canvas: compute top so the reel window is centered
                y: 9,
                width: Math.max(100, width -20 ), // ensure some minimal width
                height: symbolSize * visibleSymbols + 10,
                radius: 14,
            };
            resizeCanvasToDisplaySize(canvas, width, height);

            ctx.clearRect(0, 0, width, height);

            const {bgImg, bgImgFrame} = BG_IMAGE;

            // draw background
            if (bgImg?.complete && bgImgFrame?.complete) {
                ctx.drawImage(bgImg, 0,70, canvas.width*4 , canvas.height*4, 0, 0, canvas.width , canvas.height);
            } else {
                ctx.fillRect(0, 0, width, height);
                ctx.fillStyle = "#3a193c";
            }


            const reelWidth = (REEL_AREA.width - spacing * (reelsCount - 1)) / reelsCount;
            const symH = symbolSize;

            // draw each reel
            for (let r = 0; r < reelsCount; r++) {
                const reel = reels.current[r];
                const x = REEL_AREA.x + r * (reelWidth + spacing);
                const reelTop = REEL_AREA.y;

                // Clip to rounded rect for this reel
                ctx.save();
                roundRectPath(ctx, x, reelTop, reelWidth, REEL_AREA.height, Math.max(6, REEL_AREA.radius - 6));
                ctx.clip();

                // compute current offset, wrap-around using modulo
                const totalHeight = symH * symbolsCount;
                let offset = reel.offset % totalHeight;
                if (offset < 0) offset += totalHeight;

                // draw enough symbols to cover area + one extra
                // const startIndex = Math.floor(offset / symH);
                const startY = reelTop - (offset % symH);

                // const centerIndex = Math.floor((offset - symbolSize * (visibleSymbols / 2)) / symbolSize) % symbolsCount;

                const reelSymbols = reelsSymbols.current[r]
                for (let i = 0; i < visibleSymbols + 2; i++) {
                    // offset in pixels for this slot
                    const pos = (reel.offset + i * symH) % (symH * symbolsCount);
                    let idx = Math.floor(pos / symH) % symbolsCount;

                    if (idx < 0){
                        idx += symbolsCount;
                    }
                    if(idx === -0){
                        idx = 0
                    }

                    const y = startY + i * symH;

                    // highlight winning symbols
                    const currentWin = winSlots.current;
                    let symbolGap = 0

                    if(currentWin?.hasMatch){
                        currentWin.matches.forEach(match => {
                            match.positions.forEach(pos => {

                                if (pos.id === reelSymbols[idx].id) {
                                    // highlight this symbol
                                    // ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
                                    // ctx.fillRect(x , y , reelWidth , symH );
                                    symbolGap+=20
                                }
                            });
                        });
                    }
                    drawSymbol(ctx, x - symbolGap/2 , y - symbolGap/2, reelWidth + symbolGap , symH + symbolGap  , reelSymbols[idx].symbol.img);
                }
                ctx.restore();

            // reel separator
            if(r!= 0) {
                ctx.beginPath();
                ctx.strokeStyle = "#a7a64d"; // left color (your original)
                ctx.lineWidth = 1;
                ctx.moveTo(x + 1, reelTop + 1);
                ctx.lineTo(x + 1, reelTop + symH * visibleSymbols +10);
                ctx.stroke();
                }
            }

            // reel frame overlay
            if (bgImgFrame?.complete) {
                ctx.drawImage(bgImgFrame, 0,70, canvas.width*4 , canvas.height*4, 0, 0, canvas.width , canvas.height);
            } else {
                ctx.save();
                ctx.globalAlpha = 0.06;
                ctx.fillRect(0, 0, width, height);
                ctx.restore();
            }
        }
        //  preload images and initial draw
        useEffect(() => {
            initialSymbols()
            draw();

            let loaded = 0;

            const total = SYMBOLS.length + 2; // +2 for bg and bgFrame
            const done = () => {
                loaded++;
                if (loaded === total) {
                    draw();
                }
            };

            // background images
            BG_IMAGE.bgImg.onload = done;
            BG_IMAGE.bgImgFrame.onload = done;

            // symbol images
            SYMBOLS.forEach(sym => {
                if (sym.img.complete) {
                    done();
                } else {
                    sym.img.onload = done;
                }
            });
        }, []);

        // main draw loop
        useEffect(() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            function step(dt) {
                // dt in seconds
                for (let r = 0; r < reelsCount; r++) {
                    const reel = reels.current[r];
                    // basic integration
                    reel.offset -= reel.velocity * dt;

                    if (reel.stopping) {
                        // slow down gently and snap to target
                        const totalH = symbolSize * symbolsCount;
                        // compute distance to target index (in pixels) for the current rotation cycle
                        const currentPos = ((reel.offset % totalH) + totalH) % totalH;
                        const targetPos = (reel.targetIndex * symbolSize) % totalH;
                        // shortest distance (allow wrap)
                        let diff = targetPos - currentPos;
                        if (diff > totalH / 2) diff -= totalH;
                        if (diff < -totalH / 2) diff += totalH;

                        // spring-like deceleration
                        const spring = 6; // stiffness
                        const damping = 6; // damping
                        const accel = diff * spring - reel.velocity * damping;
                        reel.velocity += accel * dt;

                        // if velocity and diff small, lock to target and mark stopped
                        if (Math.abs(reel.velocity) < 6 && Math.abs(diff) < 2) {
                                reel.offset = reel.offset - reel.offset%57;
                                reel.velocity = 0;
                                reel.stopping = false;
                                reel.stopped = true;
                        }
                    } else if (isSpinning) {
                        // keep spinning: small friction
                        reel.velocity *= 0.995;
                    } else {
                        // idle friction to zero
                        reel.velocity *= 0.92;
                        if (Math.abs(reel.velocity) < 0.5) reel.velocity = 0;
                    }
                }
            }

            let last = performance.now();

            function loop(now) {
                if(isSpinning) {
                    const dt = Math.min(0.05, (now - last) / 1000);
                    last = now;
                    step(dt);
                    draw();
                    rafRef.current = requestAnimationFrame(loop);
                }
            }

            if(isSpinning) {
                rafRef.current = requestAnimationFrame(loop);
            }

            return () => cancelAnimationFrame(rafRef.current);
        }, [reelsCount, symbolsCount, symbolSize, visibleSymbols, isSpinning]);

        // Start spinning: set random velocities
        function startSpin() {
            // initialize reels
            winSlots.current = null;
            for (let r = 0; r < reelsCount; r++) {
                const reel = reels.current[r];
                reel.offset = Math.random() * symbolSize * symbolsCount;
                // velocity px/sec (randomized)
                reel.velocity = 400 + Math.random() * 500 + r * 100;
                reel.stopping = false;
                reel.stopped = false;
            }
            setIsStopping(false);
            setIsSpinning(true);
        }

        // Stop with stagger: stop each reel to random target index
        function stopSpin() {
            // if (!isSpinning) return;

            setIsStopping(true);
            // schedule stops staggered
            const baseDelay = 400; // ms between reel stops

            for (let r = 0; r < reelsCount; r++) {
                const reel = reels.current[r];
                const chosen = randIndex();
                setTimeout(() => {
                    reel.targetIndex = chosen;
                    reel.stopping = true;
                }, r * baseDelay);
            }

            // after all reels likely stopped, clear spinning flag
            setTimeout(() => {
                setIsSpinning(false);
                setIsStopping(false);
                winSlots.current = getMergedMatches()
                draw();
                console.log('winSlots.current', winSlots.current)
                console.log(reelsSymbols.current, 'reelsSymbols.current')
                console.log("reels.currents",reels.current)
            }, reelsCount * baseDelay + 3000);

            setTimeout(() => {
                draw();
            }   , (reelsCount + 1) * baseDelay + 4000);
        }

        // Quick spin (start then auto-stop after duration)
        function quickSpin() {
            stopSpinTimeout.current && clearTimeout(stopSpinTimeout.current);
            winSlots.current = null;
            startSpin();
            stopSpinTimeout.current =  setTimeout(() => { stopSpin()}, 3000);
        }

        // initial canvas size
        const canvasStyle = { width: "100%", height: `${symbolSize * visibleSymbols + 40}px`, borderRadius: "12px" };

        return (
            <div className="canvas-wrapper">
                <canvas ref={canvasRef} style={canvasStyle} />
                <SpinButton onClick={quickSpin} />

                <WinModal winSlots={winSlots}/>
            </div>
        );
    }
