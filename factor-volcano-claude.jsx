import { useState, useCallback, useRef, useEffect } from "react";

// ==================== CONSTANTS ====================
const GAP = 3;
const BLOCK_H = 52;
const SCALE = 27;
const SVG_PAD = 12;
const OVERLAP_MIN = 2;
const WIN_ROW_DELAY = 600;

// ==================== PUZZLE DEFINITIONS ====================
const PUZZLES = [
  {
    name: "1",
    rows: [
      [
        { v: 2,  w: 1.6, sol: true  },
        { v: 3,  w: 1.8, sol: true  },
        { v: 5,  w: 1.8, sol: true  },
        { v: 7,  w: 1.7, sol: false },
        { v: 4,  w: 1.8, sol: false },
      ],
      [
        { v: 30, w: 8.0, sol: true },
      ],
    ],
  },
  {
    name: "2",
    rows: [
      [
        { v: 2,  w: 1.5, sol: true  },
        { v: 2,  w: 1.5, sol: true  },
        { v: 2,  w: 1.5, sol: true  },
        { v: 4,  w: 1.8, sol: false },
        { v: 4,  w: 1.8, sol: false },
        { v: 2,  w: 1.5, sol: false },
        { v: 2,  w: 1.5, sol: true  },
        { v: 4,  w: 1.8, sol: true  },
        { v: 3,  w: 1.7, sol: false },
      ],
      [
        { v: 8,  w: 4.6, sol: true  },
        { v: 16, w: 2.0, sol: false },
        { v: 4,  w: 2.0, sol: false },
        { v: 8,  w: 4.6, sol: true  },
      ],
      [
        { v: 64, w: 9.5, sol: true },
      ],
    ],
  },
  {
    name: "3",
    rows: [
      [
        { v: 4,  w: 1.6, sol: false },
        { v: 2,  w: 1.5, sol: true  },
        { v: 2,  w: 1.5, sol: true  },
        { v: 2,  w: 1.5, sol: true  },
        { v: 6,  w: 1.8, sol: false },
        { v: 3,  w: 1.8, sol: true  },
        { v: 5,  w: 1.8, sol: true  },
        { v: 5,  w: 2.0, sol: false },
        { v: 3,  w: 1.6, sol: false },
      ],
      [
        { v: 8,  w: 5.0, sol: true  },
        { v: 12, w: 2.4, sol: false },
        { v: 15, w: 3.2, sol: true  },
        { v: 10, w: 3.2, sol: false },
      ],
      [
        { v: 120, w: 9.5, sol: true },
      ],
    ],
  },
  {
    name: "4",
    rows: [
      [
        { v: 4, w: 2.2, sol: true  },
        { v: 2, w: 1.4, sol: true  },
        { v: 2, w: 1.4, sol: false },
        { v: 9, w: 1.7, sol: false },
        { v: 2, w: 1.6, sol: true  },
        { v: 2, w: 1.6, sol: false },
        { v: 1, w: 1.2, sol: true  },
        { v: 2, w: 1.4, sol: true  },
        { v: 3, w: 1.7, sol: false },
        { v: 2, w: 1.4, sol: true  },
        { v: 2, w: 1.4, sol: true  },
        { v: 2, w: 1.4, sol: true  },
      ],
      [
        { v: 8,  w: 2.2, sol: true  },
        { v: 8,  w: 2.0, sol: false },
        { v: 18, w: 2.4, sol: false },
        { v: 4,  w: 1.8, sol: true  },
        { v: 2,  w: 1.3, sol: false },
        { v: 2,  w: 1.3, sol: true  },
        { v: 4,  w: 1.8, sol: false },
        { v: 4,  w: 1.8, sol: true  },
        { v: 8,  w: 2.8, sol: true  },
      ],
      [
        { v: 64, w: 4.8, sol: true  },
        { v: 2,  w: 1.4, sol: false },
        { v: 8,  w: 2.4, sol: true  },
        { v: 16, w: 6.9, sol: true  },
      ],
      [
        { v: 128, w: 10, sol: true },
      ],
    ],
  },
  {
    name: "5",
    rows: [
      [
        { v: 5,  w: 1.8, sol: true  },
        { v: 5,  w: 1.8, sol: true  },
        { v: 9,  w: 1.8, sol: false },
        { v: 7,  w: 1.7, sol: false },
        { v: 10, w: 2.0, sol: false },
        { v: 3,  w: 1.6, sol: false },
        { v: 2,  w: 1.6, sol: true  },
        { v: 3,  w: 1.8, sol: true  },
      ],
      [
        { v: 25, w: 4.5, sol: true  },
        { v: 50, w: 3.0, sol: false },
        { v: 10, w: 2.8, sol: false },
        { v: 6,  w: 2.8, sol: true  },
      ],
      [
        { v: 150, w: 9.5, sol: true },
      ],
    ],
  },
  {
    name: "6",
    rows: [
      [
        { v: 3,  w: 1.7, sol: false },
        { v: 2,  w: 1.6, sol: false },
        { v: 2,  w: 1.6, sol: true  },
        { v: 4,  w: 1.9, sol: true  },
        { v: 3,  w: 1.7, sol: false },
        { v: 5,  w: 1.8, sol: true  },
        { v: 5,  w: 1.8, sol: true  },
        { v: 4,  w: 1.9, sol: false },
        { v: 2,  w: 1.6, sol: false },
      ],
      [
        { v: 8,  w: 5.0, sol: true  },
        { v: 10, w: 2.0, sol: false },
        { v: 25, w: 3.6, sol: true  },
        { v: 20, w: 3.8, sol: false },
      ],
      [
        { v: 200, w: 9.0, sol: true },
      ],
    ],
  },
];

