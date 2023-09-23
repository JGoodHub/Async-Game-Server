import { Schema, model, Document } from 'mongoose';


export interface ICompactUserData
{
    userId: Number,
    displayName: string,
    publicUserState?: string,
};

export const CompactUserSchema = new Schema<ICompactUserData>({
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

export interface IUser extends Document
{
    userId: Number,
    userName: string,
    userTag: Number,
    privateUserState?: string,
    publicUserState?: string,
    friendRequests?: [ICompactUserData]
    friends?: [ICompactUserData]
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
    friendRequests: [CompactUserSchema],    
    friends: [CompactUserSchema],    
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
    primaryUserData: ICompactUserData | null,
    secondaryUserData: ICompactUserData | null,
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
        type: CompactUserSchema,
        default: null
    },
    secondaryUserData: {
        type: CompactUserSchema,
        default: null
    },
    commandInvocations: [CommandSchema]
});

export const User = model<IUser>('User', UserSchema);
export const Room = model<IRoom>('Room', RoomSchema);