var amqp = require('amqplib/callback_api')
const settings = require('../common/settings')

const opt = { credentials: require('amqplib').credentials.plain(settings.RABBITMQ.user,
        settings.RABBITMQ.password) }

amqp.connect(`amqp://${settings.RABBITMQ.address}`, opt, function(err, conn) {
    conn.createChannel(function(err, ch) {
        var msg = process.argv.slice(2).join(' ') || '0xab7c74abC0C4d48d1bdad5DCB26153FC8780f83E'

        ch.assertQueue(settings.RABBITMQ.queue, { durable: true, messageTtl: settings.RABBITMQ.messageTtl});
        ch.sendToQueue(settings.RABBITMQ.queue, new Buffer(msg), {persistent: true});
        console.log(" [x] Sent '%s'", msg);
    });
    setTimeout(function() { conn.close(); process.exit(0) }, 500);
});