const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate a random secret for general use (e.g., SECRET)
const secret = crypto.randomBytes(32).toString('hex'); // 64 characters long

// Generate a random secret for JWT signing (e.g., JWT_SECRET)
const jwtSecret = crypto.randomBytes(64).toString('hex'); // 128 characters long

// Path to the .env file
const envFilePath = path.join(__dirname, '.env');

// Check if .env file exists, if not, create one
if (!fs.existsSync(envFilePath)) {
    fs.writeFileSync(envFilePath, '');
}

// Append the generated secrets to the .env file
const envContent = `
SECRET=${secret}
JWT_SECRET=${jwtSecret}
`;

// Write the generated secrets to the .env file
fs.appendFileSync(envFilePath, envContent.trim() + '\n');

