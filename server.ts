import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from './database/schema';

// FIX: Add user property to Express Request interface via declaration merging.
// This is the idiomatic way to handle this in Express and avoids type conflicts.
declare global {
    namespace Express {
        export interface Request {
            user?: User;
        }
    }
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8069;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("FATAL ERROR: JWT_SECRET is not defined. Please check your .env file.");
}

// --- Database Connection ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// --- Middleware ---
app.use(cors());
app.use(express.json());

const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
        if (err) {
            return res.status(403).json({ message: 'Failed to authenticate token' });
        }
        req.user = decoded.user;
        next();
    });
};

// --- API Routes ---

// [POST] /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        const userPayload = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };

        const token = jwt.sign({ user: userPayload }, JWT_SECRET, { expiresIn: '24h' });
        
        res.json({ token, user: userPayload });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// [GET] /api/site/content
app.get('/api/site/content', async (req, res) => {
    try {
        // We assume there's only one row for the main site content with id = 1
        const result = await pool.query('SELECT content FROM site_content WHERE id = 1');
        if (result.rows.length === 0) {
            return res.json({ content: [] }); // Return empty array if no content found
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching site content:', error);
        res.status(500).json({ message: 'Failed to fetch site content' });
    }
});


// [PUT] /api/site/content
app.put('/api/site/content', verifyToken, async (req: Request, res) => {
    const { content } = req.body;
     if (!req.user || req.user.role !== 'Developer') {
        return res.status(403).json({ message: 'Permission denied.' });
    }
    
    if (!content) {
        return res.status(400).json({ message: 'Content is required' });
    }

    try {
        const query = `
            INSERT INTO site_content (id, content)
            VALUES (1, $1)
            ON CONFLICT (id) 
            DO UPDATE SET content = $1, last_updated_at = NOW();
        `;
        await pool.query(query, [JSON.stringify(content)]);
        res.status(200).json({ message: 'Content saved successfully' });
    } catch (error) {
        console.error('Error saving site content:', error);
        res.status(500).json({ message: 'Failed to save site content' });
    }
});

// [GET] /api/products
app.get('/api/products', verifyToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT p.id, p.name, c.name as category, p.price FROM products p JOIN product_categories c ON p.category_id = c.id ORDER BY p.name');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Failed to fetch products' });
    }
});

// [GET] /api/inventory
app.get('/api/inventory', verifyToken, async (req, res) => {
    try {
        const query = `
            SELECT p.id, p.name, si.quantity as stock
            FROM products p
            LEFT JOIN stock_inventory si ON p.id = si.product_id
            ORDER BY p.name;
        `;
        const result = await pool.query(query);
        const inventory = result.rows.map(item => {
            let status = 'Out of Stock';
            if (item.stock > 10) status = 'In Stock';
            else if (item.stock > 0) status = 'Low Stock';
            return { ...item, status };
        });
        res.json(inventory);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ message: 'Failed to fetch inventory' });
    }
});

// [GET] /api/tickets
app.get('/api/tickets', verifyToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, subject, submitted_by_email as user, status, priority FROM support_tickets ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ message: 'Failed to fetch tickets' });
    }
});


// [GET] /api/users
app.get('/api/users', verifyToken, async (req, res) => {
    // Role-based access control
    if (req.user?.role !== 'Developer') {
         return res.status(403).json({ message: 'Permission denied. Only Developers can view users.' });
    }
    try {
        const result = await pool.query('SELECT id, name, email, role FROM users ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
});


// --- Server Start ---
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});