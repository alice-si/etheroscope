module.exports.errorHandle = (msg) => (error) => console.log("ERROR message:",msg,"\nerror is \n:",error)
module.exports.errorCallbackHandle = (msg,cb) => (error) => {
    console.error("ERROR message:",msg,"\nerror is \n:",error)
    cb(error)
}


