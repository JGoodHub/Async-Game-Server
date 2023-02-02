const User = require('./models.js').User;
const Room = require('./models.js').Room;

const UserService = require('./user_service.js');
const RoomService = require('./room_service.js');

module.exports = {
    RegisterEndpoints: (app) =>
    {

        app.get("/rooms/create_room", (req, res) =>
        {
            let user_id = UserService.ValidateAndExtractUserID(req.query.user_id, (err) =>
            {
                console.log(err);
                res.sendStatus(400);
                return;
            });

            // Find the user creating the room
            UserService.GetUserByID(user_id,
                (db_user) => // Found
                {
                    // Create the room with the populated primary user date
                    let room_user_data = UserService.GetRoomUserDataFromUser(db_user);

                    let new_room = new Room({
                        room_id: Math.floor(Math.random() * 10000) + 10000,
                        primary_user_data: room_user_data,
                        room_status: 'WAITING_FOR_OPPONENT'
                    });

                    new_room.save()
                        .then((db_room_saved) =>
                        {
                            console.log(`Created new room in the database ${db_room_saved.room_id}`);
                            res.send(db_room_saved);
                        })
                        .catch((err) =>
                        {
                            console.log(`Error while creating a new room ${err}`);
                            res.sendStatus(500);
                        });
                },
                () => // Missing
                {
                    console.log(`Failed to find user with the id ${req.query.user_id}`);
                    res.sendStatus(404);
                },
                (err) => // Error
                {
                    console.log(`Error when searching for user with id ${req.query.user_id} ${err}`);
                    res.sendStatus(500);
                });
        });

        app.get("/rooms/join_room", (req, res) =>
        {
            let room_id = RoomService.ValidateAndExtractRoomID(req.query.room_id, (err) =>
            {
                console.log(err);
                res.sendStatus(400);
                return;
            });

            let user_id = UserService.ValidateAndExtractUserID(req.query.user_id, (err) =>
            {
                console.log(err);
                res.sendStatus(400);
                return;
            });

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
                                    console.log(`Joined room in the db ${db_room_saved.room_id}`);
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
            let room_id = RoomService.ValidateAndExtractRoomID(req.query.room_id, (err) =>
            {
                console.log(err);
                res.sendStatus(400);
                return;
            });

            let user_id = UserService.ValidateAndExtractUserID(req.query.user_id, (err) =>
            {
                console.log(err);
                res.sendStatus(400);
                return;
            });

            console.log(room_id);
            console.log(user_id);

            RoomService.GetRoomByID(room_id,
                (db_room) => // Found
                {
                    // Check which player is leaving and update the room accordingly
                    // If both players have left we consider the room closed
                    if ((db_room.room_status == 'PLAYER_TWO_LEFT' && user_id == db_room.primary_user_data.user_id) ||
                        (db_room.room_status == 'PLAYER_ONE_LEFT' && user_id == db_room.secondary_user_data.user_id))
                    {
                        db_room.room_status = 'CLOSED';
                    }
                    else if (user_id == db_room.primary_user_data.user_id)
                    {
                        db_room.room_status = 'PLAYER_ONE_LEFT';
                    }
                    else if (user_id == db_room.secondary_user_data.user_id)
                    {
                        db_room.room_status = 'PLAYER_TWO_LEFT';
                    }

                    // Save the updated room to the db and send it back
                    db_room.save()
                        .then((db_room_saved) =>
                        {
                            console.log(`Left room in the db ${db_room_saved.room_id}`);
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

        app.get("/rooms/get_room_by_id", (req, res) =>
        {
            let room_id = RoomService.ValidateAndExtractRoomID(req.query.room_id, (err) =>
            {
                console.log(err);
                res.sendStatus(400);
                return;
            });

            RoomService.GetRoomByID(room_id,
                (db_room) => // Found
                {
                    console.log(`Request for room with the id ${room_id}`);
                    res.send(db_room);
                },
                () => // Missing
                {
                    console.log(`Failed to room with the id ${req.query.room_id}`);
                    res.sendStatus(404);
                },
                (err) => // Error
                {
                    console.log(`Error when searching for room with id ${req.query.room_id} ${err}`);
                    res.sendStatus(500);
                });
        });

        app.get("/rooms/get_all_rooms", (req, res) =>
        {
            Room.find()
                .then((db_rooms) =>
                {
                    console.log(`Request for all rooms`);
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
            let user_id = UserService.ValidateAndExtractUserID(req.query.user_id, (err) =>
            {
                console.log(err);
                res.sendStatus(400);
                return;
            });

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

        app.get("/rooms/get_rooms_with_status", (req, res) =>
        {            
            let room_status_param = req.query.room_status;

            Room.find({ room_status: room_status_param })
                .then((result) =>
                {
                    console.log(`Request for rooms with status ${room_status_param}`);
                    res.send(result);
                })
                .catch((err) =>
                {
                    console.log(`Error when searching for a rooms for the user with id ${req.query.user_id} ${err}`);
                    res.sendStatus(500);
                });
        });

        app.put("/rooms/send_command_to_room", (req, res) =>
        {
            let room_id = RoomService.ValidateAndExtractRoomID(req.query.room_id, (err) =>
            {
                console.log(err);
                res.sendStatus(400);
                return;
            });

            RoomService.GetRoomByID(room_id,
                (db_room) => // Found
                {
                    let newCommand = req.body;
                    newCommand.timestamp = Date.now();

                    db_room.commandInvocations.push(newCommand);

                    db_room.save()
                        .then((db_room_saved) =>
                        {
                            console.log(`New command added to room in the db ${db_room_saved.room_id}`);
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
                    console.log(`Failed to room with the id ${req.query.room_id}`);
                    res.sendStatus(404);
                },
                (err) => // Error
                {
                    console.log(`Error when searching for room with id ${req.query.room_id} ${err}`);
                    res.sendStatus(500);
                });
        });
    }
}