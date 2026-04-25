import { applyMove, setCell } from "./board.js";

const DIRECTIONS = ["up", "left", "right", "down"];
const transpositionTable = new Map();

function boardToKey(board, depth, nodeType, allowedTileValues) {
  const boardKey = board.map(row => row.join(",")).join("|");
  const tileKey = allowedTileValues.join(",");
  return `${nodeType}:${depth}:${tileKey}:${boardKey}`;
}

function countEmptyCells(board) {
  let count = 0;
  for (const row of board) {
    for (const value of row) {
      if (value === 0) count++;
    }
  }
  return count;
}

function getEmptyCells(board) {
  const cells = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      if (board[r][c] === 0) {
        cells.push({ row: r, col: c });
      }
    }
  }
  return cells;
}

function countLegalMoves(board) {
  let count = 0;
  for (const direction of DIRECTIONS) {
    const result = applyMove(board, direction);
    if (result.moved) count++;
  }
  return count;
}

function countPotentialMerges(board) {
  let merges = 0;
  const rows = board.length;
  const cols = board[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const value = board[r][c];
      if (value === 0) continue;

      if (c + 1 < cols && board[r][c + 1] === value) merges++;
      if (r + 1 < rows && board[r + 1][c] === value) merges++;
    }
  }

  return merges;
}

function calculateSmoothness(board) {
  let penalty = 0;
  const rows = board.length;
  const cols = board[0].length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const value = board[r][c];
      if (value === 0) continue;

      if (c + 1 < cols && board[r][c + 1] !== 0) {
        penalty += Math.abs(Math.log2(value) - Math.log2(board[r][c + 1]));
      }

      if (r + 1 < rows && board[r + 1][c] !== 0) {
        penalty += Math.abs(Math.log2(value) - Math.log2(board[r + 1][c]));
      }
    }
  }

  return -penalty;
}

function calculateMonotonicity(board) {
  let score = 0;
  const rows = board.length;
  const cols = board[0].length;

  for (let r = 0; r < rows; r++) {
    let inc = 0;
    let dec = 0;

    for (let c = 0; c < cols - 1; c++) {
      const a = board[r][c] === 0 ? 0 : Math.log2(board[r][c]);
      const b = board[r][c + 1] === 0 ? 0 : Math.log2(board[r][c + 1]);

      if (a > b) dec += a - b;
      else inc += b - a;
    }

    score += -Math.min(inc, dec);
  }

  for (let c = 0; c < cols; c++) {
    let inc = 0;
    let dec = 0;

    for (let r = 0; r < rows - 1; r++) {
      const a = board[r][c] === 0 ? 0 : Math.log2(board[r][c]);
      const b = board[r + 1][c] === 0 ? 0 : Math.log2(board[r + 1][c]);

      if (a > b) dec += a - b;
      else inc += b - a;
    }

    score += -Math.min(inc, dec);
  }

  return score;
}

function getMaxTile(board) {
  let max = 0;
  for (const row of board) {
    for (const value of row) {
      if (value > max) max = value;
    }
  }
  return max;
}

function cornerWeight(board) {
  const rows = board.length;
  const cols = board[0].length;
  const corners = [
    board[0][0],
    board[0][cols - 1],
    board[rows - 1][0],
    board[rows - 1][cols - 1]
  ];
  return Math.max(...corners);
}

export function evaluateBoard(board) {
  const emptyCells = countEmptyCells(board);
  const legalMoves = countLegalMoves(board);
  const potentialMerges = countPotentialMerges(board);
  const smoothness = calculateSmoothness(board);
  const monotonicity = calculateMonotonicity(board);
  const maxTile = getMaxTile(board);
  const cornerMax = cornerWeight(board);

  let totalScore =
    emptyCells * 160 +
    legalMoves * 120 +
    potentialMerges * 40 +
    monotonicity * 14 +
    smoothness * 4 +
    Math.log2(maxTile || 1) * 10 +
    Math.log2(cornerMax || 1) * 14;

  if (emptyCells <= 2) totalScore -= 400;
  if (emptyCells <= 1) totalScore -= 700;
  if (legalMoves <= 1) totalScore -= 900;
  if (legalMoves === 0) totalScore -= 5000;

  return {
    totalScore,
    emptyCells,
    legalMoves,
    potentialMerges,
    smoothness,
    monotonicity,
    maxTile,
    cornerMax
  };
}

