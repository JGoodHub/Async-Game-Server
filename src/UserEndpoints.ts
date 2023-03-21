import { IUser, User } from './Models';

import { CreateAndSaveGuestUser, ExtractUserID, GetUserByID } from './UserService';
import { Destruct } from './Utils';

export const RegisterUserEndpoints = (app) =>
{

    app.get("/users/create-user-guest", async (req, res) =>
    {
        const [dbUser, saveError] = await CreateAndSaveGuestUser();

        if (saveError)
        {
            console.log(`Server: Error while creating a new guest user ${saveError}`);
            res.sendStatus(500);
            return;
        }

        console.log(`Server: Created new guest user in the database ${dbUser.userId}`);
        res.send(dbUser);
    });

    app.get("/users/get-all-users", async (req, res) =>
    {
        const [dbUsers, findError] = await Destruct<IUser[]>(User.find());

        if (dbUsers == null || findError)
        {
            console.error(`Server: Error when fetching all users ${findError}`);
            res.sendStatus(500);
            return;
        }

        console.log(`Request for all users`);
        res.send(dbUsers);
    });

    app.get("/users/get-user-by-id", async (req, res) =>
    {
        const userId = ExtractUserID(req.query.userId, (invalidError) =>
        {
            console.error(invalidError);
            res.sendStatus(400);
            return;
        });

        const [dbUser, getUserError] = await Destruct(GetUserByID(userId));

        if (getUserError)
        {
            console.error(`Server: Error when searching for user with id ${req.query.userId}  ${getUserError}`);
            res.sendStatus(500);
            return;
        }

        if (dbUser)
        {
            console.log(`Server: Request for user with the id ${userId}`);
            res.send(dbUser); return;
        }

        console.log(`Server: Failed to find user with the id ${req.query.userId}`);
        res.sendStatus(404);
    });
}