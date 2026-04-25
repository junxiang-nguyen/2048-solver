import { createBoard, clearBoard, setCell, applyMove } from "./board.js";
import { renderBoard } from "./ui.js";
import { analyzeBestMove } from "./ai.js";

const state = {
  rows: 4,
  cols: 4,
  selectedTileValue: 2,
  board: createBoard(4, 4),
  phase: "edit",
  placedTileThisTurn: false,
  lastMoveScore: 0,
  analysis: null
};

const rowsInput = document.getElementById("rowsInput");
const colsInput = document.getElementById("colsInput");
const tileValueInput = document.getElementById("tileValueInput");
const resizeBtn = document.getElementById("resizeBtn");
const clearBtn = document.getElementById("clearBtn");
const analyzeBtn = document.getElementById("analyzeBtn");

const moveUpBtn = document.getElementById("moveUpBtn");
const moveLeftBtn = document.getElementById("moveLeftBtn");
const moveRightBtn = document.getElementById("moveRightBtn");
const moveDownBtn = document.getElementById("moveDownBtn");
const confirmBtn = document.getElementById("confirmBtn");

const phaseText = document.getElementById("phaseText");
const statusText = document.getElementById("statusText");
const scoreText = document.getElementById("scoreText");
const bestMoveText = document.getElementById("bestMoveText");
const reasonText = document.getElementById("reasonText");

function refresh() {
  renderBoard(state, handleCellClick);
  phaseText.textContent = state.phase;
  scoreText.textContent = state.lastMoveScore;

  if (state.phase === "edit") {
    statusText.textContent = "Edit the board, analyze it, or make a swipe.";
  } else if (state.phase === "afterMove") {
    statusText.textContent = "Place exactly one new tile on an empty cell.";
  } else if (state.phase === "readyToAnalyze") {
    statusText.textContent = "New tile placed. Click Confirm New Tile, then analyze again.";
  }

  confirmBtn.disabled = state.phase !== "readyToAnalyze";

  if (!state.analysis) {
    bestMoveText.textContent = "Not analyzed yet.";
    reasonText.textContent = "The program has not evaluated the current board yet.";
  } else if (!state.analysis.bestMove) {
    bestMoveText.textContent = "No valid move";
    reasonText.textContent = state.analysis.message;
  } else {
    bestMoveText.textContent = state.analysis.message;

    const e = state.analysis.bestEvaluation;
    const wp = state.analysis.bestWorstPlacement;

    if (wp) {
      reasonText.textContent =
        `Depth ${state.analysis.depth}. Empty cells: ${e.emptyCells}, ` +
        `monotonicity: ${e.monotonicity.toFixed(2)}, ` +
        `smoothness: ${e.smoothness.toFixed(2)}, ` +
        `max tile: ${e.maxTile}, corner tile: ${e.cornerMax}. ` +
        `Worst expected reply: place ${wp.value} at row ${wp.row + 1}, col ${wp.col + 1}.`;
    } else {
      reasonText.textContent =
        `Depth ${state.analysis.depth}. Empty cells: ${e.emptyCells}, ` +
        `monotonicity: ${e.monotonicity.toFixed(2)}, ` +
        `smoothness: ${e.smoothness.toFixed(2)}, ` +
        `max tile: ${e.maxTile}, corner tile: ${e.cornerMax}.`;
    }
  }
}

function handleCellClick(row, col) {
  const currentValue = state.board[row][col];

  if (state.phase === "afterMove" && !state.placedTileThisTurn) {
    if (currentValue !== 0) {
      statusText.textContent = "You can only place the new tile on an empty cell.";
      return;
    }

    state.board = setCell(state.board, row, col, state.selectedTileValue);
    state.placedTileThisTurn = true;
    state.phase = "readyToAnalyze";
    state.analysis = null;
    refresh();
    return;
  }

  if (state.phase === "edit") {
    state.board = setCell(state.board, row, col, state.selectedTileValue);
    state.analysis = null;
    refresh();
    return;
  }
}

function handleMove(direction) {
  if (state.phase !== "edit") {
    statusText.textContent = "You must finish the current turn before making another move.";
    return;
  }

  const result = applyMove(state.board, direction);

  if (!result.moved) {
    state.lastMoveScore = 0;
    statusText.textContent = `Move ${direction} changed nothing. Try another direction.`;
    refresh();
    return;
  }

  state.board = result.board;
  state.lastMoveScore = result.scoreGained;
  state.phase = "afterMove";
  state.placedTileThisTurn = false;
  state.analysis = null;
  refresh();
}

function handleAnalyze() {
  if (state.phase !== "edit") {
    statusText.textContent = "Finish the current turn before analyzing again.";
    return;
  }

  state.analysis = analyzeBestMove(state.board);
  refresh();
}

tileValueInput.addEventListener("change", () => {
  state.selectedTileValue = Number(tileValueInput.value);
});

resizeBtn.addEventListener("click", () => {
  const rows = Number(rowsInput.value);
  const cols = Number(colsInput.value);

  state.rows = rows;
  state.cols = cols;
  state.board = createBoard(rows, cols);
  state.phase = "edit";
  state.placedTileThisTurn = false;
  state.lastMoveScore = 0;
  state.analysis = null;
  refresh();
});

clearBtn.addEventListener("click", () => {
  state.board = clearBoard(state.board);
  state.phase = "edit";
  state.placedTileThisTurn = false;
  state.lastMoveScore = 0;
  state.analysis = null;
  refresh();
});

analyzeBtn.addEventListener("click", handleAnalyze);

moveUpBtn.addEventListener("click", () => handleMove("up"));
moveLeftBtn.addEventListener("click", () => handleMove("left"));
moveRightBtn.addEventListener("click", () => handleMove("right"));
moveDownBtn.addEventListener("click", () => handleMove("down"));

confirmBtn.addEventListener("click", () => {
  if (state.phase !== "readyToAnalyze") return;

  state.phase = "edit";
  state.placedTileThisTurn = false;
  state.analysis = null;
  statusText.textContent = "Board confirmed. Now analyze the new board.";
  refresh();
});

window.addEventListener("keydown", (event) => {
  if (state.phase !== "edit") return;

  if (event.key === "ArrowUp") handleMove("up");
  if (event.key === "ArrowLeft") handleMove("left");
  if (event.key === "ArrowRight") handleMove("right");
  if (event.key === "ArrowDown") handleMove("down");
});

refresh();