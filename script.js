const rows = 8;
const cols = 10;
const minesTotal = 14;

const boardEl = document.getElementById('board');
const messageEl = document.getElementById('message');
const mineCountEl = document.getElementById('mine-count');
const flagCountEl = document.getElementById('flag-count');
const hullStatusEl = document.getElementById('hull-status');
const newGameBtn = document.getElementById('new-game');
const toggleMarksBtn = document.getElementById('toggle-marks');
const tankerEl = document.getElementById('tanker');

let board = [];
let revealedCount = 0;
let flagsPlaced = 0;
let gameOver = false;
let markMode = false;

function initGame() {
  board = createBoard();
  revealedCount = 0;
  flagsPlaced = 0;
  gameOver = false;
  markMode = false;
  messageEl.textContent = 'Plot a safe route from the Gulf to open water.';
  hullStatusEl.textContent = 'Intact';
  mineCountEl.textContent = minesTotal;
  flagCountEl.textContent = flagsPlaced;
  toggleMarksBtn.textContent = 'Mark Mode: Off';
  renderBoard();
  updateTankerPosition();
}

function createBoard() {
  const grid = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => ({ row, col, mine: false, revealed: false, flagged: false, count: 0 }))
  );

  let placed = 0;
  while (placed < minesTotal) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    if (!grid[row][col].mine) {
      grid[row][col].mine = true;
      placed += 1;
    }
  }

  for (const tile of grid.flat()) {
    tile.count = neighbors(tile.row, tile.col).filter(([r, c]) => grid[r][c].mine).length;
  }

  return grid;
}

function neighbors(row, col) {
  const points = [];
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) points.push([nr, nc]);
    }
  }
  return points;
}

function renderBoard() {
  boardEl.innerHTML = '';
  board.flat().forEach((tile) => {
    const button = document.createElement('button');
    button.className = 'tile';
    button.dataset.row = tile.row;
    button.dataset.col = tile.col;
    button.type = 'button';

    if (tile.revealed) {
      button.classList.add('revealed');
      if (tile.mine) {
        button.classList.add('mine-hit');
        button.textContent = '💥';
      } else if (tile.count > 0) {
        button.textContent = tile.count;
        button.dataset.value = tile.count;
      }
    } else if (tile.flagged) {
      button.classList.add('flagged');
      button.textContent = '⚑';
    }

    button.addEventListener('click', () => handleTileAction(tile.row, tile.col, markMode));
    button.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      handleTileAction(tile.row, tile.col, true);
    });

    boardEl.appendChild(button);
  });
}

function handleTileAction(row, col, forceFlag = false) {
  if (gameOver) return;
  const tile = board[row][col];
  if (tile.revealed) return;

  if (forceFlag) {
    tile.flagged = !tile.flagged;
    flagsPlaced += tile.flagged ? 1 : -1;
    flagCountEl.textContent = flagsPlaced;
    renderBoard();
    return;
  }

  if (tile.flagged) return;

  if (tile.mine) {
    tile.revealed = true;
    hullStatusEl.textContent = 'Breached';
    messageEl.textContent = 'Mine strike! The tanker was lost in transit.';
    gameOver = true;
    revealAllMines();
    renderBoard();
    updateTankerPosition(tile.col, tile.row, true);
    return;
  }

  floodReveal(row, col);
  renderBoard();
  updateTankerPosition();

  if (revealedCount === rows * cols - minesTotal) {
    gameOver = true;
    hullStatusEl.textContent = 'Escaped';
    messageEl.textContent = 'Safe passage secured. The tanker cleared the Strait of Hormuz!';
  } else {
    messageEl.textContent = 'Channel updated. Continue the eastbound passage.';
  }
}

function floodReveal(startRow, startCol) {
  const stack = [[startRow, startCol]];
  while (stack.length) {
    const [row, col] = stack.pop();
    const tile = board[row][col];
    if (tile.revealed || tile.flagged) continue;
    tile.revealed = true;
    revealedCount += 1;

    if (tile.count === 0) {
      neighbors(row, col).forEach(([nr, nc]) => {
        const next = board[nr][nc];
        if (!next.revealed && !next.mine) stack.push([nr, nc]);
      });
    }
  }
}

function revealAllMines() {
  board.flat().forEach((tile) => {
    if (tile.mine) tile.revealed = true;
  });
}

function updateTankerPosition(colOverride, rowOverride, danger = false) {
  const safeTiles = board.flat().filter((tile) => tile.revealed && !tile.mine);
  const furthest = safeTiles.reduce((best, tile) => {
    const score = tile.col * 10 - Math.abs(tile.row - Math.floor(rows / 2));
    return score > best.score ? { score, tile } : best;
  }, { score: -Infinity, tile: { row: Math.floor(rows / 2), col: 0 } }).tile;

  const col = colOverride ?? furthest.col;
  const row = rowOverride ?? furthest.row;

  tankerEl.style.left = `${34 + (col / (cols - 1)) * 38}%`;
  tankerEl.style.top = `${16 + (row / (rows - 1)) * 68}%`;
  tankerEl.style.transform = `translate(-50%, -50%) scale(${danger ? 1.2 : 1}) rotate(${danger ? -12 : 0}deg)`;
}

newGameBtn.addEventListener('click', initGame);
toggleMarksBtn.addEventListener('click', () => {
  markMode = !markMode;
  toggleMarksBtn.textContent = `Mark Mode: ${markMode ? 'On' : 'Off'}`;
});

initGame();
