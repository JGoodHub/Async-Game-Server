import { IRoom, IUser, Room } from './Models';
import { GetRoomUserDataFromUser } from './UserService';
import { Destruct } from './Utils';

export const ExtractRoomID = (roomId: string, reject): Number =>
{
    if (roomId.length != 5)
    {
        reject(`roomId is incorrect length ${roomId}`);
        return -1;
    }

    let roomId_num = Number(roomId);

    if (Number.isNaN(roomId_num))
    {
        reject(`roomId is not a number ${roomId}`);
        return -1;
    }

    return roomId_num;
}

export const GetRoomByID = async (roomId: Number): Promise<[IRoom | null, any]> =>
{
    return await Destruct<IRoom>(Room.findOne({ roomId: roomId }));
}

export const GetRoomByStatus = async (roomStatus: string): Promise<[IRoom | null, any]> =>
{
    return await Destruct<IRoom>(Room.findOne({ roomStatus: roomStatus }));
}

export const CreateAndSaveNewRoom = async (primaryUser: IUser): Promise<[IRoom, any]> =>
{
    const roomUserData = GetRoomUserDataFromUser(primaryUser);

    let newRoom = new Room({
        roomId: Math.floor(Math.random() * 10000) + 10000,
        primary_user_data: roomUserData,
        room_status: 'WAITING_FOR_OPPONENT'
    });

    const [roomSaved, saveError] = await Destruct<IRoom>(newRoom.save());

    if (roomSaved == null)
        return [newRoom, new Error("ERROR: Attempted to save room but document was returned as null")];

    return [roomSaved, saveError];
}
