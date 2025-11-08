import { UserRole, PageBlock } from '../types';
import { User } from './schema';

const MOCK_SITE_CONTENT: PageBlock[] = [
    {
        "id": "block_1",
        "type": "hero",
        "content": {
            "title": "Welcome to Moto World",
            "subtitle": "Your one-stop shop for the best bikes on the planet. Start your adventure today.",
            "ctaText": "Explore Collection"
        }
    },
    {
        "id": "block_2",
        "type": "text",
        "content": {
            "heading": "About Our Passion",
            "body": "We live and breathe motorcycles. Our mission is to provide fellow enthusiasts with top-quality machines and unparalleled service. Every bike in our collection is hand-picked and inspected to ensure it meets our high standards of performance and reliability."
        }
    }
];

// Use localStorage to persist changes across reloads for a better demo experience.
const getInitialContent = (): PageBlock[] => {
    try {
        const stored = localStorage.getItem('mockSiteContent');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error("Failed to parse mock site content from localStorage", e);
    }
    // Initialize localStorage if it's not set
    localStorage.setItem('mockSiteContent', JSON.stringify(MOCK_SITE_CONTENT));
    return MOCK_SITE_CONTENT;
};

// Mock API layer
export const mockApi = {
    login: async (email: string, pass: string): Promise<{ token: string; user: Omit<User, 'passwordHash' | 'createdAt'> }> => {
        const mockDevUser = { id: 'dev-user-1', name: 'Gamecard User', email: 'gamecardiv@gmail.com', role: UserRole.DEVELOPER };
        
        await new Promise(res => setTimeout(res, 500)); // Simulate network delay

        if (email.toLowerCase() === 'gamecardiv@gmail.com' && pass === 'senha12345') {
            const payload = { user: mockDevUser };
            const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
            const body = btoa(JSON.stringify(payload));
            const token = `${header}.${body}.`;
            return Promise.resolve({ token, user: mockDevUser });
        }
        
        return Promise.reject(new Error('Invalid credentials'));
    },
    getSiteContent: async (): Promise<{ content: PageBlock[] }> => {
        await new Promise(res => setTimeout(res, 500)); // Simulate network delay
        // Always read from localStorage to get the latest saved version
        return Promise.resolve({ content: getInitialContent() });
    },
    saveSiteContent: async (content: PageBlock[], token: string | null): Promise<{ message: string }> => {
        await new Promise(res => setTimeout(res, 800)); // Simulate network delay

        if (!token) {
            return Promise.reject(new Error('Permission denied. No token provided.'));
        }
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            // This is a simplified check for the mock environment, matching original server logic
            if (!payload.user || payload.user.role !== UserRole.DEVELOPER) {
                 return Promise.reject(new Error('Permission denied.'));
            }
        } catch(e) {
             return Promise.reject(new Error('Invalid token.'));
        }

        localStorage.setItem('mockSiteContent', JSON.stringify(content));
        return Promise.resolve({ message: 'Content saved successfully' });
    }
};
