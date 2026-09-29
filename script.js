const inputs = [...document.querySelectorAll("#matrix-mode .matrix-input")];
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

const modeSelect = document.querySelector("#mode-select");
const pageTitle = document.querySelector("#page-title");
const pageDescription = document.querySelector("#page-description");
const matrixMode = document.querySelector("#matrix-mode");
const layerMode = document.querySelector("#layer-mode");
const layerInputs = [...document.querySelectorAll(".layer-input")];
const activationSelect = document.querySelector("#activation-select");
const activationDefinition = document.querySelector("#activation-definition");
const layerStepLabel = document.querySelector("#layer-step-label");
const layerFormula = document.querySelector("#layer-formula");
const layerSubstitution = document.querySelector("#layer-substitution");
const layerSteps = [
  { type: "dot", row: 0 },
  { type: "dot", row: 1 },
  { type: "bias", row: 0 },
  { type: "bias", row: 1 },
  { type: "activation", row: 0 },
  { type: "activation", row: 1 }
];
let currentLayerStep = 0;

function readLayerMatrix(name, rowCount, columnCount) {
  const values = Array.from({ length: rowCount }, () => Array(columnCount).fill(0));

  for (const input of layerInputs) {
    if (input.dataset.layerMatrix === name) {
      const row = Number(input.dataset.row);
      const column = Number(input.dataset.col);
      const value = Number(input.value);
      values[row][column] = Number.isFinite(value) ? value : 0;
    }
  }

  return values;
}

function formatLayerNumber(value) {
  return String(Number(value.toFixed(4)));
}

function applyActivation(value) {
  if (activationSelect.value === "tanh") {
    return Math.tanh(value);
  }

  if (value >= 0) {
    return 1 / (1 + Math.exp(-value));
  }

  const exponential = Math.exp(value);
  return exponential / (1 + exponential);
}

function updateLayerHighlights(step) {
  for (const element of document.querySelectorAll(".layer-input, .layer-value")) {
    element.classList.remove("layer-active-row", "layer-active-vector", "layer-step-focus");
  }

  const row = step.row;
  const focusOutput = (name) => {
    document.querySelector(`[data-layer-output="${name}"][data-row="${row}"]`).classList.add("layer-step-focus");
  };

  if (step.type === "dot") {
    for (const input of layerInputs) {
      if (input.dataset.layerMatrix === "w" && Number(input.dataset.row) === row) {
        input.classList.add("layer-active-row");
      } else if (input.dataset.layerMatrix === "x") {
        input.classList.add("layer-active-vector");
      }
    }
    focusOutput("wx");
  } else if (step.type === "bias") {
    focusOutput("wx");
    focusOutput("z");
    const biasInput = document.querySelector(`[data-layer-matrix="b"][data-row="${row}"]`);
    biasInput.classList.add("layer-step-focus");
  } else {
    focusOutput("z");
    focusOutput("a");
  }
}

function updateLayer() {
  const weights = readLayerMatrix("w", 2, 3);
  const inputVector = readLayerMatrix("x", 3, 1).map(([value]) => value);
  const bias = readLayerMatrix("b", 2, 1).map(([value]) => value);
  const weighted = weights.map((row) => row.reduce((sum, weight, column) => sum + weight * inputVector[column], 0));
  const preActivation = weighted.map((value, row) => value + bias[row]);
  const activation = preActivation.map(applyActivation);

  for (const output of document.querySelectorAll("[data-layer-output]")) {
    const row = Number(output.dataset.row);
    const values = { wx: weighted, z: preActivation, a: activation };
    output.textContent = formatLayerNumber(values[output.dataset.layerOutput][row]);
  }

  activationDefinition.innerHTML = activationSelect.value === "sigmoid"
    ? "sigmoid(z) = 1 / (1 + e<sup>&minus;z</sup>)"
    : "tanh(z)";

  const step = layerSteps[currentLayerStep];
  const row = step.row;
  const rowNumber = row + 1;

  if (step.type === "dot") {
    const terms = weights[row].map((_, column) =>
      `(w<sub>${rowNumber}${column + 1}</sub> &times; x<sub>${column + 1}</sub>)`
    );
    const numericTerms = weights[row].map((weight, column) =>
      `(${formatLayerNumber(weight)} &times; ${formatLayerNumber(inputVector[column])})`
    );
    layerStepLabel.textContent = `Forward pass ${currentLayerStep + 1} of ${layerSteps.length}: calculate (Wx)${rowNumber}`;
    layerFormula.innerHTML = `(Wx)<sub>${rowNumber}</sub> = ${terms.join(" + ")}`;
    layerSubstitution.innerHTML = `${numericTerms.join(" + ")} = ${formatLayerNumber(weighted[row])}`;
  } else if (step.type === "bias") {
    layerStepLabel.textContent = `Forward pass ${currentLayerStep + 1} of ${layerSteps.length}: add bias for z${rowNumber}`;
    layerFormula.innerHTML = `z<sub>${rowNumber}</sub> = (Wx)<sub>${rowNumber}</sub> + b<sub>${rowNumber}</sub>`;
    layerSubstitution.innerHTML = `${formatLayerNumber(weighted[row])} + (${formatLayerNumber(bias[row])}) = ${formatLayerNumber(preActivation[row])}`;
  } else {
    const activationName = activationSelect.value;
    layerStepLabel.textContent = `Forward pass ${currentLayerStep + 1} of ${layerSteps.length}: apply ${activationName} to z${rowNumber}`;
    layerFormula.innerHTML = `a<sub>${rowNumber}</sub> = ${activationName}(z<sub>${rowNumber}</sub>)`;
    layerSubstitution.textContent = `a${rowNumber} = ${activationName}(z${rowNumber}) = ${activationName}(${formatLayerNumber(preActivation[row])}) = ${formatLayerNumber(activation[row])}`;
  }

  updateLayerHighlights(step);
}

for (const input of layerInputs) {
  input.addEventListener("input", updateLayer);
}

activationSelect.addEventListener("change", updateLayer);

document.querySelector("#layer-next").addEventListener("click", () => {
  currentLayerStep = (currentLayerStep + 1) % layerSteps.length;
  updateLayer();
});

modeSelect.addEventListener("change", () => {
  const showLayer = modeSelect.value === "layer";
  matrixMode.hidden = showLayer;
  layerMode.hidden = !showLayer;
  pageTitle.textContent = showLayer ? "Inside a neural network layer" : "Multiply two matrices";
  pageDescription.textContent = showLayer
    ? "A layer multiplies its input by weights, adds a bias, then applies an activation."
    : "Matrix multiplication takes the dot product of a row from A with a column from B.";
});

updateLayer();