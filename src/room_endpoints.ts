import { ICommand, Room } from './models';

import { ExtractUserID, GetUserByID, GetRoomUserDataFromUser } from './user_service';
import { CreateAndSaveNewRoom, ExtractRoomID, GetRoomByID } from './room_service';
import { Destruct } from './utils';

export const RegisterRoomEndpoints = (app) =>
{

    app.get("/rooms/create_room", async (req, res) =>
    {

        let userId = ExtractUserID(req.query.userId, (err) =>
        {
            console.error(err);
            res.sendStatus(400);
            return;
        });

        // Find the user creating the room
        const [dbUser, getUserError] = await Destruct(GetUserByID(userId));

        if (getUserError)
        {
            console.error(`Server: Error when searching for user with id ${req.query.userId} ${getUserError}`);
            res.sendStatus(500);
            return;
        }

        // Can't find the user
        if (dbUser == null)
        {
            console.log(`Server: Failed to find user with the id ${req.query.userId}`);
            res.sendStatus(404);
            return;
        }

        // Create the room with the populated primary user date
        const [dbRoom, saveError] = await Destruct(CreateAndSaveNewRoom(dbUser));

        if (saveError)
        {
            console.error(`Server: Error while creating a new room ${saveError}`);
            res.sendStatus(500);
            return;
        }

        console.log(`Created new room in the database ${dbRoom.roomId}`);
        res.send(dbRoom);

    });

    app.get("/rooms/join_room", async (req, res) =>
    {

        const userId = ExtractUserID(req.query.userId, (err) =>
        {
            console.log(err);
            res.sendStatus(400);
            return;
        });

        const roomId = ExtractRoomID(req.query.roomId, (err) =>
        {
            console.log(err);
            res.sendStatus(400);
            return;
        });

        // Find the user joining the room
        const [dbUser, getUserError] = await Destruct(GetUserByID(userId));

        if (getUserError)
        {
            console.error(`Server: Error when searching for user with id ${userId} ${getUserError}`);
            res.sendStatus(500);
            return;
        }

        // Can't find the user
        if (dbUser == null)
        {
            console.log(`Server: Failed to find user with the id ${userId}`);
            res.sendStatus(404);
            return;
        }

        // Find the room we're joining in the database
        const [dbRoom, getRoomError] = await Destruct(GetRoomByID(roomId));

        if (getRoomError)
        {
            console.error(`Server: Error when searching for room with id ${roomId} ${getUserError}`);
            res.sendStatus(500);
            return;
        }

        // Can't find the room
        if (dbRoom == null)
        {
            console.log(`Server: Failed to find room with the id ${roomId}`);
            res.sendStatus(404);
            return;
        }

        // Check we can join
        if (dbRoom.secondaryUserData != null)
        {
            console.log(`Server: Failed to join room as it is already full\n${dbRoom}`);
            res.sendStatus(409);
            return;
        }

        // Populate the secondary player info of the room
        dbRoom.secondaryUserData = GetRoomUserDataFromUser(dbUser);
        dbRoom.room_status = 'ACTIVE';

        const [dbRoomSaved, roomSaveError] = await Destruct(dbRoom.save());

        if (roomSaveError) 
        {
            console.error(`Server: Error while updating the db room ${roomSaveError}`);
            res.sendStatus(500);
            return;
        }

        console.log(`Server: Joined room in the db ${dbRoomSaved.roomId}`);
        res.send(dbRoomSaved);

    });

    app.get("/rooms/create_or_join_room", async (req, res) =>
    {
        let userId = ExtractUserID(req.query.userId, (err) =>
        {
            console.log(err);
            res.sendStatus(400);
            return;
        });

        // Find the user creating/joining the room
        const [user, getUserError] = await Destruct(GetUserByID(userId));

        if (getUserError)
        {
            console.error(`Server: Error when searching for user with id ${userId} ${getUserError}`);
            res.sendStatus(500);
            return;
        }

        // Can't find the user
        if (user == null)
        {
            console.log(`Server: Failed to find user with the id ${userId}`);
            res.sendStatus(404);
            return;
        }


        // Look for available rooms to join,
        const [room, findRoomError] = await Destruct(Room.findOne({ roomStatus: 'WAITING_FOR_OPPONENT' }));

        if (findRoomError)
        {
            console.error(`Server: Error when searching for a rooms for the user with id ${req.query.userId} ${findRoomError}`);
            res.sendStatus(500);
            return;
        }

        // If there is one (that's not ours), join it
        // If there aren't any create a new one
        if (room == null || room.primaryUserData.userId == user.userId)
        {
            // Create the room with the populated primary user date
            const [newRoom, saveError] = await Destruct(CreateAndSaveNewRoom(user));

            if (saveError)
            {
                console.error(`Server: Error while creating a new room ${saveError}`);
                res.sendStatus(500);
                return;
            }

            console.log(`Server: Created new room in the database ${newRoom.roomId}`);
            res.send(newRoom);
            return;
        }
        else
        {
            // Populate the secondary player info of the room
            room.secondaryUserData = GetRoomUserDataFromUser(user);
            room.roomStatus = 'ACTIVE';

            const [roomSaved, roomSaveError] = await Destruct(room.save());

            if (roomSaveError) 
            {
                console.error(`Server: Error while updating the db room ${roomSaveError}`);
                res.sendStatus(500);
                return;
            }

            console.log(`Server: Joined room in the db ${roomSaved.roomId}`);
            res.send(roomSaved);
        }
    })

    app.get("/rooms/leave_room", async (req, res) =>
    {
        let roomId = ExtractRoomID(req.query.roomId, (err) =>
        {
            console.log(err);
            res.sendStatus(400);
            return;
        });

        let userId = ExtractUserID(req.query.userId, (err) =>
        {
            console.log(err);
            res.sendStatus(400);
            return;
        });

        // Find the room we're joining in the database
        const [room, findRoomError] = await Destruct(GetRoomByID(roomId));

        if (findRoomError)
        {
            console.error(`Server: Error when searching for room with id ${roomId} ${findRoomError}`);
            res.sendStatus(500);
            return;
        }

        // Can't find the room
        if (room == null)
        {
            console.log(`Server: Failed to find room with the id ${roomId}`);
            res.sendStatus(404);
            return;
        }

        // Check which player is leaving and update the room accordingly
        // If both players have left we consider the room closed
        if ((room.room_status == 'PLAYER_TWO_LEFT' && userId == room.primary_user_data.userId) ||
            (room.room_status == 'PLAYER_ONE_LEFT' && userId == room.secondary_user_data.userId))
        {
            room.room_status = 'CLOSED';
        }
        else if (userId == room.primary_user_data.userId)
        {
            room.room_status = 'PLAYER_ONE_LEFT';
        }
        else if (userId == room.secondary_user_data.userId)
        {
            room.room_status = 'PLAYER_TWO_LEFT';
        }

        // Save the updated room to the db and send it back
        const [roomSaved, roomSaveError] = await Destruct(room.save());

        if (roomSaveError) 
        {
            console.error(`Server: Error while updating the room ${roomId} ${roomSaveError}`);
            res.sendStatus(500);
            return;
        }

        console.log(`Server: User ${userId} left room in the db ${roomSaved.roomId}`);
        res.send(roomSaved);
    });

    app.get("/rooms/get_room_by_id", async (req, res) =>
    {
        let roomId = ExtractRoomID(req.query.roomId, (err) =>
        {
            console.log(err);
            res.sendStatus(400);
            return;
        });

        const [room, findRoomError] = await Destruct(GetRoomByID(roomId));

        if (findRoomError)
        {
            console.error(`Server: Error when searching for room with id ${roomId} ${findRoomError}`);
            res.sendStatus(500);
            return;
        }

        // Can't find the room
        if (room == null)
        {
            console.log(`Server: Failed to find room with the id ${roomId}`);
            res.sendStatus(404);
            return;
        }

        console.log(`Server: Request for room with the id ${roomId}`);
        res.send(room);

    });

    app.get("/rooms/get_all_rooms", (req, res) =>
    {
        Room.find()
            .then((dbRooms) =>
            {
                console.log(`Request for all rooms`);
                res.send(dbRooms);
            })
            .catch((err) =>
            {
                console.log(`Error when fetching all rooms ${err}`);
                res.sendStatus(500);
            });
    });

    app.get("/rooms/get_rooms_for_user_with_id", (req, res) =>
    {
        let userId = ExtractUserID(req.query.userId, (err) =>
        {
            console.log(err);
            res.sendStatus(400);
            return;
        });

        Room.find({ $or: [{ "primary_user_data.userId": userId }, { "secondary_user_data.userId": userId }] })
            .then((result) =>
            {
                console.log(`Request for rooms for user with id ${userId}`);
                res.send(result);
            })
            .catch((err) =>
            {
                console.log(`Error when searching for a rooms for the user with id ${req.query.userId} ${err}`);
                res.sendStatus(500);
            });
    });

    app.get("/rooms/get_rooms_with_status", (req, res) =>
    {
        let room_status_param = req.query.room_status;

        Room.find({ roomStatus: room_status_param })
            .then((result) =>
            {
                console.log(`Request for rooms with status ${room_status_param}`);
                res.send(result);
            })
            .catch((err) =>
            {
                console.log(`Error when searching for a rooms for the user with id ${req.query.userId} ${err}`);
                res.sendStatus(500);
            });
    });

    app.put("/rooms/send_command_to_room", async (req, res) =>
    {
        let userId = ExtractRoomID(req.query.userId, (err) =>
        {
            console.log(err);
            res.sendStatus(400);
            return;
        });

        let roomId = ExtractRoomID(req.query.roomId, (err) =>
        {
            console.log(err);
            res.sendStatus(400);
            return;
        });

        // Find the target room
        const [room, findRoomError] = await Destruct(GetRoomByID(roomId));

        if (findRoomError)
        {
            console.error(`Server: Error when searching for room with id ${roomId} ${findRoomError}`);
            res.sendStatus(500);
            return;
        }

        // Can't find the room
        if (room == null)
        {
            console.log(`Server: Failed to find room with the id ${roomId}`);
            res.sendStatus(404);
            return;
        }

        // Cretae the new command object and save it to the room
        const newCommand = req.body as ICommand;

        newCommand.senderUserId = userId;
        newCommand.timestamp = Date.now();

        room.commandInvocations.push(newCommand);

        const [roomSaved, saveRoomError] = await Destruct(room.save());

        if (saveRoomError) 
        {
            console.error(`Server: Error while saving the room ${roomId} ${saveRoomError}`);
            res.sendStatus(500);
            return;
        }

        console.log(`Server: User ${userId} added a new command to room ${roomSaved.roomId}`);
        res.send(roomSaved);

    });

}