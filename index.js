const express = require("express");
const cors = require('cors');

const mongoose = require('mongoose');
const User = require('./models.js').User;
const Room = require('./models.js').Room;

const UserService = require('./user_service.js');
const RoomService = require('./room_service.js');

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

    app.listen(port, () =>
    {
        console.log(`Game server listening on port ${port}`);
    });
}).catch((err) =>
{
    console.log(`Failed to connect to database ${err}`);
})

// ---------- USER ENDPOINTS ----------

app.get("/users/create_user_guest", (req, res) =>
{
    let new_user = new User({
        user_id: Math.floor(Math.random() * 10000) + 10000,
        user_tag: Math.floor(Math.random() * 1000)
    });

    new_user.save()
        .then((db_user) =>
        {
            console.log(`Created new guest user in the database\n${db_user}`);
            res.send(db_user);
        })
        .catch((err) =>
        {
            console.log(`Error while creating a new guest user ${err}`);
            res.sendStatus(500);
        });
});

app.get("/users/get_all_users", (req, res) =>
{
    User.find()
        .then((db_users) =>
        {
            console.log(`Request for all users ${db_users}`);
            res.send(db_users);
        })
        .catch((err) =>
        {
            console.log(`Error when fetching all users ${err}`);
            res.sendStatus(500);
        });
});

app.get("/users/get_user_by_id", (req, res) =>
{
    let user_id = UserService.ValidateAndExtractUserID(req.query.user_id);

    UserService.GetUserByID(user_id,
        (db_user) =>
        {
            console.log(`Request for user with the id ${user_id}`);
            res.send(db_user);
        },
        () =>
        {
            console.log(`Failed to find user with the id ${req.query.user_id}`);
            res.sendStatus(404);
        },
        (err) =>
        {
            console.log(`Error when searching for user with id ${req.query.user_id} ${err}`);
            res.sendStatus(500);
        });
});

// ---------- ROOM ENDPOINTS ---------- 

app.get("/rooms/create_room", (req, res) =>
{
    let room_id = RoomService.ValidateAndExtractRoomID(req.query.room_id);
    let user_id = UserService.ValidateAndExtractUserID(req.query.user_id);

    // Find the user creating the room
    UserService.GetUserByID(user_id,
        (db_user) =>
        {
            // Create the room with the populated primary user date
            let new_room = new Room({
                room_id: Math.floor(Math.random() * 10000) + 10000,
                primary_user_data: {
                    user_id: db_user.user_id,
                    display_name: `${db_user.user_name}#${db_user.user_tag}`,
                    public_user_state: db_user.public_user_state
                },
                room_status: 'WAITING_FOR_OPPONENT'
            });

            new_room.save()
                .then((db_room_saved) =>
                {
                    console.log(`Created new room in the database\n${db_room_saved}`);
                    res.send(db_room_saved);
                })
                .catch((err) =>
                {
                    console.log(`Error while creating a new room ${err}`);
                    res.sendStatus(500);
                });
        },
        () =>
        {
            console.log(`Failed to find user with the id ${req.query.user_id}`);
            res.sendStatus(404);
        },
        (err) =>
        {
            console.log(`Error when searching for user with id ${req.query.user_id} ${err}`);
            res.sendStatus(500);
        });
});

