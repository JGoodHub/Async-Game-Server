const express = require("express");
const cors = require('cors');

const mongoose = require('mongoose');

const UserEndpoints = require('./user_endpoints.js');
const RoomEndpoints = require('./room_endpoints.js');

const app = express();
const port = 5000;
const databaseURI = "mongodb+srv://dbAdmin:wordpass@basecluster.ebzkv8b.mongodb.net/game-server?retryWrites=true&w=majority";

app.use(cors());
app.use(express.json())

mongoose.connect(databaseURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then((result) =>
{
    console.log("Database connection established");

    // Call to check the servers up

    app.get("/server_status", (req, res) =>
    {
        res.sendStatus(200);
    });

    // Now we can start listening

    app.listen(port, () =>
    {
        console.log(`Game server listening on port ${port}`);
    });
}).catch((err) =>
{
    console.log(`Failed to connect to database ${err}`);
});

// Register user endpoints

UserEndpoints.RegisterEndpoints(app);

// Register room endpoints

RoomEndpoints.RegisterEndpoints(app);
