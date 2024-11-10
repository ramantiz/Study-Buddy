const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state flags
let isGameOver = false;

// Game variables
const player = {
    x: 0, // Will be set based on the first platform
    y: 0, // Will be set based on the first platform
    width: 60,
    height: 60,
    velocityX: 0,
    velocityY: 0,
    color: 'blue',
    isJumping: false,
    hasLanded: false, // Flag to prevent multiple score increments
};
const playerImage = new Image();
playerImage.src = 'player.png';

const platformImage = new Image();
platformImage.src = 'platform.png';

const jumpSound = new Audio('jump.mp3');
jumpSound.load();

const backSound = new Audio('music.mp3');
backSound.loop = true;
backSound.volume = 0.3;
backSound.load();


const backgroundImage = new Image();
backgroundImage.src = 'back.jpeg'

const bgVolumeSlider = document.getElementById('bgVolume');
const jumpVolumeSlider = document.getElementById('jumpVolume');

// Update background music volume
bgVolumeSlider.addEventListener('input', (e) => {
    backSound.volume = e.target.value;
});

// Update jump sound volume
jumpSound.volume = 0.5; // Initial volume
jumpVolumeSlider.addEventListener('input', (e) => {
    jumpSound.volume = e.target.value;
});

// Select the "Play Again" button
const playAgainButton = document.getElementById('playAgainButton');

// Attach click event listener
playAgainButton.addEventListener('click', resetGame);


let assetsLoaded = 0;

    // Function to check if all assets are loaded
    function checkAllAssetsLoaded() {
        assetsLoaded++;
        if (assetsLoaded === 4) { // playerImage, platformImage, backgroundImage, jumpSound
            startGame();
        }
    }


const platforms = [];
const gravity = 0.1;
const jumpForce = -6;
let score = 0;

// Variables for height tracking
let offsetY = 0;    // Total upward movement in pixels
let maxHeight = 0;  // Maximum height reached in pixels

// Game loop control
let animationId = null;

let gameMessage = '';          // The message to display
let messageDisplayTime = 0;

// Initialize personal record
let personalRecord = localStorage.getItem('doodleJumpPersonalRecord');
if (personalRecord === null) {
    personalRecord = 0;
} else {
    personalRecord = parseInt(personalRecord, 10);
}

window.addEventListener('DOMContentLoaded', (event) => {
    // Select the Reset Record button by its ID
    const resetRecordButton = document.getElementById('resetRecordButton');

    // Function to reset the personal record
    function resetPersonalRecord() {
        // Confirm the action with the user
        const userConfirmed = confirm('Are you sure you want to reset your personal record?');

        if (userConfirmed) {
        // Reset the personal record in localStorage
            localStorage.setItem('doodleJumpPersonalRecord', 0);

            // Update the personalRecord variable in your game logic
            personalRecord = 0;

        // Update the displayed personal record on the screen
            if (recordDisplay) {
                recordDisplay.textContent = `Record: ${personalRecord}`;
            }

            // Set the in-game message and display duration (e.g., 3 seconds)
            gameMessage = 'Personal record has been reset!';
            messageDisplayTime = Date.now() + 3000; // Current time + 3000 milliseconds

            // Optionally, re-render the canvas immediately to show the message
            render();
        }
    }

    // Attach the click event listener to the Reset Record button
    if (resetRecordButton) {
        resetRecordButton.addEventListener('click', resetPersonalRecord);
    } else {
        console.error('Reset Record button with ID "resetRecordButton" not found.');
    }
});


// Initialize platforms with the first platform at a fixed position
function createPlatforms() {
    platforms.length = 0; // Clear existing platforms

    // New dimensions for platforms
    const platformWidth = 70;  
    const platformHeight = 30; 

    // 1. Create the first platform at a fixed position
    const firstPlatform = {
        x: canvas.width / 2 - platformWidth / 2, // Centered horizontally
        y: canvas.height - 100,    // Positioned 100px from the bottom
        width: platformWidth,
        height: platformHeight,
    };
    platforms.push(firstPlatform);

    // 2. Position the player on the first platform (adjusted for new player size)
    player.x = firstPlatform.x + (firstPlatform.width - player.width) / 2;
    player.y = firstPlatform.y - player.height;

    // 3. Create additional platforms above the first platform
    let yPosition = firstPlatform.y - 150; // Start 150px above the first platform
    for (let i = 1; i < 6; i++) {
        platforms.push({
            x: Math.random() * (canvas.width - platformWidth),
            y: yPosition,
            width: platformWidth,
            height: platformHeight,
        });
        yPosition -= Math.random() * 60 + 90; // Random spacing between 90 and 150
    }
}

// Listen for player input
function handlePlayerInput() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            player.velocityX = -5;
            console.log('Left arrow pressed');
        }
        if (e.key === 'ArrowRight') {
            player.velocityX = 5;
            console.log('Right arrow pressed');
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            player.velocityX = 0;
            console.log(`${e.key} released`);
        }
    });
}

// Game loop
function gameLoop() {
    if (isGameOver) return; // Exit loop if game is over

    update();
    render();
    animationId = requestAnimationFrame(gameLoop);
}

