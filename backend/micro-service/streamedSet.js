var ReadWriteLock = require('rwlock')
var lock = new ReadWriteLock()

var methodCachesInProgress = new Set()

module.exports = function () {

    const streamedSet = {}


    streamedSet.addChannel = function (address,method) {
        function addChannel(release) {
            var halo = "kalosze"
            console.log(halo)
            var channelName = address + method
            console.log(halo,channelName)
            // If there is already a caching process, we don't need to set one up
            if (!methodCachesInProgress.has(channelName)) methodCachesInProgress.add(channelName)
            release()
        }
        return lock.writeLock('setLock', addChannel)
    }

    streamedSet.deleteChannel = function (address,method) {
        function deleteChannel(release) {
            var channelName = address + method
            methodCachesInProgress.delete(channelName)
            release()
        }
        return lock.writeLock('setLock', deleteChannel)
    }

    return streamedSet
}
