// api/usuario/usuario.routes.ts
// FIX: Alias express Request and Response to avoid conflict with DOM types.
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../../core/db';
import { verifyToken, checkModulePermission } from '../../core/auth.middleware';
import { UserRole } from '../../types';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET!;

// --- Rotas de Setup e Saúde (parte do núcleo de usuário) ---

router.get('/setup/status', async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        const result = await pool.query('SELECT COUNT(*) FROM users');
        const userCount = parseInt(result.rows[0].count, 10);
        res.json({ needsSetup: userCount === 0 });
    } catch (error) {
        console.error('Erro ao verificar o status da configuração:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

router.post('/setup/initialize', async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        const userCheck = await pool.query('SELECT COUNT(*) FROM users');
        if (parseInt(userCheck.rows[0].count, 10) > 0) {
            return res.status(403).json({ message: 'A configuração já foi concluída.' });
        }

        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios.' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        await pool.query(
            'INSERT INTO users (name, email, role, password_hash) VALUES ($1, $2, $3, $4)',
            [name, email.toLowerCase(), UserRole.DEVELOPER, passwordHash]
        );

        res.status(201).json({ message: 'Primeiro usuário administrador criado com sucesso.' });

    } catch (error) {
        console.error('Erro ao inicializar:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// --- Rotas de Autenticação ---
router.post('/auth/login', async (req: ExpressRequest, res: ExpressResponse) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'E-mail e senha são obrigatórios' });
    }

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
        const user = userResult.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        const permissionsResult = await pool.query('SELECT permissions FROM role_permissions WHERE role = $1', [user.role]);
        
        let permissions = [];
        if (permissionsResult.rows.length > 0) {
            const dbPermissions = permissionsResult.rows[0].permissions;
            // Garante que as permissões sejam um array, fazendo o parse se for uma string
            if (typeof dbPermissions === 'string') {
                permissions = JSON.parse(dbPermissions);
            } else if (Array.isArray(dbPermissions)) {
                permissions = dbPermissions;
            }
        }
        
        const userPayload = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };

        const token = jwt.sign({ user: userPayload }, JWT_SECRET, { expiresIn: '24h' });
        
        res.json({ token, user: userPayload, permissions });

    } catch (error) {
        console.error('Erro de login:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// Rota para verificar um token e obter dados do usuário atual
router.get('/auth/me', verifyToken, async (req: ExpressRequest, res: ExpressResponse) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Não autenticado' });
    }
    try {
        const permissionsResult = await pool.query('SELECT permissions FROM role_permissions WHERE role = $1', [req.user.role]);
        
        let permissions = [];
        if (permissionsResult.rows.length > 0) {
            const dbPermissions = permissionsResult.rows[0].permissions;
             // Garante que as permissões sejam um array, fazendo o parse se for uma string
            if (typeof dbPermissions === 'string') {
                permissions = JSON.parse(dbPermissions);
            } else if (Array.isArray(dbPermissions)) {
                permissions = dbPermissions;
            }
        }
        
        res.json({ user: req.user, permissions });
    } catch (error) {
        console.error('Erro ao buscar permissões do usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});


router.post('/auth/register', async (req: ExpressRequest, res: ExpressResponse) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Nome, e-mail e senha são obrigatórios.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        
        const result = await pool.query(
            'INSERT INTO users (name, email, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email.toLowerCase(), UserRole.DEVELOPER, passwordHash]
        );
        
        res.status(201).json(result.rows[0]);

    } catch (error: any) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'O e-mail já está em uso.' });
        }
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

router.post('/auth/reset-password', async (req: ExpressRequest, res: ExpressResponse) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'E-mail e nova senha são obrigatórios.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const result = await pool.query(
            'UPDATE users SET password_hash = $1 WHERE email = $2',
            [passwordHash, email.toLowerCase()]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado com este e-mail.' });
        }

        res.status(200).json({ message: 'Senha redefinida com sucesso.' });

    } catch (error) {
        console.error('Erro ao redefinir senha:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});

// --- Rotas de Gerenciamento de Usuários (Protegidas) ---

router.get('/users', verifyToken, checkModulePermission('USERS'), async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        const result = await pool.query('SELECT id, name, email, role FROM users ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

router.post('/users', verifyToken, checkModulePermission('USERS'), async (req: ExpressRequest, res: ExpressResponse) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const result = await pool.query(
            'INSERT INTO users (name, email, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [name, email.toLowerCase(), role, passwordHash]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error: any) {
        if (error.code === '23505') {
            return res.status(409).json({ message: 'O e-mail já está em uso.' });
        }
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

router.put('/users/:id', verifyToken, checkModulePermission('USERS'), async (req: ExpressRequest, res: ExpressResponse) => {
    const { id } = req.params;
    const { role } = req.body;

    if (req.user?.id === id) {
        return res.status(403).json({ message: 'Não é permitido alterar a própria função.' });
    }

    if (!role || !Object.values(UserRole).includes(role as UserRole) && typeof role !== 'string') { // Allow dynamic roles
        return res.status(400).json({ message: 'Função inválida fornecida.' });
    }
    
    try {
        const result = await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
            [role, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

router.delete('/users/:id', verifyToken, checkModulePermission('USERS'), async (req: ExpressRequest, res: ExpressResponse) => {
    const { id } = req.params;

    if (req.user?.id === id) {
        return res.status(403).json({ message: 'Não é permitido remover a si mesmo.' });
    }
    
    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Erro ao remover usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

// --- Rotas de Gerenciamento de Permissões (Protegidas) ---

router.get('/permissions', verifyToken, checkModulePermission('USERS'), async (req: ExpressRequest, res: ExpressResponse) => {
    try {
        const result = await pool.query('SELECT role, permissions FROM role_permissions');
        const permissionsByRole = result.rows.reduce((acc, row) => {
            acc[row.role] = row.permissions;
            return acc;
        }, {});
        res.json(permissionsByRole);
    } catch (error) {
        console.error('Erro ao buscar permissões:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

router.post('/permissions', verifyToken, checkModulePermission('USERS'), async (req: ExpressRequest, res: ExpressResponse) => {
    const { role, permissions = [] } = req.body;

    if (!role || typeof role !== 'string' || role.trim() === '') {
        return res.status(400).json({ message: 'O nome do grupo é obrigatório.' });
    }
    if (!Array.isArray(permissions)) {
        return res.status(400).json({ message: 'As permissões devem ser um array.' });
    }

    try {
        const existingRole = await pool.query('SELECT 1 FROM role_permissions WHERE role = $1', [role]);
        if (existingRole.rows.length > 0) {
            return res.status(409).json({ message: 'Um grupo com este nome já existe.' });
        }
        
        await pool.query('INSERT INTO role_permissions (role, permissions) VALUES ($1, $2)', [role, JSON.stringify(permissions)]);
        
        res.status(201).json({ message: `Grupo '${role}' criado com sucesso.` });
    } catch (error) {
        console.error('Erro ao criar grupo de permissões:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' });
    }
});


router.put('/permissions/:role', verifyToken, checkModulePermission('USERS'), async (req: ExpressRequest, res: ExpressResponse) => {
    const { role } = req.params;
    const { permissions } = req.body;

    if (!role) {
        return res.status(400).json({ message: 'Função inválida.' });
    }
    if (!Array.isArray(permissions)) {
        return res.status(400).json({ message: 'As permissões devem ser um array.' });
    }

    try {
        await pool.query('UPDATE role_permissions SET permissions = $1 WHERE role = $2', [JSON.stringify(permissions), role]);
        res.status(200).json({ message: `Permissões para '${role}' atualizadas com sucesso.` });
    } catch (error) {
        console.error('Erro ao atualizar permissões:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});

router.delete('/permissions/:role', verifyToken, checkModulePermission('USERS'), async (req: ExpressRequest, res: ExpressResponse) => {
    const { role } = req.params;

    // Prevenir a exclusão de grupos de sistema essenciais
    if (role === UserRole.DEVELOPER || role === UserRole.ADMIN) {
        return res.status(403).json({ message: 'Não é permitido remover grupos de sistema essenciais.' });
    }
    
    try {
        // Verificar se algum usuário está atribuído a este grupo
        const userCheckResult = await pool.query('SELECT COUNT(*) FROM users WHERE role = $1', [role]);
        const userCount = parseInt(userCheckResult.rows[0].count, 10);

        if (userCount > 0) {
            return res.status(409).json({ message: `Não é possível remover o grupo, pois ${userCount} usuário(s) estão atribuídos a ele. Reatribua os usuários antes de remover o grupo.` });
        }

        // Excluir o grupo
        const deleteResult = await pool.query('DELETE FROM role_permissions WHERE role = $1', [role]);
        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ message: 'Grupo não encontrado.' });
        }

        res.status(204).send(); // Sucesso, sem conteúdo
    } catch (error) {
        console.error(`Erro ao remover o grupo '${role}':`, error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
});


export default router;