// Update game logic
function update() {
    // Apply gravity
    player.velocityY += gravity;
    player.y += player.velocityY;
    player.x += player.velocityX;

    // Prevent player from moving off-screen
    if (player.x < 0) {
        player.x = 0;
        console.log('Player hit the left boundary');
    }
    if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
        console.log('Player hit the right boundary');
    }

    // Check for collision with platforms
    platforms.forEach((platform) => {
        // Player is falling
        if (
            player.velocityY > 0 &&
            player.y + player.height > platform.y &&
            player.y + player.height <= platform.y + platform.height &&
            player.x + player.width > platform.x &&
            player.x < platform.x + platform.width
        ) {
            if (!player.hasLanded) { // Only allow landing once per platform
                player.velocityY = jumpForce;
                player.isJumping = false; // Reset jumping state
                player.hasLanded = true;  // Prevent multiple landings on the same platform
                console.log('Player landed on a platform');
            }
            jumpSound.currentTime = 0; // Rewind to the start
            jumpSound.play().catch(error => {
                console.error('Failed to play jump sound:', error);
            });
        }
    });

    // Move platforms downward as the player moves up
    if (player.y < 200) {
        platforms.forEach((platform) => {
            platform.y += 3;
            if (platform.y > canvas.height) {
                // Recycle platform to the top with random x position
                const highestPlatform = platforms.reduce((min, p) => (p.y < min.y ? p : min), platforms[0]);
                platform.y = highestPlatform.y - Math.random() * 60 - 90;
                platform.x = Math.random() * (canvas.width - platform.width);
                console.log(`Platform recycled to x:${platform.x.toFixed(2)}, y:${platform.y}`);
            }
        });
        player.y += 3;

        // Increment offsetY by the amount scrolled
        offsetY += 3;

        // Update maxHeight if current offsetY is greater
        if (offsetY > maxHeight) {
            maxHeight = offsetY;
            score = Math.floor(maxHeight / 10); // Example: 1 point per 10 pixels
            console.log(`New maxHeight: ${maxHeight}, Score: ${score}`);

            if (score > personalRecord) {
                personalRecord = score;
                localStorage.setItem('doodleJumpPersonalRecord', personalRecord);
            }
        }
    }

    // Reset the hasLanded flag if the player is above the ground
    if (player.y + player.height < canvas.height) {
        player.hasLanded = false;
    }

    // Game over condition
    if (player.y + player.height > canvas.height) { // Corrected condition
        console.log('Game Over condition met');
        handleGameOver();
    }
}

// Handle Game Over
function handleGameOver() {
    if (isGameOver) return; // Prevent multiple executions
    isGameOver = true;

    // Pause background music
    backSound.pause();

    // Display game over within the canvas
    /*
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, canvas.height / 2 - 75, canvas.width, 150);
    ctx.fillStyle = 'white'; // Ensure text is white
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Game Over!`, canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '30px Arial';
    ctx.fillText(`Height: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
    
    // Display Personal Record
    if (personalRecord !== null) {
        ctx.fillText(`Record: ${personalRecord}`, canvas.width / 2, canvas.height / 2 + 60);
    }

    ctx.font = '20px Arial';
    ctx.fillText(`Click to Restart`, canvas.width / 2, canvas.height / 2 + 100);
    */
    // Stop the game loop
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    // Add a restart mechanism (click to restart)
    canvas.addEventListener('click', restartGame, { once: true });
    playAgainButton.style.display = 'block';
}


// Inside your existing render function
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background image
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

    // Draw platforms using images
    platforms.forEach((platform) => {
        ctx.drawImage(platformImage, platform.x, platform.y, platform.width, platform.height);
    });

    // Draw player image
    ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);

    // Draw current score in dark gray
    ctx.fillStyle = '#4a148c';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Height: ${score}`, 10, 30);

    // Draw personal record in dark gray
    if (personalRecord !== null) {
        ctx.fillText(`Record: ${personalRecord}`, 10, 60);
    }

    // **Display In-Game Message if Active**
    if (gameMessage && Date.now() < messageDisplayTime) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Semi-transparent background
        ctx.fillRect(canvas.width / 2 - 150, canvas.height / 2 - 40, 300, 60); // Background rectangle

        ctx.fillStyle = '#fff'; // White text
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(gameMessage, canvas.width / 2, canvas.height / 2);
    } else {
        // Clear the message once the display time has passed
        gameMessage = '';
    }

}


function resetGame() {
    // Reset game state
    player.velocityX = 0;
    player.velocityY = 0;
    score = 0;
    offsetY = 0;
    maxHeight = 0;
    isGameOver = false; // Reset the game over flag
    player.hasLanded = false; // Reset the landing flag

    // Recreate platforms and position the player
    createPlatforms();

    // Resume background music
    backSound.currentTime = 0; // Rewind to the start
    backSound.play().catch(error => {
        console.error('Failed to play background music:', error);
    });

    // Hide the "Play Again" button
    playAgainButton.style.display = 'none';

    // Unconditionally start the game loop
    gameLoop();
}


// Restart the game when the canvas is clicked after game over
function restartGame() {
    console.log('Restarting game...');
    resetGame();
    backSound.play()
}

function startGame() {
    backSound.play().catch(error => {
        console.error('Failed to play background music:', error);
    });
    createPlatforms();
    handlePlayerInput();
    gameLoop();
}

startGame();