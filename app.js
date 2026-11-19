import express from "express";
import cors from 'cors';
import bookRoutes from './routes/bookRoutes.js';
import studentRoutes from './routes/studentRoute.js';
import userRoute from "./routes/userRoutes.js"; 
import productRoutes from "./routes/productRoutes.js";

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Allow local frontend development origins
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Routes
app.use('/book', bookRoutes);
app.use('/student', studentRoutes);
app.use('/user', userRoute);
app.use('/product', productRoutes);
app.use('/api/products', productRoutes);

// Health check route
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const port = process.env.PORT || 3000;
try {
    app.listen(port, () => {
        console.log(`All Mighty Server listening on port ${port}...`);
    });
} catch(e) {
    console.error('Server error:', e);
}
