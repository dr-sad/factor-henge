import { useState, useCallback, useRef } from "react";

// ==================== CONSTANTS ====================
const GAP = 2;
const BLOCK_H = 44;
const SCALE = 27;
const SVG_PAD = 14;
const OVERLAP_MIN = 2;
const WOBBLE_FRAMES = 14;
const FALL_FRAMES = 21;
const TOTAL_ANIM = WOBBLE_FRAMES + FALL_FRAMES;
const W5 = 2.0;
const WK = 10.4;

// ==================== RNG ====================
function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ==================== BOARD GENERATOR ====================
function generateZone(targetSafe, rng) {
  for (let attempt = 0; attempt < 300; attempt++) {
    const ks = 12 + Math.floor(rng() * 19); // 12–30
    const blocks = [];
    for (let i = 0; i < 5; i++) blocks.push(2 + Math.floor(rng() * 8)); // 2–9

    const sum = blocks.reduce((a, b) => a + b, 0);
    const slack = sum - ks;
    if (slack < 2 || slack > 14) continue;

    const sorted = [...blocks].sort((a, b) => a - b);
    let removable = 0, runSum = 0;
    for (const v of sorted) {
      if (runSum + v <= slack) { removable++; runSum += v; }
      else break;
    }

    if (removable === targetSafe) {
      return { blocks: shuffle(blocks, rng), ks };
    }
  }
  // Fallback (shouldn't happen)
  return { blocks: [3, 4, 5, 6, 7], ks: 15 };
}

function generateBoard(seed) {
  const rng = mulberry32(seed);
  const targets = [3, 3, 2, 2, 2]; // escalating difficulty
  return targets.map(t => generateZone(t, rng));
}

