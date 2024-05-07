// Import required modules
const bcrypt = require("bcrypt");
const cors = require("cors");
const express = require("express");
const jwt = require("jsonwebtoken");
const { z } = require("zod");

// Initialize the Express app
const app = express();
const port = 3000;
const saltRounds = 10;
const secret = "mysupersecret123!";

// Enable CORS
app.use(cors());

// Middleware to parse JSON requests
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} request for '${req.url}'`);
  next();
});

// Define a schema for validation using Zod
const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
});

// Define inmemory database
const users = [];

app.post("/api/v1/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Hash the password with a salt
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Store the email and hashed password in the database
    users.push({ email, password: hashedPassword });

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(400).json({ error: "One of the inputs is invalid" });
  }
});

const findUserByEmail = (email) => {
  return users.find((user) => user.email === email);
};

const findUserByEmailAndPassword = (email, password) => {
  console.log(email, password);
  const user = findUserByEmail(email);
  if (!user) {
    return null;
  }

  return bcrypt.compare(password, user.password) ? user : null;
};

// Define the POST endpoint for login
app.post("/api/v1/login", (req, res) => {
  // Validate the request body using the schema
  const validation = loginSchema.safeParse(req.body);
  if (!validation.success) {
    // If validation fails, return a 422 response with errors
    return res.status(422).json({ errors: validation.error.errors });
  }

  const { email, password } = validation.data;
  const user = findUserByEmailAndPassword(email, password);
  if (!user) {
    // If the user is not found, return a 400 response
    return res.status(400).json({ message: "Invalid email or password" });
  }

  // Perform your login logic here, e.g., authenticate with a database
  // For demonstration purposes, we'll assume a successful login
  // Generate a JWT
  const token = jwt.sign({ email }, secret, { expiresIn: "1h" });

  res.json({ message: "Login successful", token });
});

// Respond to readiness and liveness probes
app.get("/livez", (req, res) => {
  res.sendStatus(200); // Sends HTTP status 200 and closes the connection
});

app.get("/readyz", (req, res) => {
  res.sendStatus(200); // Sends HTTP status 200 and closes the connection
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
