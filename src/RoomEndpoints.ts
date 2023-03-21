import { ICommand, IRoom, Room } from './Models';

import { ExtractUserID, GetUserByID, GetRoomUserDataFromUser } from './UserService';
import { CreateAndSaveNewRoom, ExtractRoomID, GetRoomByID, GetRoomByStatus } from './RoomService';
import { Destruct } from './Utils';

export const RegisterRoomEndpoints = (app) =>
{

    app.get("/rooms/create-room", async (req, res) =>
    {

        let userId = ExtractUserID(req.query.userId, (err) =>
        {
            console.error(err);
            res.sendStatus(400);
            return;
        });

        // Find the user creating the room
        const [user, getUserError] = await GetUserByID(userId);

        if (getUserError)
        {
            console.error(`Server: Error when searching for user with id ${req.query.userId} ${getUserError}`);
            res.sendStatus(500);
            return;
        }

        // Can't find the user
        if (user == null)
        {
            console.log(`Server: Failed to find user with the id ${req.query.userId}`);
            res.sendStatus(404);
            return;
        }

        // Create the room with the populated primary user date
        const [room, saveError] = await CreateAndSaveNewRoom(user);

        if (saveError)
        {
            console.error(`Server: Error while creating a new room ${saveError}`);
            res.sendStatus(500);
            return;
        }

        console.log(`Created new room in the database ${room.roomId}`);
        res.send(room);

    });

    app.get("/rooms/join-room", async (req, res) =>
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
        const [user, getUserError] = await GetUserByID(userId);

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

        // Find the room we're joining in the database
        const [room, getRoomError] = await GetRoomByID(roomId);

        if (getRoomError)
        {
            console.error(`Server: Error when searching for room with id ${roomId} ${getUserError}`);
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

        // Check we can join
        if (room.secondaryUserData != null)
        {
            console.log(`Server: Failed to join room as it is already full\n${room}`);
            res.sendStatus(409);
            return;
        }

        // Populate the secondary player info of the room
        room.secondaryUserData = GetRoomUserDataFromUser(user);
        room.roomStatus = 'ACTIVE';

        const [roomSaved, roomSaveError] = await Destruct<IRoom>(room.save());

        if (roomSaved == null || roomSaveError) 
        {
            console.error(`Server: Error while updating the room ${room.roomId} ${roomSaveError}`);
            res.sendStatus(500);
            return;
        }

        console.log(`Server: Joined room in the db ${roomSaved.roomId}`);
        res.send(roomSaved);

    });

    app.get("/rooms/create-or-join-room", async (req, res) =>
    {
        let userId = ExtractUserID(req.query.userId, (err) =>
        {
            console.log(err);
            res.sendStatus(400);
            return;
        });

        // Find the user creating/joining the room
        const [user, getUserError] = await GetUserByID(userId);

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
        const [room, getRoomError] = await GetRoomByStatus('WAITING_FOR_OPPONENT');

        if (getRoomError)
        {
            console.error(`Server: Error when searching for a rooms for the user with id ${req.query.userId} ${getRoomError}`);
            res.sendStatus(500);
            return;
        }

        // If there is one (that's not ours), join it
        // If there aren't any create a new one
        if (room == null || room.primaryUserData?.userId == user.userId)
        {
            // Create the room with the populated primary user date
            const [newRoom, roomSaveError] = await CreateAndSaveNewRoom(user);

            if (roomSaveError)
            {
                console.error(`Server: Error while creating a new room ${roomSaveError}`);
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

            const [roomSaved, roomSaveError] = await Destruct<IRoom>(room.save());

            if (roomSaved == null || roomSaveError) 
            {
                console.error(`Server: Error while updating the db room ${roomSaveError}`);
                res.sendStatus(500);
                return;
            }

            console.log(`Server: Joined room in the db ${roomSaved.roomId}`);
            res.send(roomSaved);
        }
    })

    app.get("/rooms/leave-room", async (req, res) =>
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
        const [room, getRoomError] = await GetRoomByID(roomId);

        if (getRoomError)
        {
            console.error(`Server: Error when searching for room with id ${roomId} ${getRoomError}`);
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
        if ((room.roomStatus == 'PLAYER_TWO_LEFT' && userId == room.primaryUserData?.userId) ||
            (room.roomStatus == 'PLAYER_ONE_LEFT' && userId == room.secondaryUserData?.userId))
        {
            room.roomStatus = 'CLOSED';
        }
        else if (userId == room.primaryUserData?.userId)
        {
            room.roomStatus = 'PLAYER_ONE_LEFT';
        }
        else if (userId == room.secondaryUserData?.userId)
        {
            room.roomStatus = 'PLAYER_TWO_LEFT';
        }

        // Save the updated room to the db and send it back
        const [roomSaved, roomSaveError] = await Destruct<IRoom>(room.save());

        if (roomSaved == null || roomSaveError) 
        {
            console.error(`Server: Error while updating the room ${roomId} ${roomSaveError}`);
            res.sendStatus(500);
            return;
        }

        console.log(`Server: User ${userId} left room in the db ${roomSaved.roomId}`);
        res.send(roomSaved);
    });

    app.get("/rooms/get-room-by-id", async (req, res) =>
    {
        let roomId = ExtractRoomID(req.query.roomId, (err) =>
        {
            console.log(err);
            res.sendStatus(400);
            return;
        });

        const [room, getRoomError] = await GetRoomByID(roomId);

        if (getRoomError)
        {
            console.error(`Server: Error when searching for room with id ${roomId} ${getRoomError}`);
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

    app.get("/rooms/get-all-rooms", async (req, res) =>
    {
        const [rooms, getRoomsError] = await Destruct<IRoom[]>(Room.find());

        if (rooms == null || getRoomsError)
        {
            console.error(`Server: Error when fetching all rooms ${getRoomsError}`);
            res.sendStatus(500);
            return;
        }

        console.log(`Server: Request for all rooms`);
        res.send(rooms);
    });

    app.get("/rooms/get-rooms-for-user-with-id", async (req, res) =>
    {
        const userId = ExtractUserID(req.query.userId, (err) =>
        {
            console.log(err);
            res.sendStatus(400);
            return;
        });

        const [rooms, getRoomsError] = await Destruct<IRoom[]>(Room.find({
            $or: [{ "primaryUserData.userId": userId }, { "secondaryUserData.userId": userId }]
        }));

        if (rooms == null || getRoomsError)
        {
            console.error(`Server: Error when searching for a rooms for the user with id ${req.query.userId} ${getRoomsError}`);
            res.sendStatus(500);
            return;
        }

        console.log(`Server: Request for rooms for user with id ${userId}`);
        res.send(rooms);
    });

    app.get("/rooms/get-rooms-with-status", async (req, res) =>
    {
        let roomStatusParam = req.query.roomStatus as string;

        const [rooms, getRoomsError] = await Destruct<IRoom[]>(Room.find({ roomStatus: roomStatusParam }));

        if (rooms == null || getRoomsError)
        {
            console.error(`Server: Error when searching for a rooms for the status ${req.query.roomStatus} ${getRoomsError}`);
            res.sendStatus(500);
            return;
        }

        console.log(`Server: Request for rooms with status ${roomStatusParam}`);
        res.send(rooms);
    });

    app.put("/rooms/send-command-to-room", async (req, res) =>
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
        const [room, getRoomError] = await GetRoomByID(roomId);

        if (getRoomError)
        {
            console.error(`Server: Error when searching for room with id ${roomId} ${getRoomError}`);
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

        // Create the new command object and save it to the room
        const newCommand = req.body as ICommand;

        newCommand.senderUserId = userId;
        newCommand.timestamp = Date.now();

        room.commandInvocations.push(newCommand);

        const [roomSaved, saveRoomError] = await Destruct<IRoom>(room.save());

        if (saveRoomError || roomSaved == null) 
        {
            console.error(`Server: Error while saving the room ${roomId} ${saveRoomError}`);
            res.sendStatus(500);
            return;
        }

        console.log(`Server: User ${userId} added a new command to room ${roomSaved.roomId}`);
        res.send(roomSaved);
    });

}