// ==================== BLOCK BUILDER ====================
function buildBlocks(puzzle) {
  const blocks = [];
  const rowPixelWidths = puzzle.rows.map(row => {
    const contentW = row.reduce((s, b) => s + b.w * SCALE, 0);
    return contentW + (row.length - 1) * GAP;
  });
  const maxRowW = Math.max(...rowPixelWidths);
  puzzle.rows.forEach((row, ri) => {
    const totalW = rowPixelWidths[ri];
    const offsetX = (maxRowW - totalW) / 2;
    let cx = offsetX;
    row.forEach((def, ci) => {
      const pw = def.w * SCALE;
      blocks.push({
        id: `r${ri}_${ci}`, row: ri, col: ci,
        x: cx, w: pw, value: def.v, isSolution: def.sol,
      });
      cx += pw + GAP;
    });
  });
  return blocks;
}

// ==================== PHYSICS ====================
function overlapPx(a, b) {
  return Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
}

function supporters(block, allBlocks, presentSet) {
  if (block.row === 0) return [];
  return allBlocks.filter(b =>
    b.row === block.row - 1 && presentSet.has(b.id) && overlapPx(block, b) > OVERLAP_MIN
  );
}

function isStable(block, allBlocks, presentSet) {
  if (block.row === 0) return true;
  const sups = supporters(block, allBlocks, presentSet);
  if (sups.length === 0) return false;
  let contactLeft = Infinity, contactRight = -Infinity;
  for (const s of sups) {
    const cL = Math.max(block.x, s.x);
    const cR = Math.min(block.x + block.w, s.x + s.w);
    if (cL < contactLeft) contactLeft = cL;
    if (cR > contactRight) contactRight = cR;
  }
  return block.x + block.w / 2 >= contactLeft && block.x + block.w / 2 <= contactRight;
}

