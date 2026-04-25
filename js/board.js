export function createBoard(rows, cols) {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

export function clearBoard(board) {
  return board.map(row => row.map(() => 0));
}

export function cloneBoard(board) {
  return board.map(row => [...row]);
}

export function setCell(board, row, col, value) {
  const newBoard = cloneBoard(board);
  newBoard[row][col] = value;
  return newBoard;
}

function compressLine(line) {
  return line.filter(value => value !== 0);
}

function mergeLine(line) {
  const compressed = compressLine(line);
  const merged = [];
  let scoreGained = 0;

  for (let i = 0; i < compressed.length; i++) {
    if (compressed[i] !== 0 && compressed[i] === compressed[i + 1]) {
      const mergedValue = compressed[i] * 2;
      merged.push(mergedValue);
      scoreGained += mergedValue;
      i++;
    } else {
      merged.push(compressed[i]);
    }
  }

  return { line: merged, scoreGained };
}

function padLine(line, targetLength) {
  const padded = [...line];
  while (padded.length < targetLength) {
    padded.push(0);
  }
  return padded;
}

function processLeft(line, targetLength) {
  const { line: mergedLine, scoreGained } = mergeLine(line);
  return {
    line: padLine(mergedLine, targetLength),
    scoreGained
  };
}

function reverseLine(line) {
  return [...line].reverse();
}

function boardsEqual(boardA, boardB) {
  if (boardA.length !== boardB.length) return false;
  if (boardA[0].length !== boardB[0].length) return false;

  for (let r = 0; r < boardA.length; r++) {
    for (let c = 0; c < boardA[r].length; c++) {
      if (boardA[r][c] !== boardB[r][c]) {
        return false;
      }
    }
  }

  return true;
}

function getColumn(board, colIndex) {
  return board.map(row => row[colIndex]);
}

function setColumn(board, colIndex, columnValues) {
  const newBoard = cloneBoard(board);
  for (let r = 0; r < newBoard.length; r++) {
    newBoard[r][colIndex] = columnValues[r];
  }
  return newBoard;
}

export function moveLeft(board) {
  let totalScore = 0;
  const newBoard = board.map(row => {
    const result = processLeft(row, row.length);
    totalScore += result.scoreGained;
    return result.line;
  });

  return {
    board: newBoard,
    moved: !boardsEqual(board, newBoard),
    scoreGained: totalScore
  };
}

export function moveRight(board) {
  let totalScore = 0;
  const newBoard = board.map(row => {
    const reversed = reverseLine(row);
    const result = processLeft(reversed, row.length);
    totalScore += result.scoreGained;
    return reverseLine(result.line);
  });

  return {
    board: newBoard,
    moved: !boardsEqual(board, newBoard),
    scoreGained: totalScore
  };
}

export function moveUp(board) {
  let workingBoard = cloneBoard(board);
  let totalScore = 0;
  const cols = board[0].length;

  for (let c = 0; c < cols; c++) {
    const column = getColumn(workingBoard, c);
    const result = processLeft(column, column.length);
    totalScore += result.scoreGained;
    workingBoard = setColumn(workingBoard, c, result.line);
  }

  return {
    board: workingBoard,
    moved: !boardsEqual(board, workingBoard),
    scoreGained: totalScore
  };
}

export function moveDown(board) {
  let workingBoard = cloneBoard(board);
  let totalScore = 0;
  const cols = board[0].length;

  for (let c = 0; c < cols; c++) {
    const column = getColumn(workingBoard, c);
    const reversed = reverseLine(column);
    const result = processLeft(reversed, column.length);
    totalScore += result.scoreGained;
    workingBoard = setColumn(workingBoard, c, reverseLine(result.line));
  }

  return {
    board: workingBoard,
    moved: !boardsEqual(board, workingBoard),
    scoreGained: totalScore
  };
}

export function applyMove(board, direction) {
  switch (direction) {
    case "left":
      return moveLeft(board);
    case "right":
      return moveRight(board);
    case "up":
      return moveUp(board);
    case "down":
      return moveDown(board);
    default:
      return {
        board: cloneBoard(board),
        moved: false,
        scoreGained: 0
      };
  }
}