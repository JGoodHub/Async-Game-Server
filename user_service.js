const mongoose = require('mongoose');
const User = require('./models.js').User;

module.exports = {
    ValidateAndExtractUserID: function (user_id, errorCallback)
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
    },
    GetUserByID: function (user_id, foundCallback, missingCallback, errorCallback)
    {
        // Validate the user_id
        if (typeof user_id == "string")
        {
            user_id = this.ValidateAndExtractUserID(user_id);

            if (user_id == -1)
            {
                missingCallback();
                return;
            }
        }

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
                // console.log(`Error when searching for user with id ${user_id} ${err}`);
            });
    }
}