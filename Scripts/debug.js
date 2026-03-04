const { WebhookClient, EmbedBuilder } = require('discord.js');
const client = require('..');
module.exports = (client) => {

    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection:', reason);
 
    });

    process.on('uncaughtException', (error) => {
        console.error('Uncaught Exception:', error);
     
    });

    process.on('warning', (warning) => {
        console.warn('Warning:', warning);
     
    });

    process.on('beforeExit', (code) => {
        console.log('Process beforeExit:', code);
      
    });

    client.on('error', (error) => {
        console.error('Client Error:', error);
   
    });

    client.on('shardError', (error, shardID) => {
        console.error(`Shard ${shardID} Error:`, error);
     
    });

    client.on('warn', (info) => {
        console.warn('Client Warning:', info);

    });
};