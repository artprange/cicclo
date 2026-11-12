const currencyFormatter = new Intl.NumberFormat('pt-BR', {
	style: 'currency',
	currency: 'BRL',
});

function formatCurrency(cents: number): string {
	return currencyFormatter.format(cents / 100);
}

export { formatCurrency };
