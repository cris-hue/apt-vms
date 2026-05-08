const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
// Default cors() allows all origins, which is perfect for your current dev setup
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/visitors', require('./routes/visitorRoutes'));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('joinTenantRoom', (tenantId) => {
    if (!tenantId) return;
    const room = `tenant_${tenantId}`;
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Database Connection & Server Start
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('🚀 SECURENEST IS LIVE AND RUNNING');
    
    const PORT = process.env.PORT || 5000;

    /**
     * ROBUST FIX:
     * We bind the server to '0.0.0.0'.
     * This ensures the backend accepts requests from:
     * 1. localhost (Your laptop browser)
     * 2. 127.0.0.1 (Loopback)
     * 3. 10.210.193.12 (Your Network IP / Your Phone)
     */
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server active on port ${PORT}`);
      console.log(`🔗 Local access:   http://localhost:${PORT}`);
      console.log(`🌐 Network access: http://10.210.193.12:${PORT}`);
      console.log('-------------------------------------------');
    });
  })
  .catch((err) => {
    console.error('❌ DB Connection Error:', err);
    process.exit(1); 
  });