interface LogoProps {
  /** Preset sizes: 'sm' = header (22px), 'md' = modal (24px), 'lg' = hero (38px) */
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: { square: 22, radius: 6, gap: 9, fontSize: 16 },
  md: { square: 24, radius: 7, gap: 10, fontSize: 17 },
  lg: { square: 38, radius: 10, gap: 15, fontSize: 26 },
}

export default function Logo({ size = 'sm' }: LogoProps) {
  const { square, radius, gap, fontSize } = sizes[size]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap }}>
      <span
        style={{
          display: 'inline-block',
          width: square,
          height: square,
          borderRadius: radius,
          backgroundColor: '#b06a4f',
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: 'var(--font-hanken), sans-serif',
          fontSize,
          fontWeight: 700,
          letterSpacing: '-0.01em',
          color: '#2e2a24',
          lineHeight: 1,
        }}
      >
        FlowDesk
      </span>
    </span>
  )
}
