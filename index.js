const fs = require('fs');
const readline = require('readline');

// Function to decode value based on the given base
function decodeValue(base, value) {
    return parseInt(value, base);
}

// Function to read JSON from a file
function readJSON(filePath) {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
}

// Function to perform Lagrange interpolation to find the polynomial's constant term
function lagrangeInterpolation(points) {
    const n = points.length;
    let constantTerm = 0;

    for (let i = 0; i < n; i++) {
        let xi = points[i].x;
        let yi = points[i].y;

        let li = 1;
        for (let j = 0; j < n; j++) {
            if (i !== j) {
                let xj = points[j].x;
                li *= (0 - xj) / (xi - xj);
            }
        }
        constantTerm += yi * li;
    }

    return constantTerm;
}

// Function to find wrong points (imposter points)
function findWrongPoints(points, secret, threshold = 3) {
    const wrongPoints = [];

    points.forEach(point => {
        const estimatedY = decodeValue(point.base, point.value); // Decode the y value
        if (Math.abs(estimatedY - secret) > threshold) {
            wrongPoints.push(point);
        }
    });

    return wrongPoints;
}

// Function to find the secret from the selected test case or custom input
function findSecret(points) {
    // Calculate the secret (constant term)
    const secret = lagrangeInterpolation(points);
    console.log("Secret (constant term c):", Math.round(secret));
    return Math.round(secret);
}

// Function to get user input for custom test cases
async function getUserInput() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const points = [];

    // Ask for number of points (n) and required minimum points (k)
    const n = await new Promise((resolve) => {
        rl.question('Enter the number of points (n): ', (answer) => {
            const parsedN = parseInt(answer);
            if (isNaN(parsedN) || parsedN < 2) {
                console.log("Invalid number of points. Please enter a valid number.");
                return resolve(null);
            }
            return resolve(parsedN);
        });
    });

    if (!n) {
        rl.close();
        return points;
    }

    const k = await new Promise((resolve) => {
    rl.question('Enter the minimum number of points required (k): ', (answer) => {
        const parsedK = parseInt(answer);
        if (isNaN(parsedK) || parsedK > n || parsedK < 2) {
            console.log("Invalid minimum number of points. Please enter a valid number between 2 and n.");
            return resolve(null);
        }
        return resolve(parsedK);
    });
});
    if (!k) {
        rl.close();
        return points;
    }

    console.log(`Please enter the points in format: <base> <value>`);
    
  // Collect base and value for each point
for (let i = 1; i <= n; i++) {
    const input = await new Promise((resolve) => {
        rl.question(`Enter base and value for point ${i} (base value): `, resolve);
    });

    // Split the input and ensure to trim spaces
    const parts = input.split(' ').map(v => v.trim());

    // Check that we have exactly 2 parts
    if (parts.length === 2) {
        const base = decodeValue(10, parts[0]);
        const value = decodeValue(base, parts[1]);

        if (!isNaN(base) && !isNaN(value)) {
            const x = i;
            const y = decodeValue(base, value);
            points.push({ x, y, base: base, value: value });
        } else {
            console.log(`Invalid input for point ${i}. Please use the format <base> <value>.`);
            i--; // Retry if input is invalid
        }
    } else {
        console.log(`Invalid input format for point ${i}. Please ensure you enter both base and value separated by a space.`);
        i--; // Retry if input format is invalid
    }
}

    rl.close();
    return points;
}

// Main function to execute the logic
async function main() {
    console.log("Assignment Checkpoints:");
    console.log("1. Read the Test Case (Input) from a separate JSON file.");
    console.log("2. Decode the Y Values.");
    console.log("3. Find the Secret (C).");
    console.log("4. Find the wrong points on the curve.");

    const input = readJSON('./data/testcases.json');
    console.log("Available Test Cases:");
    const testcaseKeys = Object.keys(input.testcases);
    testcaseKeys.forEach((key, index) => {
        console.log(`${index + 1}: ${key}`);
    });

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Choose a test case number or type "custom" to enter your own: ', async (choice) => {
        let points = [];
        let secret = null;
        
        if (choice.toLowerCase() === "custom") {
            points = await getUserInput();
            if (points.length > 0) {
                secret = findSecret(points);
            }
        } else {
            const selectedTestCase = testcaseKeys[parseInt(choice) - 1];
            if (selectedTestCase) {
                const { n } = input.testcases[selectedTestCase].keys;

                Object.keys(input.testcases[selectedTestCase]).forEach(key => {
                    if (key !== 'keys') {
                        const base = parseInt(input.testcases[selectedTestCase][key].base);
                        const value = input.testcases[selectedTestCase][key].value;
                        const x = parseInt(key);
                        const y = decodeValue(base, value);
                        points.push({ x, y, base: base, value: value });
                    }
                });

                secret = findSecret(points);
            } else {
                console.log("Invalid choice, please try again.");
            }
        }

        // For the second test case, find wrong points
        if (testcaseKeys[1] && secret !== null) {  // Assuming the second test case is present
            const secondTestCasePoints = [];
            const secondTestCase = input.testcases[testcaseKeys[1]];

            Object.keys(secondTestCase).forEach(key => {
                if (key !== 'keys') {
                    const base = parseInt(secondTestCase[key].base);
                    const value = secondTestCase[key].value;
                    const x = parseInt(key);
                    const y = decodeValue(base, value);
                    secondTestCasePoints.push({ x, y, base: base, value: value });
                }
            });

            const wrongPoints = findWrongPoints(secondTestCasePoints, secret);
            if (wrongPoints.length > 0) {
                console.log("Wrong points (imposter points) in the second test case:");
                wrongPoints.forEach(point => {
                    console.log(`Point x: ${point.x}, Base: ${point.base}, Value: ${point.value}`);
                });
            } else {
                console.log("No wrong points found in the second test case.");
            }
        }

        rl.close();
    });
}

// Run the main function
main();
