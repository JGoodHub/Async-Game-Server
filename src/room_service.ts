import { IRoom, IUser, Room } from './models';
import { GetRoomUserDataFromUser } from './user_service';
import { Destruct } from './utils';

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

export const GetRoomByID = async (roomId: Number): Promise<IRoom | null> =>
{
    return Room.findOne({ roomId: roomId });
}

export const CreateAndSaveNewRoom = async (primaryUser: IUser): Promise<IRoom> =>
{
    const roomUserData = GetRoomUserDataFromUser(primaryUser);

    let newRoom = new Room({
        roomId: Math.floor(Math.random() * 10000) + 10000,
        primary_user_data: roomUserData,
        room_status: 'WAITING_FOR_OPPONENT'
    });

    const [dbRoom, saveError] = await Destruct(newRoom.save());

    if (saveError)
        throw saveError;

    return dbRoom;
}
