import { User } from './models';

import { ValidateAndExtractUserID, GetUserByID } from './user_service';

export const RegisterUserEndpoints = (app) =>
{

    app.get("/users/create_user_guest", (req, res) =>
    {
        let new_user = new User({
            user_id: Math.floor(Math.random() * 10000) + 10000,
            user_tag: Math.floor(Math.random() * 1000)
        });

        new_user.save()
            .then((db_user) =>
            {
                console.log(`Created new guest user in the database ${db_user.user_id}`);
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
                console.log(`Request for all users`);
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
        let user_id = ValidateAndExtractUserID(req.query.user_id, (err) =>
        {
            console.log(err);
            res.sendStatus(400);
            return;
        });

        GetUserByID(user_id,
            (db_user) => // Found
            {
                console.log(`Request for user with the id ${user_id}`);
                res.send(db_user);
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

}