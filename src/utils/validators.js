// validation.js

// Function to validate an email address
function validateEmail(email) {
  // A basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Function to validate a username
function validateUsername(username) {
  // Username should contain only letters, numbers, underscores, and be between 3 and 20 characters
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

// Function to validate a full name
function validateFullName(fullName) {
  // Full name should contain only letters and spaces, and be between 2 and 50 characters
  const fullNameRegex = /^[a-zA-Z\s]{2,50}$/;
  return fullNameRegex.test(fullName);
}

// Function to validate a password
function validatePassword(password) {
  // Password should be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one digit
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
}
const validation = {
  validateEmail,
  validateUsername,
  validateFullName,
  validatePassword,
};
export default validation;

//   usage example
/*
// main.js

import validation from "./validation.js";

// Example usage
const email = "user@example.com";
const username = "my_username123";
const fullName = "John Doe";
const password = "P@ssw0rd";

console.log(`Email: ${validation.validateEmail(email)}`);
console.log(`Username: ${validation.validateUsername(username)}`);
console.log(`Full Name: ${validation.validateFullName(fullName)}`);
console.log(`Password: ${validation.validatePassword(password)}`);


    * returns true or false;
*/
