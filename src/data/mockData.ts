import { Tutorial } from '../types';

export const mockTutorials: Tutorial[] = [
  {
    id: 1,
    category: 'Desenvolvimento',
    subcategory: 'React',
    title: 'Como criar um componente funcional',
    primaryQuestion: 'Como começo com React moderno?',
    keywords: ['react', 'componente', 'javascript', 'frontend'],
    objective: 'Ensinar a base dos componentes funcionais no React.',
    steps: '1. Importe o React.\n2. Crie uma função que retorna JSX.\n3. Exporte a função.\n4. Utilize o componente em outro arquivo.',
  },
  {
    id: 2,
    category: 'Design',
    subcategory: 'UI/UX',
    title: 'Princípios do Glassmorphism',
    primaryQuestion: 'O que é Glassmorphism?',
    keywords: ['design', 'glassmorphism', 'css', 'estética'],
    objective: 'Explicar como aplicar o efeito de vidro em interfaces digitais.',
    steps: '1. Use um fundo colorido ou com imagem.\n2. Aplique um background semi-transparente.\n3. Adicione backdrop-filter: blur().\n4. Coloque uma borda fina e clara.',
  },
  {
    id: 3,
    category: 'Backend',
    subcategory: 'Node.js',
    title: 'Setup básico de Express',
    primaryQuestion: 'Como subir um servidor Express?',
    keywords: ['node', 'express', 'backend', 'api'],
    objective: 'Configurar um servidor web básico usando Node.js e Express.',
    steps: '1. Instale o express via npm.\n2. Importe o express.\n3. Inicialize o app.\n4. Defina uma rota e chame app.listen().',
  },
  {
    id: 4,
    category: 'Produtividade',
    subcategory: 'Ferramentas',
    title: 'Automatizando com Apps Script',
    primaryQuestion: 'Como integrar Planilhas com APIs?',
    keywords: ['google', 'apps script', 'automação', 'json'],
    objective: 'Criar um endpoint JSON a partir de uma planilha do Google.',
    steps: '1. Abra o Editor de Script.\n2. Use a função doGet().\n3. Retorne ContentService.createTextOutput().\n4. Publique como App da Web.',
  }
];
