var ReadWriteLock = require('rwlock')
var lock = new ReadWriteLock()


module.exports = function () {
    const streamedSet = {}

    streamedSet.methodCachesInProgress = new Set()

    streamedSet.addChannel = function (address,method) {
        lock.writeLock('setLock', (release) => {
            // If there is already a caching process, we don't need to set one up
            if (!streamedSet.methodCachesInProgress.has(address + method)) streamedSet.methodCachesInProgress.add(address + method)
            release()
        })
    }

    streamedSet.deleteChannel = function (address,method) {
        function deleteChannel(release) {
            methodCachesInProgress.delete(address + method)
            release()
        }
        lock.writeLock('setLock', deleteChannel)
    }


    return streamedSet
}
