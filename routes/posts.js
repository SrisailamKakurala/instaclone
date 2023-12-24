const mongoose = require('mongoose');

const postSchema = mongoose.Schema({  
  picture: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user"
  },
  date: {
    type: Date,
    default: Date.now()
  },
  likes: [
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    }
  ],
  caption: String,
})


module.exports = mongoose.model('post', postSchema);