function findCascade(allBlocks, presentSet) {
  const falling = [];
  const live = new Set(presentSet);
  const maxRow = Math.max(...allBlocks.map(b => b.row));
  let changed = true;
  while (changed) {
    changed = false;
    for (let r = 1; r <= maxRow; r++) {
      for (const b of allBlocks) {
        if (b.row !== r || !live.has(b.id)) continue;
        if (!isStable(b, allBlocks, live)) {
          falling.push(b.id);
          live.delete(b.id);
          changed = true;
        }
      }
    }
  }
  return falling;
}

// ==================== WIN CHECK ====================
function checkWin(allBlocks, presentSet) {
  const present = allBlocks.filter(b => presentSet.has(b.id));
  if (!present.some(b => b.row > 0)) return false;
  const maxRow = Math.max(...present.map(b => b.row));
  for (const b of present) {
    if (b.row === 0) continue;
    const sups = supporters(b, allBlocks, presentSet);
    if (sups.length < 2) return false;
    const product = sups.reduce((acc, s) => acc * s.value, 1);
    if (product !== b.value) return false;
  }
  for (const b of present) {
    if (b.row === maxRow) continue;
    if (!present.some(u => u.row === b.row + 1 && overlapPx(b, u) > OVERLAP_MIN)) return false;
  }
  return true;
}

// ==================== CONNECTIONS ====================
function computeConnections(allBlocks, presentSet) {
  const present = allBlocks.filter(b => presentSet.has(b.id));
  const connections = [];
  for (const b of present) {
    if (b.row === 0) continue;
    for (const s of supporters(b, allBlocks, presentSet)) {
      connections.push({ childId: s.id, parentId: b.id });
    }
  }
  return connections;
}

// ==================== COMPONENT ====================
const FONT = `'Inter', 'Helvetica Neue', Arial, sans-serif`;

// Wobble+fall animation:
// Frames 0-14: wobble in place (rotate ±15°)
// Frames 14-35: fall downward + fade out
const WOBBLE_FRAMES = 14;
const FALL_FRAMES = 21;
const TOTAL_FALL_ANIM = WOBBLE_FRAMES + FALL_FRAMES;

function getFallTransform(frame, blockX, blockY, blockW) {
  const cx = blockX + blockW / 2;
  const cy = blockY + BLOCK_H / 2;

  if (frame <= WOBBLE_FRAMES) {
    // Wobble: oscillate rotation ±15° with decreasing frequency
    const t = frame / WOBBLE_FRAMES;
    const angle = Math.sin(t * Math.PI * 4) * 15 * (1 - t * 0.3);
    return {
      transform: `rotate(${angle}, ${cx}, ${cy})`,
      translateY: 0,
      opacity: 1,
    };
  } else {
    // Fall phase
    const fallFrame = frame - WOBBLE_FRAMES;
    const t = fallFrame / FALL_FRAMES;
    const translateY = fallFrame * fallFrame * 1.5;
    // Slight residual rotation as it falls
    const angle = Math.sin(fallFrame * 0.5) * 8 * (1 - t);
    return {
      transform: `rotate(${angle}, ${cx}, ${cy + translateY})`,
      translateY,
      opacity: Math.max(0, 1 - t * 1.3),
    };
  }
}

