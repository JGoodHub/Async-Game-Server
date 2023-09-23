import { ICompactUserData, User, IUser } from './Models';
import { Destruct } from './Utils';

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

export const GetUserByID = async (userId: Number): Promise<[IUser | null, any]> =>
{
    return await Destruct<IUser>(User.findOne({ userId: userId }));
}

export const CreateAndSaveGuestUser = async (): Promise<[IUser, any]> =>
{
    const newUser = new User({
        userId: Math.floor(Math.random() * 10000) + 10000,
        user_name: 'Guest',
        user_tag: Math.floor(Math.random() * 1000)
    });

    const [userSaved, saveError] = await Destruct<IUser>(newUser.save());

    if (userSaved == null)
        return [newUser, new Error("ERROR: Attempted to save user but document was returned as null")];

    return [userSaved, saveError];
}

export const GetRoomUserDataFromUser = (dbUser: IUser): ICompactUserData =>
{
    return {
        userId: dbUser.userId,
        displayName: `${dbUser.userName}#${dbUser.userTag}`,
        publicUserState: dbUser.publicUserState
    };
}