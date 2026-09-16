const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;

const users = [
    {
        LastName: "Galleto",
        FirstName: "Bea",
        Email: "bea@gmail.com",
        Password: "1234567"
    },
    {
        LastName: "Corpuz",
        FirstName: "Benessa",
        Email: "benessa@gmail.com",
        Password: "abcdefg"
    },
    {
        LastName: "Frience",
        FirstName: "Kyle",
        Email: "frience@gmail.com",
        Password: "password123"
    }
];

app.get("/", (req, res) => {
    res.send("My Event-Driven API is running!");
});

app.get("/users", (req, res) => {
    res.json(users);
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});