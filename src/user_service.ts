import { IRoomUserData, User, IUser } from './models';
import { Destruct } from './utils';

export const ExtractUserID = (userId: string, reject): Number =>
{
    if (userId.length != 5)
    {
        reject(`Server: userId is incorrect length ${userId}`);
        return -1;
    }

    let userId_num = Number(userId);

    if (Number.isNaN(userId_num))
    {
        reject(`Server: userId is not a number ${userId}`);
        return -1;
    }

    return userId_num;
}

export const GetUserByID = async (userId: Number): Promise<IUser> =>
{
    const [dbUser, error] = await Destruct(User.findOne({ userId: userId }));

    if (error)
        throw error;

    if (dbUser)
        return dbUser;

    throw Error('not found');

}

export const CreateAndSaveGuestUser = async (): Promise<IUser> =>
{
    const newUser = new User({
        userId: Math.floor(Math.random() * 10000) + 10000,
        user_name: 'Guest',
        user_tag: Math.floor(Math.random() * 1000)
    });

    const [dbUser, saveError] = await Destruct(newUser.save());

    if (saveError)
        throw saveError;

    return dbUser;
}

export const GetRoomUserDataFromUser = (dbUser: IUser): IRoomUserData =>
{
    return {
        userId: dbUser.userId,
        displayName: `${dbUser.userName}#${dbUser.userTag}`,
        publicUserState: dbUser.publicUserState
    };
}