export default function FactorHenge() {
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [blocks, setBlocks] = useState(() => buildBlocks(PUZZLES[0]));
  const [present, setPresent] = useState(() => new Set(blocks.map(b => b.id)));
  const [hovered, setHovered] = useState(null);
  const [fallingSet, setFallingSet] = useState(new Set());
  const [fallFrames, setFallFrames] = useState({});
  const [won, setWon] = useState(false);
  const [lost, setLost] = useState(false);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState([]);
  const [moves, setMoves] = useState(0);
  const animRef = useRef(null);
  const [winAnimRow, setWinAnimRow] = useState(-1);
  const [showSolved, setShowSolved] = useState(false);
  const winTimerRef = useRef(null);

  const loadPuzzle = (idx) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (winTimerRef.current) clearTimeout(winTimerRef.current);
    const newBlocks = buildBlocks(PUZZLES[idx]);
    setPuzzleIdx(idx);
    setBlocks(newBlocks);
    setPresent(new Set(newBlocks.map(b => b.id)));
    setHovered(null); setFallingSet(new Set()); setFallFrames({});
    setWon(false); setLost(false); setBusy(false); setHistory([]); setMoves(0);
    setWinAnimRow(-1); setShowSolved(false);
  };

  const maxRow = Math.max(...blocks.map(b => b.row));
  const maxRight = Math.max(...blocks.map(b => b.x + b.w));
  const svgW = maxRight + SVG_PAD * 2;
  const rowStep = BLOCK_H + GAP;
  const svgH = svgW;

  const bx = (block) => SVG_PAD + block.x;
  const by = (block) => svgH - SVG_PAD - (block.row + 1) * rowStep;
  const bcx = (block) => bx(block) + block.w / 2;
  const bcy = (block) => by(block) + BLOCK_H / 2;

  // Win animation
  useEffect(() => {
    if (!won) return;
    const presentBlocks = blocks.filter(b => present.has(b.id));
    const presentMaxRow = Math.max(...presentBlocks.map(b => b.row));
    let currentRow = 0;
    const advanceRow = () => {
      setWinAnimRow(currentRow);
      currentRow++;
      if (currentRow <= presentMaxRow) {
        winTimerRef.current = setTimeout(advanceRow, WIN_ROW_DELAY);
      } else {
        winTimerRef.current = setTimeout(() => setShowSolved(true), 400);
      }
    };
    winTimerRef.current = setTimeout(advanceRow, 300);
    return () => { if (winTimerRef.current) clearTimeout(winTimerRef.current); };
  }, [won]);

  const runFallAnimation = useCallback((ids, afterPresent, currentBlocks) => {
    if (ids.length === 0) {
      setBusy(false);
      if (checkWin(currentBlocks, afterPresent)) setWon(true);
      return;
    }

    // Check if the top block is among the falling blocks
    const topRow = Math.max(...currentBlocks.map(b => b.row));
    const topBlockFell = ids.some(id => {
      const b = currentBlocks.find(bl => bl.id === id);
      return b && b.row === topRow;
    });

    const minRow = Math.min(...ids.map(id => currentBlocks.find(b => b.id === id).row));
    const batch = ids.filter(id => currentBlocks.find(b => b.id === id).row === minRow);
    setFallingSet(new Set(batch));

    let frame = 0;
    const tick = () => {
      frame++;
      const frames = {};
      batch.forEach(id => { frames[id] = frame; });
      setFallFrames(frames);
      if (frame < TOTAL_FALL_ANIM) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        const next = new Set(afterPresent);
        batch.forEach(id => next.delete(id));
        setPresent(next);
        setFallingSet(new Set()); setFallFrames({});

        // If top block fell, end the game as lost
        if (topBlockFell && !next.has(currentBlocks.find(b => b.row === topRow)?.id)) {
          setBusy(false);
          setLost(true);
          return;
        }

        const more = findCascade(currentBlocks, next);
        setTimeout(() => runFallAnimation(more, next, currentBlocks), 120);
      }
    };
    animRef.current = requestAnimationFrame(tick);
  }, []);

  const handleClick = useCallback((block) => {
    if (busy || won || lost || !present.has(block.id)) return;
    const topRow = Math.max(...blocks.map(b => b.row));
    if (block.row === topRow) return;
    setBusy(true);
    setHistory(h => [...h, present]);
    setMoves(m => m + 1);
    setHovered(null);
    const next = new Set(present);
    next.delete(block.id);
    setPresent(next);

    const cascade = findCascade(blocks, next);
    setTimeout(() => runFallAnimation(cascade, next, blocks), 60);
  }, [present, busy, won, lost, blocks, runFallAnimation]);

  const reset = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (winTimerRef.current) clearTimeout(winTimerRef.current);
    setPresent(new Set(blocks.map(b => b.id)));
    setHovered(null); setFallingSet(new Set()); setFallFrames({});
    setWon(false); setLost(false); setBusy(false); setHistory([]); setMoves(0);
    setWinAnimRow(-1); setShowSolved(false);
  };

  const undo = () => {
    if (busy || won || lost || history.length === 0) return;
    setPresent(history[history.length - 1]);
    setHistory(h => h.slice(0, -1));
    setMoves(m => Math.max(0, m - 1));
  };

  const connections = won ? computeConnections(blocks, present) : [];
  const blockMap = {};
  blocks.forEach(b => { blockMap[b.id] = b; });

  return (
    <div style={{
      minHeight: "100vh", background: "#ffffff",
      display: "flex", flexDirection: "column", alignItems: "center",
      fontFamily: FONT, color: "#1a1a1a",
      padding: "20px 12px 32px", userSelect: "none",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
        .blk { cursor: pointer; }
        .blk:hover .body { filter: brightness(1.15); }
        @keyframes fadeIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes circleAppear { from { r:0; opacity:0; } to { opacity:1; } }
        @keyframes lineGrow { from { stroke-dashoffset:500; } to { stroke-dashoffset:0; } }
        .game-btn {
          padding: 12px 0; width: 140px; background: #ffffff;
          border: 2px solid #d0d0d0; border-radius: 6px;
          font-family: 'Inter', sans-serif; font-size: 13px;
          font-weight: 600; letter-spacing: 0.08em;
          text-transform: uppercase; color: #999; cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }
        .game-btn:hover { border-color: #888; color: #555; }
        .game-btn:disabled { opacity: 0.35; cursor: default; }
        .game-btn:disabled:hover { border-color: #d0d0d0; color: #999; }
        .pz-btn {
          min-width: 48px; height: 44px; padding: 0 12px;
          border-radius: 8px; border: 2px solid #d0d0d0;
          background: #fff; font-family: 'Inter', sans-serif;
          font-size: 14px; font-weight: 800; color: #999;
          cursor: pointer; transition: all 0.15s;
          display: flex; align-items: center; justify-content: center;
        }
        .pz-btn:hover { border-color: #888; color: #555; }
        .pz-btn.active { background: #2b4570; border-color: #2b4570; color: #fff; }
      `}</style>

      <h1 style={{
        fontSize: 28, fontWeight: 900, letterSpacing: "0.04em",
        margin: "0 0 12px", color: "#1a1a1a", textAlign: "center",
      }}>FACTOR HENGE</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", justifyContent: "center" }}>
        {PUZZLES.map((p, i) => (
          <button key={i} className={`pz-btn ${i === puzzleIdx ? "active" : ""}`}
            onClick={() => loadPuzzle(i)}>{p.name}</button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, margin: "0 0 14px" }}>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", color: "#999", textTransform: "uppercase" }}>Moves</span>
        <span style={{ fontSize: 28, fontWeight: 900, color: "#1a1a1a" }}>{moves}</span>
      </div>

      {showSolved && (
        <div style={{
          animation: "fadeIn 0.5s ease-out", padding: "10px 28px", marginBottom: 14,
          background: "#e8f5e9", border: "2px solid #4caf50",
          borderRadius: 8, fontSize: 16, fontWeight: 800, color: "#2e7d32",
        }}>SOLVED!</div>
      )}

      {lost && (
        <button onClick={reset} style={{
          animation: "fadeIn 0.4s ease-out",
          padding: "12px 32px", marginBottom: 14,
          background: "#ffffff", border: "2px solid #d32f2f",
          borderRadius: 8, fontSize: 16, fontWeight: 800, color: "#d32f2f",
          cursor: "pointer", fontFamily: FONT, letterSpacing: "0.04em",
          transition: "background 0.2s, color 0.2s",
        }}
        onMouseEnter={e => { e.target.style.background = "#d32f2f"; e.target.style.color = "#fff"; }}
        onMouseLeave={e => { e.target.style.background = "#ffffff"; e.target.style.color = "#d32f2f"; }}
        >TRY AGAIN</button>
      )}

      <div style={{ border: "2px solid #1a1a1a", borderRadius: 2, padding: "8px", background: "#ffffff", overflow: "hidden" }}>
        <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}
          style={{ display: "block", maxWidth: "100%", height: "auto" }}>

          {/* Connection lines */}
          {won && connections.map((conn, i) => {
            const child = blockMap[conn.childId];
            const parent = blockMap[conn.parentId];
            if (!child || !parent || child.row > winAnimRow) return null;
            const x1 = bcx(child), y1 = bcy(child), x2 = bcx(parent), y2 = bcy(parent);
            const len = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
            return (
              <line key={`l${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="#d32f2f" strokeWidth={2.5} strokeLinecap="round"
                strokeDasharray={len} strokeDashoffset={0}
                style={{ animation: "lineGrow 0.4s ease-out forwards", opacity: 0.85 }} />
            );
          })}

          {/* Blocks */}
          {blocks.map(block => {
            const visible = present.has(block.id) || fallingSet.has(block.id);
            if (!visible) return null;
            const x = bx(block), y = by(block), w = block.w, h = BLOCK_H;
            const falling = fallingSet.has(block.id);
            const frame = fallFrames[block.id] || 0;
            const isHov = hovered === block.id && !busy;
            const isWinActivated = won && block.row <= winAnimRow;

            let fill = "#2b4570", textFill = "#ffffff";
            if (isWinActivated) fill = "#e65100";
            else if (isHov) fill = "#3a5a8c";

            // Compute wobble+fall transform
            let gTransform = "";
            let gOpacity = 1;
            if (falling && frame > 0) {
              const ft = getFallTransform(frame, x, y, w);
              gTransform = `translate(0,${ft.translateY}) ${ft.transform}`;
              gOpacity = ft.opacity;
            }

            const isTopBlock = block.row === Math.max(...blocks.map(b => b.row));

            return (
              <g key={block.id} className={isTopBlock ? "" : "blk"}
                transform={gTransform}
                opacity={gOpacity}
                style={isTopBlock ? { cursor: "default" } : undefined}
                onClick={() => handleClick(block)}
                onMouseEnter={() => !isTopBlock && !busy && !won && !lost && setHovered(block.id)}
                onMouseLeave={() => setHovered(null)}>
                <rect className="body" x={x} y={y} width={w} height={h} rx={4} fill={fill}
                  style={isWinActivated ? { transition: "fill 0.4s ease-out" } : undefined} />
                <text x={x+w/2} y={y+h/2+1} textAnchor="middle" dominantBaseline="central"
                  fontSize={block.value >= 100 ? 16 : block.value >= 10 ? 18 : 20}
                  fontWeight="800" fontFamily={FONT} fill={textFill}
                  style={{ pointerEvents: "none" }}>{block.value}</text>
              </g>
            );
          })}

          {/* Red circles */}
          {won && blocks.filter(b => present.has(b.id) && b.row <= winAnimRow).map(block => {
            const r = Math.min(block.w / 2 - 4, BLOCK_H / 2 - 6, 18);
            return (
              <circle key={`c${block.id}`} cx={bcx(block)} cy={bcy(block)} r={r}
                fill="none" stroke="#d32f2f" strokeWidth={2.5}
                style={{ animation: "circleAppear 0.3s ease-out forwards" }} />
            );
          })}
        </svg>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button className="game-btn" onClick={undo} disabled={history.length === 0 || busy || won || lost}>Undo</button>
        <button className="game-btn" onClick={reset}>Reset</button>
      </div>

      <p style={{
        marginTop: 20, fontSize: 13, fontWeight: 600,
        letterSpacing: "0.06em", textTransform: "uppercase", color: "#999", textAlign: "center",
      }}>Find the factors</p>
    </div>
  );
}