function minimizePlacement(board, depth, allowedTileValues) {
  const key = boardToKey(board, depth, "min", allowedTileValues);
  if (transpositionTable.has(key)) {
    return transpositionTable.get(key);
  }

  const emptyCells = getEmptyCells(board);

  if (depth === 0 || emptyCells.length === 0) {
    const result = {
      score: evaluateBoard(board).totalScore
    };
    transpositionTable.set(key, result);
    return result;
  }

  let worstScore = Infinity;
  let worstPlacement = null;

  for (const cell of emptyCells) {
    for (const tileValue of allowedTileValues) {
      const placedBoard = setCell(board, cell.row, cell.col, tileValue);
      const result = maximizeMove(placedBoard, depth - 1, allowedTileValues);

      if (result.score < worstScore) {
        worstScore = result.score;
        worstPlacement = {
          row: cell.row,
          col: cell.col,
          value: tileValue
        };
      }
    }
  }

  const finalResult = {
    score: worstScore,
    placement: worstPlacement
  };

  transpositionTable.set(key, finalResult);
  return finalResult;
}

function maximizeMove(board, depth, allowedTileValues) {
  const key = boardToKey(board, depth, "max", allowedTileValues);
  if (transpositionTable.has(key)) {
    return transpositionTable.get(key);
  }

  if (depth === 0) {
    const result = {
      score: evaluateBoard(board).totalScore
    };
    transpositionTable.set(key, result);
    return result;
  }

  const orderedMoves = DIRECTIONS
    .map(direction => {
      const moveResult = applyMove(board, direction);
      if (!moveResult.moved) return null;

      const immediateEval = evaluateBoard(moveResult.board).totalScore;
      return {
        direction,
        moveResult,
        orderingScore: immediateEval + moveResult.scoreGained * 2
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.orderingScore - a.orderingScore);

  let bestScore = -Infinity;
  let bestDirection = null;
  let bestReply = null;

  if (orderedMoves.length === 0) {
    const result = {
      score: evaluateBoard(board).totalScore,
      direction: null,
      placement: null
    };
    transpositionTable.set(key, result);
    return result;
  }

  for (const item of orderedMoves) {
    const minimized = minimizePlacement(
      item.moveResult.board,
      depth - 1,
      allowedTileValues
    );

    const combinedScore = minimized.score + item.moveResult.scoreGained * 2;

    if (combinedScore > bestScore) {
      bestScore = combinedScore;
      bestDirection = item.direction;
      bestReply = minimized.placement;
    }
  }

  const result = {
    score: bestScore,
    direction: bestDirection,
    placement: bestReply
  };

  transpositionTable.set(key, result);
  return result;
}

export function analyzeBestMove(board, depth = 3, allowedTileValues = [2, 4]) {
  transpositionTable.clear();

  const results = DIRECTIONS.map(direction => {
    const moveResult = applyMove(board, direction);

    if (!moveResult.moved) {
      return {
        direction,
        valid: false,
        totalScore: -Infinity
      };
    }

    const immediate = evaluateBoard(moveResult.board);
    const minimized = minimizePlacement(
      moveResult.board,
      depth - 1,
      allowedTileValues
    );

    return {
      direction,
      valid: true,
      totalScore: minimized.score + moveResult.scoreGained * 2,
      scoreGained: moveResult.scoreGained,
      evaluation: immediate,
      worstPlacement: minimized.placement
    };
  });

  const validResults = results.filter(result => result.valid);

  if (validResults.length === 0) {
    return {
      bestMove: null,
      message: "No valid moves available.",
      rankedMoves: results,
      depth
    };
  }

  validResults.sort((a, b) => b.totalScore - a.totalScore);
  const best = validResults[0];

  return {
    bestMove: best.direction,
    message: `Best move: ${capitalize(best.direction)} (pessimistic depth ${depth})`,
    bestEvaluation: best.evaluation,
    bestWorstPlacement: best.worstPlacement,
    rankedMoves: validResults,
    allMoves: results,
    depth
  };
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}