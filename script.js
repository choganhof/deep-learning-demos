const inputs = [...document.querySelectorAll(".matrix-input")];
const resultCells = [...document.querySelectorAll(".result-cell")];
const nextCalculation = document.querySelector("#next-calculation");
const formula = document.querySelector("#formula");
const substitution = document.querySelector("#substitution");

let selectedRow = 0;
let selectedColumn = 0;

function readMatrix(name) {
  const values = [
    [0, 0],
    [0, 0]
  ];

  for (const input of inputs) {
    if (input.dataset.matrix === name) {
      const row = Number(input.dataset.row);
      const column = Number(input.dataset.col);
      const value = Number(input.value);
      values[row][column] = Number.isFinite(value) ? value : 0;
    }
  }

  return values;
}

function formatNumber(value) {
  return Object.is(value, -0) ? "0" : String(value);
}

function updateHighlights() {
  for (const input of inputs) {
    const row = Number(input.dataset.row);
    const column = Number(input.dataset.col);
    const isMatrixA = input.dataset.matrix === "a";

    input.classList.toggle("is-highlighted-row", isMatrixA && row === selectedRow);
    input.classList.toggle("is-highlighted-column", !isMatrixA && column === selectedColumn);
  }

  for (const cell of resultCells) {
    const isSelected = Number(cell.dataset.row) === selectedRow && Number(cell.dataset.col) === selectedColumn;
    cell.setAttribute("aria-pressed", String(isSelected));
  }
}

function updateResult() {
  const matrixA = readMatrix("a");
  const matrixB = readMatrix("b");

  for (const cell of resultCells) {
    const row = Number(cell.dataset.row);
    const column = Number(cell.dataset.col);
    const value = matrixA[row][0] * matrixB[0][column] + matrixA[row][1] * matrixB[1][column];
    cell.textContent = formatNumber(value);
  }

  const firstA = matrixA[selectedRow][0];
  const secondA = matrixA[selectedRow][1];
  const firstB = matrixB[0][selectedColumn];
  const secondB = matrixB[1][selectedColumn];
  const result = firstA * firstB + secondA * secondB;
  const rowLabel = selectedRow + 1;
  const columnLabel = selectedColumn + 1;

  formula.innerHTML = `C<sub>${rowLabel}${columnLabel}</sub> = (a<sub>${rowLabel}1</sub> &times; b<sub>1${columnLabel}</sub>) + (a<sub>${rowLabel}2</sub> &times; b<sub>2${columnLabel}</sub>)`;
  substitution.textContent = `(${formatNumber(firstA)} × ${formatNumber(firstB)}) + (${formatNumber(secondA)} × ${formatNumber(secondB)}) = ${formatNumber(result)}`;
  updateHighlights();
}

function selectResultCell(row, column) {
  selectedRow = row;
  selectedColumn = column;
  updateResult();
}

for (const input of inputs) {
  input.addEventListener("input", updateResult);
}

for (const cell of resultCells) {
  cell.addEventListener("click", () => {
    selectResultCell(Number(cell.dataset.row), Number(cell.dataset.col));
  });
}

nextCalculation.addEventListener("click", () => {
  const selectedIndex = resultCells.findIndex((cell) =>
    Number(cell.dataset.row) === selectedRow && Number(cell.dataset.col) === selectedColumn
  );
  const nextCell = resultCells[(selectedIndex + 1) % resultCells.length];
  selectResultCell(Number(nextCell.dataset.row), Number(nextCell.dataset.col));
});

updateResult();