const mongoose = require('mongoose')
const bcrypt = require('bcrypt-nodejs')

const userSchema = mongoose.Schema({
    username:{
        type: String,
        required: true,
        unique: 1,
        trim: true
    },
    password: {
        type: String,
        required: true,
    },
    //rooms: {
    //    type: [roomSchema]
    //}
})


userSchema.pre('save', function (next) {
    var user = this;
    let SALT = 10;

    if (user.isModified('password')) {
        bcrypt.genSalt(SALT, function (err, salt) {
            if (err) {
                return next(err);
            }

            bcrypt.hash(user.password, salt, null, function (err, hash) {
                if (err) {
                    return next(err);
                }
                user.password = hash;
                next();
            })
        })
    }
    else {
        next();
    }
})

userSchema.methods.comparePassword = function (candidatePassword, checkPassword) {
    bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
        if (err) {
            return checkPassword(err)
        }
        checkPassword(null, isMatch)
    })
}


const User = mongoose.model('User', userSchema)
module.exports = { User }