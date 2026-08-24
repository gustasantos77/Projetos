export const DEFAULT_CATEGORIES = [
  // Despesas
  { name: 'Alimentação', type: 'EXPENSE', icon: 'UtensilsCrossed', color: '#EF4444', keywords: ['ifood', 'rappi', 'uber eats', 'mcdonald', 'burger', 'pizza', 'restaurante', 'lanchonete', 'mercado', 'supermercado', 'padaria', 'feira'] },
  { name: 'Transporte', type: 'EXPENSE', icon: 'Car', color: '#F97316', keywords: ['uber', '99', 'taxi', 'gasolina', 'combustivel', 'estacionamento', 'pedagio', 'onibus', 'metro', 'bilhete'] },
  { name: 'Moradia', type: 'EXPENSE', icon: 'Home', color: '#8B5CF6', keywords: ['aluguel', 'condominio', 'agua', 'luz', 'energia', 'gas', 'internet', 'iptu'] },
  { name: 'Lazer', type: 'EXPENSE', icon: 'Gamepad2', color: '#EC4899', keywords: ['netflix', 'spotify', 'amazon prime', 'disney', 'hbo', 'cinema', 'show', 'bar', 'balada', 'fest'] },
  { name: 'Saúde', type: 'EXPENSE', icon: 'Heart', color: '#10B981', keywords: ['farmacia', 'medico', 'hospital', 'plano de saude', 'dentista', 'exame', 'remedio'] },
  { name: 'Educação', type: 'EXPENSE', icon: 'GraduationCap', color: '#3B82F6', keywords: ['escola', 'faculdade', 'curso', 'livro', 'educacao', 'udemy', 'alura'] },
  { name: 'Vestuário', type: 'EXPENSE', icon: 'Shirt', color: '#F59E0B', keywords: ['zara', 'hm', 'renner', 'riachuelo', 'clothing', 'roupa', 'sapato', 'tenis'] },
  { name: 'Serviços', type: 'EXPENSE', icon: 'Wrench', color: '#6366F1', keywords: ['academia', 'salao', 'barbeiro', 'lavanderia', 'conserto', 'manutencao'] },
  { name: 'Impostos', type: 'EXPENSE', icon: 'FileText', color: '#64748B', keywords: ['imposto', 'taxa', 'darf', 'ipva', 'iptu', 'tributo'] },
  { name: 'Transferência', type: 'EXPENSE', icon: 'ArrowLeftRight', color: '#94A3B8', keywords: ['transferencia', 'ted', 'doc', 'pix'] },
  // Receitas
  { name: 'Salário', type: 'INCOME', icon: 'Banknote', color: '#10B981', keywords: ['salario', 'vencimento', 'folha de pagamento'] },
  { name: 'Freelance', type: 'INCOME', icon: 'Briefcase', color: '#3B82F6', keywords: ['freelance', 'projeto', 'consultoria', 'servico'] },
  { name: 'Investimentos', type: 'INCOME', icon: 'TrendingUp', color: '#8B5CF6', keywords: ['rendimento', 'dividendo', 'juros', 'investimento', 'cdb', 'lci', 'lca'] },
  { name: 'Cashback', type: 'INCOME', icon: 'Percent', color: '#F59E0B', keywords: ['cashback', 'desconto', 'reembolso'] },
]

export function categorizeTransaction(description: string): string | null {
  const desc = description.toLowerCase()
  for (const cat of DEFAULT_CATEGORIES) {
    if (cat.keywords.some(kw => desc.includes(kw))) {
      return cat.name
    }
  }
  return null
}
