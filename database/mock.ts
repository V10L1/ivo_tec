import { UserRole, PageBlock } from '../types';
import { User } from './schema';

const MOCK_SITE_CONTENT: PageBlock[] = [
    {
        "id": "block_1",
        "type": "hero",
        "content": {
            "title": "Bem-vindo ao Mundo Moto",
            "subtitle": "Sua loja completa para as melhores motos do planeta. Comece sua aventura hoje.",
            "ctaText": "Explorar Coleção"
        }
    },
    {
        "id": "block_2",
        "type": "text",
        "content": {
            "heading": "Sobre Nossa Paixão",
            "body": "Nós vivemos e respiramos motocicletas. Nossa missão é fornecer aos colegas entusiastas máquinas de alta qualidade e serviço incomparável. Cada moto em nossa coleção é escolhida a dedo e inspecionada para garantir que atenda aos nossos altos padrões de desempenho e confiabilidade."
        }
    }
];

// Usa o localStorage para persistir as alterações entre recarregamentos para uma melhor experiência de demonstração.
const getInitialContent = (): PageBlock[] => {
    try {
        const stored = localStorage.getItem('mockSiteContent');
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error("Falha ao analisar o conteúdo do site mock do localStorage", e);
    }
    // Inicializa o localStorage se não estiver definido
    localStorage.setItem('mockSiteContent', JSON.stringify(MOCK_SITE_CONTENT));
    return MOCK_SITE_CONTENT;
};

// Camada de API Mock
export const mockApi = {
    login: async (email: string, pass: string): Promise<{ token: string; user: Omit<User, 'passwordHash' | 'createdAt'> }> => {
        const mockDevUser = { id: 'dev-user-1', name: 'Gamecard User', email: 'gamecardiv@gmail.com', role: UserRole.DEVELOPER };
        
        await new Promise(res => setTimeout(res, 500)); // Simula atraso de rede

        if (email.toLowerCase() === 'gamecardiv@gmail.com' && pass === 'senha12345') {
            const payload = { user: mockDevUser };
            const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }));
            const body = btoa(JSON.stringify(payload));
            const token = `${header}.${body}.`;
            return Promise.resolve({ token, user: mockDevUser });
        }
        
        return Promise.reject(new Error('Credenciais inválidas'));
    },
    getSiteContent: async (): Promise<{ content: PageBlock[] }> => {
        await new Promise(res => setTimeout(res, 500)); // Simula atraso de rede
        // Sempre lê do localStorage para obter a versão salva mais recente
        return Promise.resolve({ content: getInitialContent() });
    },
    saveSiteContent: async (content: PageBlock[], token: string | null): Promise<{ message: string }> => {
        await new Promise(res => setTimeout(res, 800)); // Simula atraso de rede

        if (!token) {
            return Promise.reject(new Error('Permissão negada. Nenhum token fornecido.'));
        }
        
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            // Esta é uma verificação simplificada para o ambiente mock, correspondendo à lógica original do servidor
            if (!payload.user || payload.user.role !== UserRole.DEVELOPER) {
                 return Promise.reject(new Error('Permissão negada.'));
            }
        } catch(e) {
             return Promise.reject(new Error('Token inválido.'));
        }

        localStorage.setItem('mockSiteContent', JSON.stringify(content));
        return Promise.resolve({ message: 'Conteúdo salvo com sucesso' });
    }
};