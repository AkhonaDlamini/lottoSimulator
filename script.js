document.addEventListener("DOMContentLoaded", function(){

    // game state
    let credits = 250;
    let boards = [];
    let finalizedBoards = 0;
    let winningNumbers = [];
    let drawHistory = [];

    // DOM elements
    const creditsDisplay = document.getElementById("credits");
    const boardNoInput = document.getElementById("boardNo");
    const buyBoardsBtn = document.getElementById("buyBoardsBtn");
    const startDrawBtn = document.getElementById("startDrawBtn");
    const resetGameBtn = document.getElementById("resetGameBtn");
    const boardsContainer = document.getElementById('boardsContainer');
    const winningNumbersDisplay = document.getElementById('winningNumbers');
    const drawHistoryDisplay = document.getElementById('drawHistory');

    // event listeners
    buyBoardsBtn.addEventListener("click", buyBoards);
    startDrawBtn.addEventListener("click", startDraw);
    resetGameBtn.addEventListener("click", resetGame);

    // initialize the game
    updateCreditsDisplay();

    function buyBoards(){
        const numBoards = parseInt(boardNoInput.value);

        if (isNaN(numBoards)){
            alert('Please enter a valid number of boards');
            return;
        }
        
        if (numBoards < 1 || numBoards > 10) {
            alert('Number of boards must be between 1 and 10');
            return;
        }
        
        const totalCost = numBoards * 25;
        
        if (totalCost > credits) {
            alert('Not enough credits to purchase these boards');
            return;
        }
        
        // Deduct credits
        credits -= totalCost;
        updateCreditsDisplay();
        
        // Create boards
        for (let i = 0; i < numBoards; i++) {
            createBoard();
        }
        
        // Disable buy button if no credits left for another board
        if (credits < 25) {
            buyBoardsBtn.disabled = true;
        }
    }
    
    function createBoard() {
        const boardId = boards.length;
        const board = {
            id: boardId,
            numbers: [],
            finalized: false
        };
        boards.push(board);
        
        // Create board UI
        const boardElement = document.createElement('div');
        boardElement.className = 'board';
        boardElement.innerHTML = `
            <h3>Board ${boardId + 1}</h3>
            <div class="numbers-grid" id="grid-${boardId}"></div>
            <div class="board-footer">
                <div class="selected-numbers">Selected: <span id="selected-${boardId}"></span></div>
                <button class="finalize-btn" id="finalize-${boardId}" disabled>Finalize Board</button>
            </div>
        `;
        boardsContainer.appendChild(boardElement);
        
        // Create number buttons
        const grid = document.getElementById(`grid-${boardId}`);
        for (let i = 1; i <= 20; i++) {
            const numBtn = document.createElement('div');
            numBtn.className = 'number-btn';
            numBtn.textContent = i;
            numBtn.dataset.number = i;
            numBtn.addEventListener('click', () => toggleNumber(boardId, i));
            grid.appendChild(numBtn);
        }
        
        // Add finalize button event listener
        const finalizeBtn = document.getElementById(`finalize-${boardId}`);
        finalizeBtn.addEventListener('click', () => finalizeBoard(boardId));

        // Create Btn for Quick Pick functionality
        const quickPickBtn = document.createElement("button");
        quickPickBtn.className = "quick-pick-btn";
        quickPickBtn.textContent = "Quick Pick";
        quickPickBtn.addEventListener("click", ()=> quickPick(boardId));
        grid.parentNode.appendChild(quickPickBtn);
    }

    // Quick Pick function (//Additional Functionality)
    function quickPick(boardId){
        
        const board = boards[boardId];
        if (board.finalized) return;  // Don't allow changes to finalized boards
    
        // Clear previous selections
        board.numbers = [];
        const numberBtns = document.querySelectorAll(`#grid-${boardId} .number-btn`);
        numberBtns.forEach(btn => {
            btn.classList.remove('selected');
        });
        
        const selectedNumbers = [];

        // Generate 6 random numbers that are not duplicated:
        while(selectedNumbers.length < 6){
            const randomNumber = Math.floor(Math.random() * 20) + 1;

            // checks if the generated random number exists
            if(!selectedNumbers.includes(randomNumber)){
                selectedNumbers.push(randomNumber);
            }
        }

         // Update UI and state
    selectedNumbers.forEach(num => {
        board.numbers.push(num);
        const numBtn = document.querySelector(`#grid-${boardId} .number-btn[data-number="${num}"]`);
        numBtn.classList.add('selected');
    });

    // Update display and finalize button state
    updateSelectedNumbersDisplay(boardId);
    document.getElementById(`finalize-${boardId}`).disabled = false;

    }
    
    function toggleNumber(boardId, number) {
        const board = boards[boardId];
        if (board.finalized) return;
        
        const numIndex = board.numbers.indexOf(number);
        const numBtn = document.querySelector(`#grid-${boardId} .number-btn[data-number="${number}"]`);
        
        if (numIndex === -1) {
            if (board.numbers.length >= 6) return;
            board.numbers.push(number);
            numBtn.classList.add('selected');
        } else {
            board.numbers.splice(numIndex, 1);
            numBtn.classList.remove('selected');
        }
        
        // Update selected numbers display
        updateSelectedNumbersDisplay(boardId);
        
        // Enable/disable finalize button
        const finalizeBtn = document.getElementById(`finalize-${boardId}`);
        finalizeBtn.disabled = board.numbers.length !== 6;
    }
    
    function updateSelectedNumbersDisplay(boardId) {
        const board = boards[boardId];
        const selectedDisplay = document.getElementById(`selected-${boardId}`);
        selectedDisplay.textContent = board.numbers.sort((a, b) => a - b).join(', ');
    }
    
    function finalizeBoard(boardId) {
        const board = boards[boardId];
        board.finalized = true;
        board.numbers.sort((a, b) => a - b);
        
        // Disable all number buttons for this board
        const numberBtns = document.querySelectorAll(`#grid-${boardId} .number-btn`);
        numberBtns.forEach(btn => {
            btn.style.cursor = 'default';
            if (!btn.classList.contains('selected')) {
                btn.style.opacity = '0.5';
            }
        });
        
        // Disable finalize button
        const finalizeBtn = document.getElementById(`finalize-${boardId}`);
        finalizeBtn.disabled = true;
        finalizeBtn.textContent = 'Finalized';
        
        finalizedBoards++;
        
        // Enable start draw button if at least one board is finalized
        if (finalizedBoards > 0) {
            startDrawBtn.disabled = false;
        }
    }
    
    function startDraw() {
        // Generate winning numbers
        winningNumbers = [];
        while (winningNumbers.length < 6) {
            const num = Math.floor(Math.random() * 20) + 1;
            if (!winningNumbers.includes(num)) {
                winningNumbers.push(num);
            }
        }
        winningNumbers.sort((a, b) => a - b);
        
        // Display winning numbers
        displayWinningNumbers();
        
        // Calculate winnings for each board
        let totalWinnings = 0;
        boards.forEach(board => {
            if (board.finalized) {
                const matches = calculateMatches(board.numbers, winningNumbers);
                const winnings = calculateWinnings(matches);
                totalWinnings += winnings;
                
                // Display results for this board
                displayBoardResults(board.id, matches, winnings);
            }
        });
        
        // Add to credits
        credits += totalWinnings;
        updateCreditsDisplay();
        
        // Add to draw history
        addToDrawHistory(totalWinnings);
        
        // Disable start draw button
        startDrawBtn.disabled = true;
        
        // Enable buy boards button if user has enough credits
        if (credits >= 25) {
            buyBoardsBtn.disabled = false;
        }
    }
    
    function calculateMatches(boardNumbers, winningNumbers) {
        return boardNumbers.filter(num => winningNumbers.includes(num)).length;
    }
    
    function calculateWinnings(matches) {
        switch(matches) {
            case 6: return 1000;
            case 5: return 500;
            case 4: return 200;
            case 3: return 50;
            case 2: return 10;
            default: return 0;
        }
    }
    
    function displayWinningNumbers() {
        winningNumbersDisplay.innerHTML = '';
        winningNumbers.forEach(num => {
            const numElement = document.createElement('div');
            numElement.className = 'winning-number';
            numElement.textContent = num;
            winningNumbersDisplay.appendChild(numElement);
        });
    }
    
    function displayBoardResults(boardId, matches, winnings) {
        const boardElement = document.querySelectorAll('.board')[boardId];
        const matchDisplay = document.createElement('div');
        matchDisplay.className = `match-display match-${matches}`;
        
        let resultText = '';
        if (winnings > 0) {
            resultText = `Matched ${matches} numbers! Won ${winnings} credits!`;
        } else {
            resultText = `Matched ${matches} numbers. No winnings.`;
        }
        
        matchDisplay.textContent = resultText;
        boardElement.appendChild(matchDisplay);
    }
    
    function addToDrawHistory(totalWinnings) {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const date = new Date().toLocaleString();
        historyItem.innerHTML = `
            <div><strong>${date}</strong></div>
            <div>Winning numbers: ${winningNumbers.join(', ')}</div>
            <div>Total winnings: ${totalWinnings} credits</div>
        `;
        
        drawHistoryDisplay.insertBefore(historyItem, drawHistoryDisplay.firstChild);
    }
    
    function resetGame() {
        if (confirm('Are you sure you want to reset the game? All progress will be lost.')) {
            credits = 250;
            boards = [];
            finalizedBoards = 0;
            winningNumbers = [];
            
            updateCreditsDisplay();
            boardsContainer.innerHTML = '';
            winningNumbersDisplay.innerHTML = '';
            
            buyBoardsBtn.disabled = false;
            startDrawBtn.disabled = true;
            boardNoInput.value = '1';
        }
    }
    
    function updateCreditsDisplay() {
        creditsDisplay.textContent = credits;
    }
});
