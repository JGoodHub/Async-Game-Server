
import fs from 'fs';
import express from 'express';
import cors from 'cors';

import mongoose from 'mongoose';

import { RegisterUserEndpoints } from './user_endpoints';
import { RegisterRoomEndpoints } from './room_endpoints';

const secretsData = fs.readFileSync('./secrets.json', { encoding: 'utf8', flag: 'r' });
const secretsJson = JSON.parse(secretsData);

const app = express();
const port = 5000;
const databaseURI = `mongodb+srv://${secretsJson["mongo"]["username"]}:${secretsJson["mongo"]["password"]}@cluster.tajracd.mongodb.net/?retryWrites=true&w=majority`;

app.use(cors());
app.use(express.json())

mongoose.set('strictQuery', true);

console.log("Mongoose: Establishing connection");

mongoose.connect(databaseURI)
    .then((result) => {
        console.log("Mongoose: Connection established");

        // Call to check the servers up

        app.get("/server_status", (req, res) => {
            res.sendStatus(200);
        });

        // Now we can start listening

        app.listen(port, () => {
            console.log(`Server: Listening on port ${port}`);
        });
    }).catch((err) => {
        console.log(`Mongoose: Failed to connect to database ${err}`);
    });

// Register user endpoints

RegisterUserEndpoints(app);

// Register room endpoints

RegisterRoomEndpoints(app);
