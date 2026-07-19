import { usePrice } from "./use-price";

type RowProps = { symbol: string };

export function StoreRow({ symbol }: RowProps) {
  const price = usePrice(symbol);

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
