import { Room } from './models';

export const ValidateAndExtractRoomID = (room_id, errorCallback) =>
{
    if (room_id.length != 5)
    {
        errorCallback(`room_id is incorrect length ${room_id}`);
        return -1;
    }

    let room_id_num = Number(room_id);

    if (Number.isNaN(room_id_num))
    {
        errorCallback(`room_id is not a number ${room_id}`);
        return -1;
    }

    return room_id_num;
}

export const GetRoomByID = (room_id, foundCallback, missingCallback, errorCallback) =>
{
    // Validate the user_id
    if (typeof room_id == "string")
    {
        room_id = module.exports.ValidateAndExtractRoomID(room_id);

        if (room_id == -1)
        {
            missingCallback();
            return;
        }
    }

    Room.findOne({ room_id: room_id })
        .then((db_room) =>
        {
            if (db_room == null)
            {
                missingCallback();
            }

            else
            {
                foundCallback(db_room);
            }
        })
        .catch((err) =>
        {
            errorCallback(err);
        });
}