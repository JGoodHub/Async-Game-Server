
import fs from 'fs/promises';
import express from 'express';
import cors from 'cors';

import mongoose from 'mongoose';

import { RegisterUserEndpoints } from './user_endpoints';
import { RegisterRoomEndpoints } from './room_endpoints';


const secrets = await fs.readFile('./secrets.json').catch(err => console.log(err));

fs.readFile('./secrets.json')
    .then(data => console.log(data))
    .catch(err => console.log(err));

const app = express();
const port = 5000;
const databaseURI = "mongodb+srv://<username>>:<password>@cluster.tajracd.mongodb.net/?retryWrites=true&w=majority";

app.use(cors());
app.use(express.json())

mongoose.set('strictQuery', true);

console.log("Mongoose: establishing connection");

mongoose.connect(databaseURI)
    .then((result) =>
    {
        console.log("Mongoose: connection established");

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

RegisterUserEndpoints(app);

// Register room endpoints

RegisterRoomEndpoints(app);
