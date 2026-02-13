export function minorToMajor(amountMinor: number) {
  return Number((amountMinor / 100).toFixed(2))
}

export function formatInrFromMinor(amountMinor: number) {
  return minorToMajor(amountMinor).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
