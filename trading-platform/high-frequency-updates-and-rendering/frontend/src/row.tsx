type RowProps = { symbol: string; price: number };

export function Row({ symbol, price }: RowProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 16,
        fontFamily: "monospace",
        padding: "2px 8px",
      }}
    >
      <span style={{ width: 80 }}>{symbol}</span>
      <span style={{ width: 100, textAlign: "right" }}>{price.toFixed(2)}</span>
    </div>
  );
}
