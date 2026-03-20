import { OVERLAP_MIN } from "./constants.js";

export function overlapPx(a, b) {
  return Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
}

export function supporters(block, allBlocks, presentSet) {
  if (block.row === 0) return [];
  return allBlocks.filter(
    (b) =>
      b.row === block.row - 1 && presentSet.has(b.id) && overlapPx(block, b) > OVERLAP_MIN,
  );
}

export function isStable(block, allBlocks, presentSet) {
  if (block.row === 0) return true;
  const sups = supporters(block, allBlocks, presentSet);
  if (sups.length === 0) return false;

  let contactLeft = Infinity;
  let contactRight = -Infinity;
  for (const s of sups) {
    const cL = Math.max(block.x, s.x);
    const cR = Math.min(block.x + block.w, s.x + s.w);
    if (cL < contactLeft) contactLeft = cL;
    if (cR > contactRight) contactRight = cR;
  }
  const center = block.x + block.w / 2;
  return center >= contactLeft && center <= contactRight;
}

export function findCascade(allBlocks, presentSet) {
  const falling = [];
  const live = new Set(presentSet);
  const maxRow = Math.max(...allBlocks.map((b) => b.row));

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

// Win condition:
// 1) Every remaining non-bottom block must be stable AND have 2+ supporters.
// 2) Its value must equal the product of all supporters' values.
// 3) For blocks not on the top row: at least one block in the row below overlaps.
export function checkWin(allBlocks, presentSet) {
  const present = allBlocks.filter((b) => presentSet.has(b.id));
  if (!present.some((b) => b.row > 0)) return false;

  const maxRow = Math.max(...present.map((b) => b.row));
  for (const b of present) {
    if (b.row === 0) continue;
    if (!isStable(b, allBlocks, presentSet)) return false;

    const sups = supporters(b, allBlocks, presentSet);
    if (sups.length < 2) return false;

    const product = sups.reduce((acc, s) => acc * s.value, 1);
    if (product !== b.value) return false;
  }

  for (const b of present) {
    if (b.row === maxRow) continue;
    if (!present.some((u) => u.row === b.row + 1 && overlapPx(b, u) > OVERLAP_MIN)) return false;
  }
  return true;
}

export function computeConnections(allBlocks, presentSet) {
  const present = allBlocks.filter((b) => presentSet.has(b.id));
  const connections = [];

  for (const b of present) {
    if (b.row === 0) continue;
    for (const s of supporters(b, allBlocks, presentSet)) {
      connections.push({ childId: s.id, parentId: b.id });
    }
  }
  return connections;
}

