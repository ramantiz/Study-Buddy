// Select the display and history elements
const out = document.getElementById('display');
const historyDiv = document.getElementById('history');
const scientificButtons = document.getElementById('scientific-buttons');
const toggleButton = document.querySelector('.toggle-scientific');

// Initialize calculation and display strings as empty strings
let calculation = "";
let displayCalculation = "";

// Initialize history array
let history = [];

// Introduce a flag to check if the last displayed value was a result
let resultDisplayed = false;

// Function to add numbers to the calculation
function addNumber(num) {
    if (resultDisplayed) {
        // If a result was just displayed, start a new calculation
        calculation = num;
        displayCalculation = num;
        resultDisplayed = false; // Reset the flag
    } else {
        // Append the number to the existing calculation
        calculation += num;
        displayCalculation += num;
    }
    updateDisplay();
}

// Function to add decimal point
function addDecimal() {
    if (resultDisplayed) {
        // Start new calculation with '0.'
        calculation = "0.";
        displayCalculation = "0.";
        resultDisplayed = false;
    } else {
        // Prevent multiple decimals in a single number
        const lastNumber = displayCalculation.split(/[\+\-\*\/\^\(\)]/).pop();
        if (!lastNumber.includes('.')) {
            calculation += '.';
            displayCalculation += '.';
        }
    }
    updateDisplay();
}

// Function to add operators with validation
function addOperator(op) {
    if (calculation === "" && op !== "-") {
        // Prevent starting the expression with an operator except minus
        return;
    }

    if (resultDisplayed) {
        resultDisplayed = false;
    }

    if (/[+\-*/^]$/.test(calculation)) {
        // Replace the last operator if two operators are entered consecutively
        calculation = calculation.slice(0, -1) + op;
        displayCalculation = displayCalculation.slice(0, -1) + opSymbol(op);
    } else {
        calculation += op;
        displayCalculation += opSymbol(op);
    }
    updateDisplay();
}

// Function to map operator symbols for display
function opSymbol(op) {
    const symbols = {
        '/': '÷',
        '*': '×',
        '-': '-',
        '+': '+',
        '^': '^'
    };
    return symbols[op] || op;
}

function addFunction(func) {
    if (resultDisplayed) {
        calculation = "";
        displayCalculation = "";
        resultDisplayed = false;
    }

    let functionStr, displayStr;

    if (func === 'sqrt') {
        functionStr = `Math.sqrt(`;
        displayStr = `√(`;
    } else if (func === 'ln') {
        functionStr = `ln(`; // Use custom ln function
        displayStr = `ln(`;
    } else if (func === 'log') {
        functionStr = `Math.log10(`;
        displayStr = `log(`;
    } else {
        functionStr = `Math.${func}(`;
        displayStr = `${func}(`;
    }

    calculation += functionStr;
    displayCalculation += displayStr;

    updateDisplay();
}




// Function to add constants
function addConstant(constant) {
    if (resultDisplayed) {
        calculation = "";
        displayCalculation = "";
        resultDisplayed = false;
    }

    const constants = {
        'π': 'Math.PI',
        // Add more constants if needed
    };
    calculation += constants[constant];
    displayCalculation += constant;
    updateDisplay();
}

// Function to toggle sign
function toggleSign() {
    if (calculation === "" || displayCalculation === "") return;

    if (resultDisplayed) {
        // If a result was just displayed, toggle its sign
        calculation = (-parseFloat(calculation)).toString();
        displayCalculation = calculation;
        updateDisplay();
        resultDisplayed = false;
        return;
    }

    // Use regular expression to find the last number in the calculation
    // Match any sequence of digits (including decimals) that may start with a '-'
    let regex = /(-?\d+(\.\d+)?)(?!.*\d)/;
    let match = calculation.match(regex);

    if (match) {
        let number = match[0];
        let startIndex = match.index;

        // Toggle the sign of the number
        let toggledNumber;
        if (number.startsWith('-')) {
            toggledNumber = number.substring(1); // Remove '-' to make it positive
        } else {
            toggledNumber = '-' + number; // Add '-' to make it negative
        }

        // Replace the number in the calculation string
        calculation = calculation.substring(0, startIndex) + toggledNumber + calculation.substring(startIndex + number.length);

        // Do the same for the displayCalculation
        displayCalculation = displayCalculation.substring(0, startIndex) + toggledNumber + displayCalculation.substring(startIndex + number.length);

        updateDisplay();
    } else {
        // If the calculation doesn't match the regex (unlikely), do nothing
        console.warn("No number found to toggle sign.");
    }
}