app.get("/rooms/join_room", (req, res) =>
{
    console.log(req.query.user_id);

    let room_id = RoomService.ValidateAndExtractRoomID(req.query.room_id);
    let user_id = UserService.ValidateAndExtractUserID(req.query.user_id);

    // Find the room we're joining in the database
    RoomService.GetRoomByID(room_id,
        (db_room) => // Found
        {
            // Find the user joining the room
            UserService.GetUserByID(user_id,
                (db_user) => // Found
                {
                    // Check we can join
                    if (db_room.secondary_user_data != null)
                    {
                        console.log(`Failed to join room as it is already full\n${db_room}`);
                        res.sendStatus(409);
                        return;
                    }

                    // Populate the secondary player info of the room
                    db_room.secondary_user_data = {
                        user_id: db_user.user_id,
                        display_name: `${db_user.user_name}#${db_user.user_tag}`,
                        public_user_state: db_user.public_user_state
                    }

                    db_room.room_status = 'ACTIVE';

                    db_room.save()
                        .then((db_room_saved) =>
                        {
                            console.log(`Joined room in the db\n${db_room_saved}`);
                            res.send(db_room_saved);
                        })
                        .catch((err) =>
                        {
                            console.log(`Error while updating the db room ${err}`);
                            res.sendStatus(500);
                        });
                },
                () => // Missing
                {
                    console.log(`Failed to find user with the id ${req.query.user_id}`);
                    res.sendStatus(404);
                    return;
                },
                (err) => // Error
                {
                    console.log(`Error when searching for user with id ${req.query.user_id} ${err}`);
                    res.sendStatus(500);
                    return;
                });
        },
        () => // Missing
        {
            console.log(`Failed to find room with the id ${req.query.room_id}`);
            res.sendStatus(409);
        },
        (err) => // Error
        {
            console.log(`Error when searching for a room with id ${req.query.room_id} ${err}`);
            res.sendStatus(500);
        });
});

app.get("/rooms/leave_room", (req, res) =>
{
    let room_id = RoomService.ValidateAndExtractRoomID(req.query.room_id);
    let user_id = UserService.ValidateAndExtractUserID(req.query.user_id);

    RoomService.GetRoomByID(room_id,
        (db_room) => // Found
        {
            // Check which player is leaving and update the room accordingly
            if (db_room.primary_user_data != null && user_id == db_room.primary_user_data.user_id)
            {
                db_room.primary_user_data = null;
                db_room.room_status = 'PLAYER_ONE_LEFT';
            }
            else if (db_room.secondary_user_data != null && user_id == db_room.secondary_user_data.user_id)
            {
                db_room.secondary_user_data = null;
                db_room.room_status = 'PLAYER_TWO_LEFT';
            }

            // If both players have left we consider the room closed
            if (db_room.primary_user_data == null && db_room.secondary_user_data == null)
            {
                db_room.room_status = 'CLOSED';
            }

            // Save the updated room to the db and send it back
            db_room.save()
                .then((db_room_saved) =>
                {
                    console.log(`Left room in the db\n${db_room_saved}`);
                    res.send(db_room_saved);
                })
                .catch((err) =>
                {
                    console.log(`Error when saving updated room with id ${room_id} ${err}`);
                    res.sendStatus(500);
                });
        },
        () => // Missing
        {
            console.log(`Failed to find room with the id ${room_id}`);
            res.sendStatus(404);
            return;
        },
        (err) => // Error
        {
            console.log(`Error when searching for a room with id ${room_id} ${err}`);
            res.sendStatus(500);
        });
});

app.get("/rooms/get_all_rooms", (req, res) =>
{
    Room.find()
        .then((db_rooms) =>
        {
            console.log(`Request for all rooms ${db_rooms}`);
            res.send(db_rooms);
        })
        .catch((err) =>
        {
            console.log(`Error when fetching all rooms ${err}`);
            res.sendStatus(500);
        });
});

app.get("/rooms/get_rooms_for_user_with_id", (req, res) =>
{
    let user_id = UserService.ValidateAndExtractUserID(req.query.user_id);

    Room.find({ $or: [{ "primary_user_data.user_id": user_id }, { "secondary_user_data.user_id": user_id }] })
        .then((result) =>
        {
            console.log(`Request for rooms for user with id ${user_id}`);
            res.send(result);
        })
        .catch((err) =>
        {
            console.log(`Error when searching for a rooms for the user with id ${req.query.user_id} ${err}`);
            res.sendStatus(500);
        });
});

