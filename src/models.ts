import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document
{
    userId: Number,
    userName: string,
    userTag: Number,
    privateUserState?: string,
    publicUserState?: string,
};

export const UserSchema = new Schema<IUser>({
    userId: {
        type: Number,
        required: true,
    },
    userName: {
        type: String,
        required: true,
        default: "Guest"
    },
    userTag: {
        type: Number,
        required: true
    },
    privateUserState: {
        type: String,
        default: ""
    },
    publicUserState: {
        type: String,
        default: ""
    },
});

export interface IRoomUserData
{
    userId: Number,
    displayName: string,
    publicUserState?: string,
};

export const RoomUserDataSchema = new Schema<IRoomUserData>({
    userId: {
        type: Number,
        required: true,
    },
    displayName: {
        type: String,
        required: true
    },
    publicUserState: {
        type: String,
        default: ""
    }
});

export interface ICommand
{
    senderUserId: Number,
    commandType: String,
    timestamp: Number,
    data: String
}

export const CommandSchema = new Schema<ICommand>({
    senderUserId: {
        type: Number,
        required: true
    },
    commandType: {
        type: String,
        required: true
    },
    timestamp: {
        type: Number,
        required: true
    },
    data: {
        type: String,
        required: true
    }
});

export interface IRoom extends Document
{
    roomId: Number,
    roomStatus: string,
    primaryUserData: IRoomUserData | null,
    secondaryUserData: IRoomUserData | null,
    commandInvocations: [ICommand]
}

export const RoomSchema = new Schema<IRoom>({
    roomId: Number,
    roomStatus: {
        type: String,
        enum: ['CREATED', 'WAITING_FOR_OPPONENT', 'ACTIVE', 'PLAYER_ONE_LEFT', 'PLAYER_TWO_LEFT', 'CLOSED', 'EXPIRED'],
        default: 'CREATED'
    },
    primaryUserData: {
        type: RoomUserDataSchema,
        default: null
    },
    secondaryUserData: {
        type: RoomUserDataSchema,
        default: null
    },
    commandInvocations: [CommandSchema]
});

export const User = model<IUser>('User', UserSchema);
export const Room = model<IRoom>('Room', RoomSchema);