// Function to handle percentage
function percentage() {
    if (calculation === "" || displayCalculation === "") return;

    if (resultDisplayed) {
        resultDisplayed = false;
    }

    // Find the last number and convert it to percentage
    let tokens = calculation.split(/([+\-*/^])/);
    let displayTokens = displayCalculation.split(/([+\-*/^])/);
    let lastTokenIndex = tokens.length - 1;

    let lastNumber = tokens[lastTokenIndex];
    let lastDisplayNumber = displayTokens[lastTokenIndex];

    if (lastNumber === "" || /[+\-*/^]/.test(lastNumber)) {
        // If the last token is an operator or empty, do nothing
        return;
    }

    let percentValue = parseFloat(lastNumber) / 100;
    tokens[lastTokenIndex] = percentValue;
    displayTokens[lastTokenIndex] = percentValue;

    calculation = tokens.join('');
    displayCalculation = displayTokens.join('');
    updateDisplay();
}

// Function to add parentheses
function addParenthesis(paren) {
    if (resultDisplayed) {
        calculation = "";
        displayCalculation = "";
        resultDisplayed = false;
    }

    calculation += paren;
    displayCalculation += paren;
    updateDisplay();
}

function balanceParentheses(expression) {
    let openParenCount = (expression.match(/\(/g) || []).length;
    let closeParenCount = (expression.match(/\)/g) || []).length;
    let missingCloseParens = openParenCount - closeParenCount;

    for (let i = 0; i < missingCloseParens; i++) {
        expression += ')';
    }

    return expression;
}


// Function to clear all
function allClear() {
    calculation = "";
    displayCalculation = "";
    out.textContent = "0";
    resultDisplayed = false;
    clearHistory();
    console.log("All Clear");
}

// Function to update the display
function updateDisplay() {
    out.textContent = displayCalculation || "0";
}

function calculate() {
    try {
        // Replace custom ln function with Math.log
        let evalCalculation = calculation
            .replace(/÷/g, '/')
            .replace(/×/g, '*')
            .replace(/π/g, Math.PI)
            .replace(/ln\(/g, 'Math.log('); // Add this line

        // Balance the parentheses before evaluation
        evalCalculation = balanceParentheses(evalCalculation);

        console.log('Calculation String:', calculation);
        console.log('Eval Calculation String:', evalCalculation);

        let result = eval(evalCalculation);

        // Handle cases where result is undefined, null, or NaN
        if (result === undefined || result === null || isNaN(result)) {
            result = 'Error';
            out.textContent = "Error";
            calculation = "";
            displayCalculation = "";
            resultDisplayed = false;
            return;
        } else {
            // Format result to avoid floating point precision issues
            result = parseFloat(result.toFixed(10));
        }

        // Add to history
        addToHistory(displayCalculation);

        // Update both calculation and display strings
        calculation = result.toString();
        displayCalculation = result.toString();

        // Update the display
        updateDisplay();

        // Set resultDisplayed flag to true
        resultDisplayed = true;
    } catch (error) {
        console.error("Calculation Error:", error);
        out.textContent = "Error";
        calculation = "";
        displayCalculation = "";
        resultDisplayed = false;
    }
}



// Function to add an entry to history (without result)
function addToHistory(expression) {
    const entry = document.createElement('div');
    entry.classList.add('history-entry');
    entry.textContent = `${expression}`;
    historyDiv.appendChild(entry); // Add new entries to the bottom

    // Save to history array
    history.push({ expression }); // Use push instead of unshift

    // Save to localStorage
    localStorage.setItem('calculatorHistory', JSON.stringify(history));

    // Optional: Limit history entries to a certain number (e.g., 10)
    if (history.length > 10) {
        history.shift(); // Remove the oldest entry from the array
        historyDiv.removeChild(historyDiv.firstChild); // Remove from the DOM
        localStorage.setItem('calculatorHistory', JSON.stringify(history));
    }
}

// Function to clear history
function clearHistory() {
    historyDiv.innerHTML = '';
    history = [];
    localStorage.removeItem('calculatorHistory');
}

// Function to delete the last character
function deleteLast() {
    if (calculation.length === 0) return; // Nothing to delete

    if (resultDisplayed) {
        calculation = "";
        displayCalculation = "";
        resultDisplayed = false;
    } else {
        // Remove the last character from calculation and displayCalculation
        calculation = calculation.slice(0, -1);
        displayCalculation = displayCalculation.slice(0, -1);
    }
    updateDisplay();
}

// Function to toggle scientific buttons
function toggleScientific() {
    if (scientificButtons.style.display === "none" || scientificButtons.style.display === "") {
        scientificButtons.style.display = "grid";
        toggleButton.textContent = "˄"; // Change to an up arrow to indicate collapse
    } else {
        scientificButtons.style.display = "none";
        toggleButton.textContent = "..."; // Change back to "..."
    }
}

// Persisting History Across Sessions
window.onload = function() {
    const savedHistory = JSON.parse(localStorage.getItem('calculatorHistory')) || [];
    history = savedHistory; // Load the saved history into the history array
    savedHistory.forEach(entry => {
        const historyEntry = document.createElement('div');
        historyEntry.classList.add('history-entry');
        historyEntry.textContent = `${entry.expression}`;
        historyDiv.appendChild(historyEntry); // Append to the bottom
    });
}
