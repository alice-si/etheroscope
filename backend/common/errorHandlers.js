module.exports.errorHandle = (msg) => (error) => console.log("errorHandle: msg =",msg,"\nerror is \n:",error)
module.exports.errorCallbackHandle = (msg,cb) => (error) => {
    console.log("errorCallbackHandle: msg =",msg,"\nerror is \n:",error)
    cb(error)
}


