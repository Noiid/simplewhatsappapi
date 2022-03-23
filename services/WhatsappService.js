const { WAConnection, ReconnectMode, MessageType, MessageOptions, Mimetype } = require('@adiwajshing/baileys');
const fs = require("fs");
const { FormatToIndonesian, FormatToWhatsappJid } = require('../helper/PhoneNumberFormatter');
const { ParseTextFromMessage } = require('../helper/MessageParser');

const SESSION_FILE_PATH = './session.json';

class WhatsappService {
    // siapkan object WAConnection
    conn = new WAConnection();

    constructor(){
        if (this.conn == null){
            this.conn = new WAConnection();
        }

        this.conn.autoReconnect = ReconnectMode.onConnectionLost;
        this.conn.on('open', () => {
            const authInfo = this.conn.base64EncodedAuthInfo();
            fs.writeFileSync(SESSION_FILE_PATH, JSON.stringify(authInfo, null, '\t'))
            const phoneNumber = FormatToIndonesian(conn.user.jid);
            console.log(phoneNumber);
        });
        this.conn.on('close', ({ reason }) => {
            console.log(reason);
            if (reason == 'invalid_session' && fs.existsSync(SESSION_FILE_PATH)){
                this.conn.close();
                this.conn.clearAuthInfo();
                fs.unlinkSync(SESSION_FILE_PATH);
                ConnectToWhatsApp();
            }
        });
        this.conn.on('qr', qr => {
            // Now, use the 'qr' string to display in QR UI or send somewhere
            console.log(qr);
        });
        this.conn.on('chat-update', chatUpdate => {
            if (!chatUpdate.messages || chatUpdate.count <= 0){
                return;
            }
        
            const message = chatUpdate.messages.all()[0]; // ambil chat terbaru
        
            const jid = message.key.remoteJid;
            const sender = FormatToIndonesian(jid);
            const text = ParseTextFromMessage(message);
        
            console.log('From', sender, 'Message:', text);
            this.conn.chatRead(jid, message.key.id);
        });
        this.conn.on('chats-received', async ({ hasNewChats }) => {
            const unreadMessages = await this.conn.loadAllUnreadMessages();
            console.log('Reading unread messages');
        
            unreadMessages.forEach(message => {
                const jid = message.key.remoteJid;
                const sender = FormatToIndonesian(jid);
                const text = ParseTextFromMessage(message);
        
                console.log('From', sender, 'Message:', text);
                this.conn.chatRead(jid, message.key.id);
            });
        });
    }
    
    async ConnectToWhatsApp() {
        if (this.conn.state != 'connecting'){
            // cek apakah ada session tersimpan, jika ada load sessionnya
            fs.existsSync(SESSION_FILE_PATH) && this.conn.loadAuthInfo(SESSION_FILE_PATH);
            await this.conn.connect({ timeoutMs: 30000 });
        }
    }
    
    async SendWhatsappSimpleMessage(phoneNumber, message){
        if (this.conn.state != "open"){
            return;
        }
    
        const jid = FormatToWhatsappJid(phoneNumber);
        await this.conn.sendMessage(jid, message, MessageType.text);
    }
};

module.exports = {
    WhatsappService
}