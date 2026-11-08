// Initial Data
const defaultNames = ["KING_YOSEF_", "Alice", "Bob", "Charlie", "Diana", "Ethan", "Fiona"];

// DOM Elements
const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const spinBtn = document.getElementById("spinBtn");
const updateBtn = document.getElementById("updateBtn");
const entriesInput = document.getElementById("entriesInput");
const winnerDisplay = document.getElementById("winnerDisplay");
const historyList = document.getElementById("historyList");

// State
let names = [];
let currentAngle = 0;
let isSpinning = false;
const spinDuration = 5000; // 5 seconds

// We will store the exact degree center of each slice here
let segmentAngles = []; 

const colors = [
    "#38bdf8", "#818cf8", "#c084fc", "#e879f9", 
    "#f472b6", "#fb7185", "#fbbf24", "#a3e635"
];

// Initialize
function init() {
    entriesInput.value = defaultNames.join("\n");
    updateWheel();
}

// Update names array from textarea
function updateWheel() {
    if (isSpinning) return;
    
    const text = entriesInput.value;
    names = text.split("\n").map(name => name.trim()).filter(name => name !== "");
    
    if (names.length === 0) {
        names = ["Add Names!"];
    }
    
    drawWheel();
}

// Draw the wheel on canvas
function drawWheel() {
    const numSegments = names.length;
    const arcSize = (2 * Math.PI) / numSegments;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2;

    // Reset the segment angles array
    segmentAngles = [];

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < numSegments; i++) {
        const startAngle = i * arcSize;
        const endAngle = startAngle + arcSize;

        // 1. Draw Segment
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 2;
        ctx.stroke();

        // 2. Calculate and store the exact center angle of this slice in DEGREES
        // Note: Canvas draws 0 at the 3 o'clock position. We add 90 degrees because our CSS pointer is at 12 o'clock.
        const centerAngleRad = startAngle + (arcSize / 2);
        let centerAngleDeg = (centerAngleRad * (180 / Math.PI)) + 90; 
        
        // Keep it between 0 and 360
        if (centerAngleDeg >= 360) centerAngleDeg -= 360;
        
        // Save this specific slice's center position
        segmentAngles.push({ index: i, centerDegree: centerAngleDeg });

        // 3. Draw Text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(centerAngleRad);
        ctx.textAlign = "right";
        ctx.textBaseline = "middle"; 
        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 20px Poppins";
        
        let displayName = names[i];
        if (displayName.length > 12) displayName = displayName.substring(0, 11) + "...";
        
        ctx.fillText(displayName, radius - 20, 0); 
        ctx.restore();
    }
}

// Spin Logic
function spinWheel() {
    if (isSpinning || names.length <= 1) return;

    isSpinning = true;
    spinBtn.disabled = true;
    winnerDisplay.textContent = "Spinning...";

    // Random spin: 5 to 10 full rotations + a random final angle
    const randomSpins = Math.floor(Math.random() * 5) + 5; 
    const randomDegrees = Math.random() * 360; 
    const totalRotation = (randomSpins * 360) + randomDegrees;

    currentAngle += totalRotation;
    
    canvas.style.transition = `transform ${spinDuration}ms cubic-bezier(0.17, 0.67, 0.1, 1)`;
    canvas.style.transform = `rotate(${currentAngle}deg)`;

    // Determine winner after animation
    setTimeout(() => {
        isSpinning = false;
        spinBtn.disabled = false;

        // Get the final resting angle of the wheel (0 to 360)
        let finalWheelAngle = currentAngle % 360;

        // Because the wheel spins clockwise, we need to find which slice center is closest to the top (0 degrees)
        // We add finalWheelAngle to our pre-calculated segment centers, and see which one becomes closest to 0 or 360.
        let winningSegment = null;
        let smallestDistance = 360;

        segmentAngles.forEach(segment => {
            // Calculate where this segment ends up after the spin
            let currentSegmentPos = (segment.centerDegree + finalWheelAngle) % 360;
            
            // Find the distance to the top pointer (which is at 0/360 degrees)
            // If it passed 360 and wrapped around to 10, we want the distance to 0
            let distanceToTop = Math.min(
                Math.abs(currentSegmentPos - 0), 
                Math.abs(currentSegmentPos - 360)
            );

            // The segment with the smallest distance to the top is the winner
            if (distanceToTop < smallestDistance) {
                smallestDistance = distanceToTop;
                winningSegment = segment.index;
            }
        });

        const winner = names[winningSegment];
        displayWinner(winner);
        
    }, spinDuration);
}

// Handle Winner Display
function displayWinner(winner) {
    winnerDisplay.textContent = winner;
    
    const li = document.createElement("li");
    li.textContent = winner;
    historyList.prepend(li); 

    if (historyList.children.length > 5) {
        historyList.removeChild(historyList.lastChild);
    }
}

// Event Listeners
spinBtn.addEventListener("click", spinWheel);
updateBtn.addEventListener("click", updateWheel);

entriesInput.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "Enter") {
        updateWheel();
    }
});

// Run on load
init();