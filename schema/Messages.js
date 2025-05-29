import mongoose, { Schema } from "mongoose";

// interface messageInterface{
//     from: string,
//     to: string,
//     content: string,
//     timeStamp: Date,
// }


const messageSchema = new Schema({
    from:{
        type: String,
        required: true
    },
       to:{
        type: String,
        required: true
    },
       content:{
        type: String,
        required: true
    },
       timeStamp:{
        type: Date,
        default: Date.now
    },
})

const Message = mongoose.model('Message', messageSchema);

export default Message;