// ==================== BUILD TOWER FROM ZONES ====================
function buildTower(zones) {
  const towerRows = [];
  zones.forEach(z => {
    towerRows.push(z.blocks.map(v => ({ v, w: W5 })));
    towerRows.push([{ v: z.ks, w: WK, ks: true }]);
  });
  towerRows.push([{ v: 0, w: WK, crown: true }]);

  const blocks = [];
  const rowPxW = towerRows.map(r =>
    r.reduce((s, b) => s + b.w * SCALE, 0) + (r.length - 1) * GAP
  );
  const maxW = Math.max(...rowPxW);

  towerRows.forEach((row, ri) => {
    const totalW = rowPxW[ri];
    const offsetX = (maxW - totalW) / 2;
    let cx = offsetX;
    row.forEach((d, ci) => {
      const pw = d.w * SCALE;
      blocks.push({
        id: `r${ri}_${ci}`, row: ri, col: ci, x: cx, w: pw,
        value: d.v || 0, isKeystone: !!d.ks, isCrown: !!d.crown,
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

function isPhysStable(block, allBlocks, live) {
  if (block.row === 0) return true;
  const sups = allBlocks.filter(
    b => b.row === block.row - 1 && live.has(b.id) && overlapPx(block, b) > OVERLAP_MIN
  );
  if (sups.length === 0) return false;
  let cL = Infinity, cR = -Infinity;
  for (const s of sups) {
    cL = Math.min(cL, Math.max(block.x, s.x));
    cR = Math.max(cR, Math.min(block.x + block.w, s.x + s.w));
  }
  return block.x + block.w / 2 >= cL && block.x + block.w / 2 <= cR;
}

function isKeystoneStable(block, allBlocks, live) {
  if (!block.isKeystone) return true;
  const belowBlocks = allBlocks.filter(
    b => b.row === block.row - 1 && live.has(b.id)
  );
  const sum = belowBlocks.reduce((acc, b) => acc + b.value, 0);
  return sum >= block.value;
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
        if (!isPhysStable(b, allBlocks, live) || !isKeystoneStable(b, allBlocks, live)) {
          falling.push(b.id);
          live.delete(b.id);
          changed = true;
        }
      }
    }
  }
  return falling;
}

// ==================== WOBBLE-FALL ====================
function getFallTransform(frame, x, y, w) {
  const cx = x + w / 2, cy = y + BLOCK_H / 2;
  if (frame <= WOBBLE_FRAMES) {
    const t = frame / WOBBLE_FRAMES;
    const angle = Math.sin(t * Math.PI * 4) * 15 * (1 - t * 0.3);
    return { transform: `rotate(${angle},${cx},${cy})`, ty: 0, opacity: 1 };
  }
  const f = frame - WOBBLE_FRAMES, t = f / FALL_FRAMES;
  const ty = f * f * 1.5;
  const angle = Math.sin(f * 0.5) * 8 * (1 - t);
  return { transform: `rotate(${angle},${cx},${cy + ty})`, ty, opacity: Math.max(0, 1 - t * 1.3) };
}

// ==================== COMPONENT ====================
const FONT = `'Inter', 'Helvetica Neue', Arial, sans-serif`;
const P = {
  1: { main: "#2b6cb0", bg: "#ebf4ff", text: "#1a4971", name: "BLUE" },
  2: { main: "#c53030", bg: "#fff5f5", text: "#822727", name: "RED" },
};

function initGame(seed) {
  const zones = generateBoard(seed);
  const blocks = buildTower(zones);
  return { blocks, present: new Set(blocks.map(b => b.id)) };
}

export default function GreaterThanJenga() {
  const [seed, setSeed] = useState(() => Date.now());
  const [{ blocks, present: initPresent }] = useState(() => initGame(seed));
  const [allBlocks, setAllBlocks] = useState(blocks);
  const [present, setPresent] = useState(initPresent);
  const [hovered, setHovered] = useState(null);
  const [fallingSet, setFallingSet] = useState(new Set());
  const [fallFrames, setFallFrames] = useState({});
  const [busy, setBusy] = useState(false);
  const [player, setPlayer] = useState(1);
  const [gameOver, setGameOver] = useState(null);
  const animRef = useRef(null);

  const crownId = allBlocks.find(b => b.isCrown)?.id;
  const maxRow = Math.max(...allBlocks.map(b => b.row));
  const maxRight = Math.max(...allBlocks.map(b => b.x + b.w));
  const svgW = maxRight + SVG_PAD * 2;
  const rowStep = BLOCK_H + GAP;
  const svgH = (maxRow + 1) * rowStep + SVG_PAD * 2 + 8;

  const bx = b => SVG_PAD + b.x;
  const by = b => svgH - SVG_PAD - (b.row + 1) * rowStep;
  const runFall = useCallback((ids, afterPresent, who, currentBlocks, crown) => {
    if (ids.length === 0) {
      setBusy(false);
      setPlayer(who === 1 ? 2 : 1);
      return;
    }
    const crownFalling = ids.includes(crown);
    const minRow = Math.min(...ids.map(id => currentBlocks.find(b => b.id === id).row));
    const batch = ids.filter(id => currentBlocks.find(b => b.id === id).row === minRow);
    setFallingSet(new Set(batch));

    let frame = 0;
    const tick = () => {
      frame++;
      const frames = {};
      batch.forEach(id => { frames[id] = frame; });
      setFallFrames(frames);
      if (frame < TOTAL_ANIM) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        const next = new Set(afterPresent);
        batch.forEach(id => next.delete(id));
        setPresent(next);
        setFallingSet(new Set());
        setFallFrames({});
        if (crownFalling && batch.includes(crown)) {
          setBusy(false); setGameOver({ loser: who }); return;
        }
        const more = findCascade(currentBlocks, next);
        if (more.length > 0) {
          setTimeout(() => runFall(more, next, who, currentBlocks, crown), 100);
        } else {
          if (!next.has(crown)) { setBusy(false); setGameOver({ loser: who }); return; }
          setBusy(false);
          setPlayer(who === 1 ? 2 : 1);
        }
      }
    };
    animRef.current = requestAnimationFrame(tick);
  }, []);

  const handleClick = useCallback(block => {
    if (busy || gameOver || !present.has(block.id) || block.isCrown || block.isKeystone) return;
    setBusy(true);
    setHovered(null);
    const next = new Set(present);
    next.delete(block.id);
    setPresent(next);
    const cascade = findCascade(allBlocks, next);
    setTimeout(() => runFall(cascade, next, player, allBlocks, crownId), 60);
  }, [present, busy, gameOver, player, allBlocks, crownId, runFall]);

  const newGame = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const newSeed = Date.now();
    const { blocks: newBlocks, present: newPresent } = initGame(newSeed);
    setSeed(newSeed);
    setAllBlocks(newBlocks);
    setPresent(newPresent);
    setHovered(null); setFallingSet(new Set()); setFallFrames({});
    setBusy(false); setPlayer(1); setGameOver(null);
  };

  const winner = gameOver ? (gameOver.loser === 1 ? 2 : 1) : null;
  const pc = P[player];

  return (
    <div style={{
      minHeight: "100vh", background: "#fff",
      display: "flex", flexDirection: "column", alignItems: "center",
      fontFamily: FONT, color: "#1a1a1a",
      padding: "16px 12px 32px", userSelect: "none",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
        .jblk { cursor: pointer; }
        .jblk:hover .jbody { filter: brightness(1.08); }
        .jno { cursor: default; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.02)} }
        .gbtn {
          padding:10px 22px; background:#fff; border:2px solid #d0d0d0; border-radius:6px;
          font-family:'Inter',sans-serif; font-size:13px; font-weight:600;
          letter-spacing:0.08em; text-transform:uppercase; color:#999;
          cursor:pointer; transition:border-color 0.2s,color 0.2s;
        }
        .gbtn:hover { border-color:#888; color:#555; }
      `}</style>

      <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: "0.04em", margin: "0 0 10px" }}>
        GREATER THAN JENGA
      </h1>

      {!gameOver ? (
        <div style={{
          display: "flex", alignItems: "center", gap: 14, marginBottom: 10,
          padding: "8px 20px", borderRadius: 8,
          background: pc.bg, border: `2px solid ${pc.main}`,
          animation: busy ? "none" : "pulse 1.5s ease-in-out infinite",
        }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: pc.main }} />
          <span style={{ fontSize: 14, fontWeight: 800, color: pc.text }}>
            {pc.name}'S TURN
          </span>
        </div>
      ) : (
        <div style={{ textAlign: "center", marginBottom: 10, animation: "fadeIn 0.5s ease-out" }}>
          <div style={{
            padding: "10px 28px", marginBottom: 10,
            background: P[winner].bg, border: `2px solid ${P[winner].main}`,
            borderRadius: 8, fontSize: 17, fontWeight: 900, color: P[winner].text,
          }}>
            {P[winner].name} WINS!
          </div>
          <button className="gbtn" onClick={newGame} style={{
            borderColor: P[winner].main, color: P[winner].main,
          }}>Play Again</button>
        </div>
      )}

      <div style={{
        border: "2px solid #1a1a1a", borderRadius: 2,
        padding: "6px", background: "#fff", overflow: "hidden",
      }}>
        <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}
          style={{ display: "block", maxWidth: "100%", height: "auto" }}>

          <line x1={SVG_PAD - 2} y1={svgH - SVG_PAD + 2}
            x2={svgW - SVG_PAD + 2} y2={svgH - SVG_PAD + 2}
            stroke="#ddd" strokeWidth={2} />

          {allBlocks.map(block => {
            const visible = present.has(block.id) || fallingSet.has(block.id);
            if (!visible) return null;
            const x = bx(block), y = by(block), w = block.w, h = BLOCK_H;
            const falling = fallingSet.has(block.id);
            const frame = fallFrames[block.id] || 0;
            const isHov = hovered === block.id && !busy && !gameOver;
            const notClick = block.isCrown || block.isKeystone;

            let fill, textFill = "#fff", stroke = "none";
            if (block.isCrown) {
              fill = "#d4a030"; stroke = "#b8891a";
            } else if (block.isKeystone) {
              fill = "#2b4570"; stroke = "#1a3050";
            } else {
              fill = "#d4782f"; stroke = "#b5621f";
              if (isHov) { fill = "#e08838"; stroke = "#c97020"; }
            }

            let gT = "", gO = 1;
            if (falling && frame > 0) {
              const ft = getFallTransform(frame, x, y, w);
              gT = `translate(0,${ft.ty}) ${ft.transform}`;
              gO = ft.opacity;
            }

            return (
              <g key={block.id} className={notClick ? "jno" : "jblk"}
                transform={gT} opacity={gO}
                onClick={() => handleClick(block)}
                onMouseEnter={() => !notClick && !busy && !gameOver && setHovered(block.id)}
                onMouseLeave={() => setHovered(null)}>
                <rect className="jbody" x={x} y={y} width={w} height={h} rx={4}
                  fill={fill} stroke={stroke} strokeWidth={2} />
                <text x={x + w / 2} y={y + h / 2 + 1}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={block.isCrown ? 20 : block.value >= 10 ? 16 : 18}
                  fontWeight="800" fontFamily={FONT} fill={textFill}
                  style={{ pointerEvents: "none" }}>
                  {block.isCrown ? "♛" : block.value}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {!gameOver && (
        <button className="gbtn" onClick={newGame} style={{ marginTop: 12 }}>
          Start New Game
        </button>
      )}

      <p style={{
        marginTop: 14, fontSize: 11.5, fontWeight: 600,
        letterSpacing: "0.03em", color: "#bbb", textAlign: "center",
        maxWidth: 340, lineHeight: 1.5,
      }}>
        Take turns removing orange blocks. Each blue bar needs the blocks
        below to sum ≥ its value — go below and it collapses.
        Topple the crown and you lose.
      </p>
    </div>
  );
}
