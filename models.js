const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    user_id: {
        type: Number,
        required: true,
    },
    user_name: {
        type: String,
        required: true,
        default: "Guest"
    },
    user_tag: {
        type: Number,
        required: true
    },
    private_user_state: {
        type: String,
        default: ""
    },
    public_user_state: {
        type: String,
        default: ""
    },
}, { timestamps: true });

const PublicUserDataSchema = new Schema({
    user_id: {
        type: Number
    },
    display_name: {
        type: String
    },
    public_user_state: {
        type: String
    }
});

const CommandSchema = new Schema({
    source_user_id: {
        type: Number,
        required: true
    },
    command_type: {
        type: String,
        required: true
    },
    data: {
        type: String,
        required: true
    }
});

const RoomSchema = new Schema({
    room_id: Number,
    primary_user_data: PublicUserDataSchema,
    secondary_user_data: PublicUserDataSchema,
    room_status: {
        type: String,
        enum: ['CREATED', 'WAITING_FOR_OPPONENT', 'ACTIVE', 'PLAYER_ONE_LEFT', 'PLAYER_TWO_LEFT', 'CLOSED', 'EXPIRED'],
        default: 'CREATED'
    },
    commandInvocations: [CommandSchema]
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Room = mongoose.model('Room', RoomSchema);

module.exports = { User, Room };