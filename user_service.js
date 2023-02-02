const mongoose = require('mongoose');
const User = require('./models.js').User;

const ValidateAndExtractUserID = function (user_id, errorCallback)
{
    if (user_id.length != 5)
    {
        errorCallback(`user_id is incorrect length ${user_id}`);
        return -1;
    }

    let user_id_num = Number(user_id);

    if (user_id_num == NaN)
    {
        errorCallback(`user_id is not a number ${user_id}`);
        return -1;
    }

    return user_id_num;
}

const GetUserByID = function (user_id, foundCallback, missingCallback, errorCallback)
{
    // Extract the user_id as a number if its a string
    if (typeof user_id == "string")
    {
        user_id = this.ValidateAndExtractUserID(user_id);

        if (user_id == -1)
        {
            missingCallback();
            return;
        }
    }

    // Find the first matching user in the db
    User.findOne({ user_id: user_id })
        .then((db_user) =>
        {
            if (db_user == null)
            {
                missingCallback()
            }
            else
            {
                foundCallback(db_user);
            }
        })
        .catch((err) =>
        {
            errorCallback(err);
        });
}

const GetRoomUserDataFromUser = function(db_user) {
    return {
        user_id: db_user.user_id,
        display_name: `${db_user.user_name}#${db_user.user_tag}`,
        public_user_state: db_user.public_user_state
    };
}

module.exports = {
    ValidateAndExtractUserID,
    GetUserByID,
    GetRoomUserDataFromUser
}