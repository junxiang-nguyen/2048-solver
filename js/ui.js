export function renderBoard(state, onCellClick) {
  const boardEl = document.getElementById("board");
  boardEl.innerHTML = "";
  boardEl.style.gridTemplateColumns = `repeat(${state.cols}, 80px)`;

  state.board.forEach((row, rowIndex) => {
    row.forEach((value, colIndex) => {
      const cell = document.createElement("div");
      cell.className = "cell";

      if (value === 0) {
        cell.classList.add("empty");
        cell.textContent = "0";
      } else {
        cell.textContent = value;
        cell.classList.add(`v${value}`);
      }

      cell.addEventListener("click", () => {
        onCellClick(rowIndex, colIndex);
      });

      boardEl.appendChild(cell);
    });
  });
}