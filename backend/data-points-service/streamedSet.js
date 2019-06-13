const ReadWriteLock = require('rwlock')
const lock = new ReadWriteLock()

let methodCachesInProgress = new Map()

module.exports = function () {

    const streamedSet = {}

    /**
     * Function responsible for adding address + method to set containing currently processed data.
     *
     * Additionally it returns if pair (address, method) is already being processed.
     *
     * @param {string} address
     * @param {string} method
     * @param {number} latestBlock
     *
     * @return {Promise<number>} latestBlock from actual processing or
     *                           null if this pair is not being processed right now
     */
    streamedSet.addChannel = async function (address, method, latestBlock) {
        return await new Promise((resolve, reject) => {
            try {
                function addChannel(release) {
                    let channelName = address + method

                    if (methodCachesInProgress.has(channelName)) {
                        release()
                        return resolve(methodCachesInProgress.get(channelName))
                    }

                    methodCachesInProgress.set(channelName, latestBlock)
                    release()
                    return resolve(null)
                }
                lock.writeLock('setLock', addChannel)
            } catch (err) {
                reject(err)
            }
        })
    }

    /**
     * Function responsible for deleting addres + method from set
     *
     * @param address
     * @param method
     */
    streamedSet.deleteChannel = function (address, method) {
        function deleteChannel(release) {
            let channelName = address + method
            methodCachesInProgress.delete(channelName)
            release()
        }
        lock.writeLock('setLock', deleteChannel)
    }

    return streamedSet
}
