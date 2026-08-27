const INSTITUTION_COLORS: Record<string, string> = {
  'Nubank': '#820AD1',
  'MeuPluggy': '#820AD1',
  'Itaú': '#EC7000',
  'Inter': '#FF7A00',
  'PicPay': '#22c55e',
  'Banco do Brasil': '#2563eb',
}

const INSTITUTION_LABELS: Record<string, string> = {
  'MeuPluggy': 'Nubank',
}

export function getInstitutionColor(institution: string): string {
  return INSTITUTION_COLORS[institution] ?? '#6b7280'
}

export function getInstitutionLabel(institution: string): string {
  return INSTITUTION_LABELS[institution] ?? institution
}

export default function BankIcon({ institution, size = 32 }: { institution: string; size?: number }) {
  const color = getInstitutionColor(institution)
  const label = getInstitutionLabel(institution)

  if (label === 'Nubank') {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
        <rect width="40" height="40" rx="10" fill={color} />
        <text
          x="20"
          y="26"
          textAnchor="middle"
          fill="white"
          fontSize="18"
          fontWeight="900"
          fontFamily="system-ui, sans-serif"
        >
          N
        </text>
      </svg>
    )
  }

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <rect width="40" height="40" rx="10" fill={color} />
      <text
        x="20"
        y="26"
        textAnchor="middle"
        fill="white"
        fontSize="14"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        {label.charAt(0)}
      </text>
    </svg>
  )
}
