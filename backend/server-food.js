import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'

const app = express()

app.use(cors({
    origin: "http://localhost:3000"
}))
app.use(express.json())

const server = createServer(app)
const wss = new WebSocketServer({ server })
const port = process.env.PORT || 5000

const foods = [
    { id: 1, name: "Pizza", price: 250 },
    { id: 2, name: "Burger", price: 120 },
    { id: 3, name: "Sushi", price: 300 },
    { id: 4, name: "Fried Rice", price: 45 },
    { id: 5, name: "Pad Thai", price: 60 },
    { id: 6, name: "Ramen", price: 150 },
    { id: 7, name: "Chicken Rice", price: 50 },
    { id: 8, name: "Steak", price: 350 },
    { id: 9, name: "Spaghetti", price: 140 },
    { id: 10, name: "Sandwich", price: 80 },
    { id: 11, name: "Taco", price: 90 },
    { id: 12, name: "BBQ Pork", price: 200 },
    { id: 13, name: "Tom Yum", price: 120 },
    { id: 14, name: "Green Curry", price: 100 },
    { id: 15, name: "Som Tum", price: 50 },
    { id: 16, name: "Kebab", price: 130 },
    { id: 17, name: "Fish & Chips", price: 180 },
    { id: 18, name: "Nuggets", price: 70 },
    { id: 19, name: "Hot Dog", price: 60 },
    { id: 20, name: "Milk Tea", price: 40 }
];

let orders = []
let nextOrderId = 1

const Broadcast = (payload) => {
    const text = JSON.stringify(payload)
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(text)
        }
    })
}

// HTTP Endpoints
app.get('/foods', (req, res) => {
    res.json(foods)
})

app.get('/orders', (req, res) => {
    res.json(orders)
})

app.post('/orders', (req, res) => {
    try {
        const { FoodId, tableNo, qty } = req.body
        if (!FoodId || !tableNo || !qty) return res.status(500).json({ error: 'FoodId,tableNo,qty required' })

        const food = foods.find((f) => f.id === Number(FoodId))
        if (!food) return res.status(404).json({ error: 'Food not found' })

        const order = {
            id: nextOrderId++,
            FoodId: food.id,
            name: food.name,
            price: food.price,
            tableNo,
            qty: Number(qty),
            createdAt: new Date().toISOString()
        }

        orders.push(order)

        Broadcast({ type: 'new_order', order })

        return res.status(200).json(order)

    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Server error' })
    }
})

app.post('/orders/bulk', (req, res) => {
    const { tableNo, items } = req.body
    if (!Array.isArray(items)) return res.status(400).json({ error: 'invalid items' })
    items.forEach((item) => {
        const newOrder = {
            id: Date.now() + Math.random(),
            FoodId: item.FoodId,
            name: item.name,
            price: item.price,
            qty: item.qty,
            tableNo,
            createdAt: new Date()
        }
        orders.push(newOrder)
        wss.clients.forEach((clients) => {
            if (clients.readyState === 1) {
                clients.send(JSON.stringify({ type: 'new_order', order: newOrder }))
            }
        })
    })
    return res.json({ ok: true, count: items.length })
})

wss.on('connection', (ws) => {
    console.log('client connected via WS');

    ws.send(JSON.stringify({ type: 'init', orders }))

    ws.on('message', (msg) => {
        try {
            const data = JSON.parse(msg.toString())
            console.log('Ws recei:', data);

        } catch (error) {
            console.log('Ws non-json message:', msg.toString());

        }
    })
    ws.on('close', () => console.log('client disconnected'))
})





server.listen(port, () => {
    console.log(`🚿server Runing on http://localhost/${port}`);
    console.log(`WebSoket ready at ws://localhost/${port}`);

})