import { WebSocketServer } from 'ws'


const port = process.env.PORT || 5000

// const app = express()
const wss = new WebSocketServer({ port: port })

wss.on('connection', (ws) => {
    ws.on('message', (msg) => {
        try {
            const data = JSON.parse(msg.toString())

            wss.clients.forEach((client) => {
                if (client.readyState === ws.OPEN) {
                    client.send(JSON.stringify(data))
                }
            })
        } catch (error) {
            console.log('invalid json');

        }
    })
})

console.log('WebSocket server running on ws://localhost:', port);


